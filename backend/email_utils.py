import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
EMAIL_USER     = os.getenv("EMAIL_USER")


def send_alert(category: str, spent: float, limit: float) -> None:
   
    percentage = round((spent / limit) * 100, 1) if limit else 0
    over_by    = round(spent - limit, 2)

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Budget Alert</title>
    </head>
    <body style="margin:0;padding:0;background:#f6f5f1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f1;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border:1px solid #e4e3dc;border-radius:12px;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td style="background:#15803d;padding:28px 36px;">
                  <p style="margin:0;font-size:13px;color:#bbf7d0;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
                    VaultTrack
                  </p>
                  <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                    Budget Alert
                  </h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px 36px;">

                  <p style="margin:0 0 24px;font-size:15px;color:#3d3d38;line-height:1.6;">
                    Your <strong style="color:#1a1a18;text-transform:capitalize;">{category}</strong>
                    spending has exceeded its monthly limit.
                  </p>

                  <!-- Stat row -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="background:#f6f5f1;border:1px solid #e4e3dc;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                    <tr>
                      <td align="center" style="padding:20px 12px;border-right:1px solid #e4e3dc;">
                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;
                                  font-weight:600;color:#a6a59d;">Spent</p>
                        <p style="margin:0;font-size:22px;font-weight:700;color:#dc2626;
                                  font-family:'Courier New',monospace;letter-spacing:-0.03em;">
                          ₹{spent:,.0f}
                        </p>
                      </td>
                      <td align="center" style="padding:20px 12px;border-right:1px solid #e4e3dc;">
                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;
                                  font-weight:600;color:#a6a59d;">Limit</p>
                        <p style="margin:0;font-size:22px;font-weight:700;color:#1a1a18;
                                  font-family:'Courier New',monospace;letter-spacing:-0.03em;">
                          ₹{limit:,.0f}
                        </p>
                      </td>
                      <td align="center" style="padding:20px 12px;">
                        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;
                                  font-weight:600;color:#a6a59d;">Usage</p>
                        <p style="margin:0;font-size:22px;font-weight:700;color:#ea580c;
                                  font-family:'Courier New',monospace;letter-spacing:-0.03em;">
                          {percentage}%
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Over-by callout -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                         style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:14px 18px;">
                        <p style="margin:0;font-size:13px;color:#dc2626;font-weight:600;">
                          ⚠&nbsp; Over budget by ₹{over_by:,.2f}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 8px;font-size:14px;color:#3d3d38;line-height:1.6;">
                    Consider reviewing your recent <strong style="text-transform:capitalize;">
                    {category}</strong> transactions to understand this spike.
                  </p>

                  <p style="margin:0;font-size:14px;color:#3d3d38;line-height:1.6;">
                    You can view your full budget breakdown on your
                    <a href="https://vault-track.vercel.app/budgets"
                       style="color:#15803d;font-weight:600;text-decoration:none;">
                      VaultTrack dashboard →
                    </a>
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 36px;border-top:1px solid #e4e3dc;background:#f9f8f5;">
                  <p style="margin:0;font-size:12px;color:#a6a59d;line-height:1.5;">
                    This is an automated alert from VaultTrack. You are receiving this because
                    a budget threshold was exceeded for your account.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
    """

    plain_text = (
        f"VaultTrack — Budget Alert\n\n"
        f"Category : {category.capitalize()}\n"
        f"Spent    : ₹{spent:,.0f}\n"
        f"Limit    : ₹{limit:,.0f}\n"
        f"Usage    : {percentage}%\n"
        f"Over by  : ₹{over_by:,.2f}\n\n"
        f"View your dashboard: https://vault-track.vercel.app/budgets"
    )

    try:
        resend.Emails.send({
            "from":    "VaultTrack <onboarding@resend.dev>",
            "to":      [EMAIL_USER],
            "subject": f"Budget Alert: {category.capitalize()} at {percentage}%",
            "html":    html,
            "text":    plain_text,
        })
        print("EMAIL SENT")

    except Exception as error:
        print("EMAIL FAILED", error)