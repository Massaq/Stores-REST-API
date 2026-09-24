
from celery_app import celery_app


@celery_app.task
def send_user_registration_email(username: str) -> dict:
    print(f"[Celery] Надсилаємо welcome-email користувачу '{username}'...")
    return {"status": "sent", "username": username}
