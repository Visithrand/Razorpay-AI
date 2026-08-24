"""Twilio SMS Gateway Service."""

from __future__ import annotations
import logging
from app.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

logger = logging.getLogger(__name__)


def send_otp_sms(phone_number: str, otp: str) -> bool:
    """
    Sends an OTP SMS using Twilio.
    Returns True if sent successfully, False otherwise.
    """
    # Prepend +91 for Indian numbers if not already formatted in E.164
    formatted_phone = phone_number
    if not phone_number.startswith("+"):
        if len(phone_number) == 10:
            formatted_phone = f"+91{phone_number}"
        elif len(phone_number) == 12 and phone_number.startswith("91"):
            formatted_phone = f"+{phone_number}"
        else:
            formatted_phone = f"+91{phone_number}" # default fallback

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        logger.warning(
            f"[SMS MOCK SERVICE] Twilio credentials not configured. "
            f"Simulated SMS with OTP '{otp}' sent to {formatted_phone}"
        )
        return False

    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"Your Settlement Copilot verification code is: {otp}. Valid for 10 minutes.",
            from_=TWILIO_PHONE_NUMBER,
            to=formatted_phone
        )
        logger.info(f"[SMS SERVICE] SMS sent successfully. Message SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"[SMS SERVICE] Failed to send SMS via Twilio: {e}")
        return False
