from .models import AuditLog


def create_audit_log(
    user,
    action,
    description,
    model_name="",
    object_id=""
):
    AuditLog.objects.create(
        user=user,
        action=action,
        description=description,
        model_name=model_name,
        object_id=str(object_id) if object_id else "",
    )