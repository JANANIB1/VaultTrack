from datetime import date, datetime, timedelta


# DATE RESOLUTION (for log_expense & updates)
def resolve_date(params):
    """
    Resolves a single date from Dialogflow parameters.
    Priority:
    1. date
    2. date-time
    3. date-period.startDate
    4. today
    """
    if params.get("date"):
        return params["date"]

    if params.get("date-time"):
        return params["date-time"][:10]

    if params.get("date-period"):
        return params["date-period"].get("startDate")

    return date.today().isoformat()


# -------------------------------------------------
# DATE RANGE RESOLUTION (for expense_summary)
# -------------------------------------------------
def resolve_date_range(params):
    """
    Returns (start_date, end_date) as ISO strings.
    Handles:
    - today
    - yesterday
    - last week
    - this month
    """
    if params.get("date-period"):
        period = params["date-period"]
        return period.get("startDate"), period.get("endDate")

    if params.get("date"):
        d = params["date"]
        return d, d

    # Default → today
    today = date.today().isoformat()
    return today, today

def normalize_category(category: str):
    if not category:
        return None

    category = category.lower()

    mapping = {
        "groceries": "food",
        "restaurant": "food",
        "cinema": "entertainment",
        "movie": "entertainment",
        "uber": "transport",
        "taxi": "transport",
        "electricity": "bills"
    }

    return mapping.get(category, category)


# -------------------------------------------------
# CATEGORY AUTO-DETECTION (Fallback Intelligence)
# -------------------------------------------------
def auto_detect_category(text: str):
    """
    Detects expense category from description text
    if Dialogflow fails to extract it.
    """
    if not text:
        return None

    text = text.lower()

    rules = {
        "food": ["lunch", "dinner", "breakfast", "snacks", "restaurant", "coffee"],
        "transport": ["uber", "ola", "taxi", "bus", "metro", "train", "fuel"],
        "entertainment": ["movie", "cinema", "tickets", "concert", "netflix", "show"],
        "bills": ["electricity", "water", "wifi", "rent", "gas", "bill"],
        "shopping": ["shopping", "clothes", "shoes", "amazon", "flipkart"],
        "health": ["doctor", "medicine", "hospital", "pharmacy"],
        "education": ["books", "course", "fees", "exam"],
        "subscriptions": ["subscription", "spotify", "prime"]
    }

    for category, keywords in rules.items():
        if any(word in text for word in keywords):
            return category

    return None
