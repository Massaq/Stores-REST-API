from celery_app import celery_app


@celery_app.task
def send_user_registration_email(username: str) -> dict[str, str]:
    print(f"[Celery] Sending welcome email to user '{username}'...")
    return {"status": "sent", "username": username}
