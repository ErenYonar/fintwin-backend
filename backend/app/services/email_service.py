# -*- coding: utf-8 -*-
"""OTP üretimi ve mail gönderimi – Brevo HTTP API."""

import random
import string
import requests
from app.core.security import SMTP_USER, FROM_NAME

import os
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


def build_otp_email(otp_code: str, lang: str, email: str) -> tuple[str, str]:
    deep_link = f"fintwin://verify?code={otp_code}&email={email}"
    web_link  = f"https://fintwin.app/verify?code={otp_code}&email={email}"

    if lang == "EN":
        subject = "FinTwin – Your Verification Code"
        header  = "Email Verification"
        body1   = "Your verification code for FinTwin is:"
        body2   = "This code expires in <strong>5 minutes</strong> and is single-use."
        body3   = "Tap the button below to verify automatically:"
        btn_txt = "Open in FinTwin"
        manual  = "Or enter the code manually in the app."
        footer1 = "If you didn't request this, ignore this email."
        footer2 = "FinTwin Personal Finance Assistant"
    else:
        subject = "FinTwin – Doğrulama Kodunuz"
        header  = "E-posta Doğrulama"
        body1   = "FinTwin için doğrulama kodunuz:"
        body2   = "Bu kod <strong>5 dakika</strong> içinde geçerliliğini yitirir ve tek kullanımlıktır."
        body3   = "Uygulamayı açmak için aşağıdaki butona dokunun:"
        btn_txt = "FinTwin'le Aç"
        manual  = "Ya da kodu uygulamaya manuel olarak girin."
        footer1 = "Bu kodu siz talep etmediyseniz e-postayı görmezden gelin."
        footer2 = "FinTwin Kişisel Finans Asistanı"

    html = f"""<!DOCTYPE html>
<html lang="{'en' if lang == 'EN' else 'tr'}">
<head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:Inter,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;min-height:100vh;">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="100%" style="max-width:480px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(99,102,241,.12);">
      <tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 32px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🏦</div>
        <div style="color:white;font-size:22px;font-weight:800;">FinTwin</div>
        <div style="color:rgba(255,255,255,.8);font-size:13px;margin-top:4px;">{header}</div>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="color:#64748B;font-size:14px;margin:0 0 20px;">{body1}</p>
        <div style="background:#F0F4FF;border:2px dashed #6366F1;border-radius:16px;padding:24px;text-align:center;margin:0 0 20px;">
          <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#6366F1;font-family:monospace;">{otp_code}</div>
        </div>
        <p style="color:#64748B;font-size:13px;margin:0 0 12px;">{body2}</p>
        <p style="color:#64748B;font-size:13px;margin:0 0 20px;">{body3}</p>
        <div style="text-align:center;margin-bottom:12px;">
          <a href="{deep_link}"
             onclick="setTimeout(function(){{window.location='{web_link}';}},1500);return true;"
             style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-decoration:none;padding:16px 40px;border-radius:14px;font-weight:700;font-size:15px;">{btn_txt}</a>
        </div>
        <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">{manual}</p>
      </td></tr>
      <tr><td style="background:#F8FAFC;padding:18px 32px;border-top:1px solid #E2E8F0;">
        <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">
          {footer1}<br><strong style="color:#64748B;">{footer2}</strong>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""
    return subject, html


def send_otp_email(to_email: str, otp_code: str, lang: str) -> bool:
    try:
        subject, html_body = build_otp_email(otp_code, lang, to_email)

        payload = {
            "sender": {"name": FROM_NAME, "email": "erenyonar001@gmail.com"},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_body
        }

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": BREVO_API_KEY
        }

        response = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=15)

        if response.status_code == 201:
            return True
        else:
            print(f"[OTP BREVO HATA] {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"[OTP BREVO HATA] {e}")
        return False
