import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from email_utils import send_alert
from database import init_db, get_connection
from nlp_utils import (
    resolve_date,
    resolve_date_range,
    auto_detect_category,
    normalize_category
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
init_db()


# ================= GET ALL EXPENSES =================
@app.get("/expenses")
def get_expenses():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, amount, category, date, description
        FROM transactions
        ORDER BY date DESC
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    expenses = [
        {
            "id":          row[0],
            "amount":      float(row[1]),
            "category":    row[2],
            "date":        row[3],
            "description": row[4],
        }
        for row in rows
    ]

    return {"expenses": expenses}


# ================= GET BUDGETS =================
@app.get("/budgets")
def get_budgets():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT category, monthly_limit, alert_threshold
        FROM budgets
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    budgets = [
        {
            "category":        row[0],
            "monthly_limit":   float(row[1]),
            "alert_threshold": float(row[2]),
        }
        for row in rows
    ]

    return {"budgets": budgets}


# ================= GET SUMMARY =================
@app.get("/summary")
def get_summary():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT category, SUM(amount)
        FROM transactions
        GROUP BY category
    """)

    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    summary = []
    total   = 0

    for row in rows:
        amount = float(row[1])
        summary.append({"category": row[0], "amount": amount})
        total += amount

    return {"summary": summary, "total_spent": total}


# ================= DIALOGFLOW WEBHOOK =================
@app.post("/webhook")
async def dialogflow_webhook(request: Request):
    req    = await request.json()
    intent = req["queryResult"]["intent"]["displayName"]
    params = req["queryResult"]["parameters"]

    conn   = get_connection()
    cursor = conn.cursor()

    # ──────────── LOG EXPENSE ────────────
    if intent == "log_expense":
        amount       = params.get("amount")
        category     = params.get("category")
        description  = params.get("description") or ""
        expense_date = resolve_date(params)

        if not amount:
            cursor.close()
            conn.close()
            return {"fulfillmentText": "How much did you spend?"}

        if not category:
            detected = auto_detect_category(description)
            if detected:
                category = detected
            else:
                cursor.close()
                conn.close()
                return {"fulfillmentText": "What category was this expense?"}

        category = normalize_category(category)

        cursor.execute(
            """
            INSERT INTO transactions (amount, category, date, description)
            VALUES (%s, %s, %s, %s)
            """,
            (amount, category, expense_date, description)
        )

        # ── budget check ──
        alert_message = ""

        cursor.execute(
            """
            SELECT monthly_limit, alert_threshold
            FROM budgets
            WHERE category = %s
            """,
            (category,)
        )
        budget = cursor.fetchone()

        if budget:
            monthly_limit, threshold = float(budget[0]), float(budget[1])

            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE category = %s
                AND   date LIKE %s
                """,
                (category, expense_date[:7] + "%")
            )

            spent = float(cursor.fetchone()[0])

            if spent >= monthly_limit * threshold:
                try:
                    send_alert(category, spent, monthly_limit)
                except Exception as e:
                    print("EMAIL ERROR:", e)
                    alert_message = (
                        f" ⚠️ Budget alert: You've spent ₹{int(spent)} of "
                        f"your ₹{int(monthly_limit)} {category} budget "
                        f"({int((spent / monthly_limit) * 100)}%)."
                    )

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "fulfillmentText": (
                f"Logged ₹{amount} under *{category}* on {expense_date}.{alert_message}"
            )
        }

    # ──────────── UPDATE EXPENSE DATE ────────────
    if intent == "update_expense_date":
        new_date = resolve_date(params)

        cursor.execute(
            """
            UPDATE transactions
            SET date = %s
            WHERE id = (
                SELECT id FROM transactions
                ORDER BY id DESC
                LIMIT 1
            )
            """,
            (new_date,)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return {"fulfillmentText": f"Updated the expense date to {new_date}."}

    # ──────────── EXPENSE SUMMARY ────────────
    if intent == "expense_summary":
        category   = params.get("category")
        start_date, end_date = resolve_date_range(params)

        if category:
            category = normalize_category(category)

        query  = """
            SELECT category, SUM(amount)
            FROM transactions
            WHERE date BETWEEN %s AND %s
        """
        values = [start_date, end_date]

        if category:
            query  += " AND category = %s"
            values.append(category)

        query += " GROUP BY category"

        cursor.execute(query, values)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            return {"fulfillmentText": "No expenses found for this period."}

        total     = sum(float(row[1]) for row in rows)
        breakdown = "\n".join(
            f"• {cat.capitalize()}: ₹{int(float(amt))}"
            for cat, amt in rows
        )

        return {
            "fulfillmentText": (
                f"Here's your expense summary:\n{breakdown}\n\nTotal spent: ₹{int(total)}"
            )
        }

    # ──────────── BUDGET STATUS ────────────
    if intent == "budget_status":
        category = params.get("category")

        if not category:
            cursor.close()
            conn.close()
            return {
                "fulfillmentText": "Which category do you want the budget status for?"
            }

        category = normalize_category(category)

        cursor.execute(
            "SELECT monthly_limit FROM budgets WHERE category = %s",
            (category,)
        )
        budget = cursor.fetchone()

        if not budget:
            cursor.close()
            conn.close()
            return {"fulfillmentText": f"No budget set for {category}."}

        monthly_limit = float(budget[0])
        today         = resolve_date({})
        month_prefix  = today[:7] + "%"

        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE category = %s
            AND   date LIKE %s
            """,
            (category, month_prefix)
        )

        spent     = float(cursor.fetchone()[0])
        remaining = monthly_limit - spent

        cursor.close()
        conn.close()

        if remaining >= 0:
            return {
                "fulfillmentText": (
                    f"{category.capitalize()} budget: ₹{int(monthly_limit)}\n"
                    f"Spent this month: ₹{int(spent)}\n"
                    f"Remaining budget: ₹{int(remaining)}"
                )
            }
        else:
            return {
                "fulfillmentText": (
                    f"{category.capitalize()} budget: ₹{int(monthly_limit)}\n"
                    f"Spent this month: ₹{int(spent)}\n"
                    f"Over budget by: ₹{int(abs(remaining))}"
                )
            }

    # ──────────── SET BUDGET ────────────
    if intent == "set_budget":
        amount   = params.get("amount")
        category = params.get("category")

        if not amount or not category:
            cursor.close()
            conn.close()
            return {
                "fulfillmentText": "Please specify the budget amount and category."
            }

        category = normalize_category(category)

        
        cursor.execute(
            """
            INSERT INTO budgets (category, monthly_limit, alert_threshold)
            VALUES (%s, %s, %s)
            ON CONFLICT (category)
            DO UPDATE SET
                monthly_limit   = EXCLUDED.monthly_limit,
                alert_threshold = EXCLUDED.alert_threshold
            """,
            (category, amount, 0.8)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "fulfillmentText": f"Budget set: ₹{amount} per month for {category}."
        }

    # ──────────── EXPORT EXPENSES ────────────
    if intent == "export_expenses":

        cursor.execute("""
            SELECT amount, category, date, description
            FROM transactions
            ORDER BY date DESC
        """)

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            return {"fulfillmentText": "No expenses found to export."}

        df        = pd.DataFrame(rows, columns=["Amount", "Category", "Date", "Description"])
        file_name = "expense_report.csv"
        df.to_csv(file_name, index=False)

        return {
            "fulfillmentText": f"Expense report exported successfully as {file_name}."
        }

    # ──────────── FALLBACK ────────────
    cursor.close()
    conn.close()
    return {"fulfillmentText": "Sorry, I couldn't understand that. Can you rephrase?"}