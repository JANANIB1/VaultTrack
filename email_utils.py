import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


def send_alert(category, spent, limit):

    msg = MIMEText(
        f"⚠️ Budget Alert!\n\n"
        f"You’ve spent ₹{spent} out of ₹{limit} on {category}."
    )

    msg["Subject"] = f"Budget Alert: {category}"
    msg["From"] = EMAIL_USER
    msg["To"] = EMAIL_USER

    server = smtplib.SMTP("smtp.gmail.com", 587)

    server.starttls()

    server.login(EMAIL_USER, EMAIL_PASS)

    server.send_message(msg)

    server.quit()