from io import BytesIO
from datetime import timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from django.utils import timezone

from .models import (
    Compliance,
    Inspection,
    Violation,
    ContractorDocument,
)
from .risk_engine import calculate_mine_risk


def build_mine_compliance_report(mine):
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=22,
        spaceAfter=15,
    )

    heading_style = ParagraphStyle(
        "ReportHeading",
        parent=styles["Heading2"],
        fontSize=15,
        spaceBefore=15,
        spaceAfter=8,
    )

    normal_style = styles["BodyText"]

    story = []

    story.append(
        Paragraph(
            "COALiZEN - Mine Compliance Report",
            title_style,
        )
    )

    story.append(
        Paragraph(
            f"Generated: {timezone.localtime().strftime('%d %B %Y, %H:%M')}",
            normal_style,
        )
    )

    story.append(Spacer(1, 15))

    # Mine information

    story.append(
        Paragraph("Mine Information", heading_style)
    )

    mine_data = [
        ["Mine Name", mine.name],
        ["Mine Code", mine.mine_code],
        ["Location", mine.location],
        ["State", mine.state],
        ["District", mine.district],
        ["Status", mine.get_status_display()],
    ]

    table = Table(
        mine_data,
        colWidths=[150, 350],
    )

    table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(table)

    # Compliance

    story.append(
        Paragraph("Compliance Summary", heading_style)
    )

    today = timezone.localdate()

    compliances = Compliance.objects.filter(
        mine=mine
    )

    completed = compliances.filter(
        status="COMPLETED"
    ).count()

    pending = compliances.filter(
        status="PENDING"
    ).count()

    overdue = compliances.filter(
        status="PENDING",
        due_date__lt=today,
    ).count()

    compliance_data = [
        ["Metric", "Count"],
        ["Total Requirements", str(compliances.count())],
        ["Completed", str(completed)],
        ["Pending", str(pending)],
        ["Overdue", str(overdue)],
    ]

    table = Table(
        compliance_data,
        colWidths=[300, 200],
    )

    table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(table)

    # Violations

    story.append(
        Paragraph("Violations", heading_style)
    )

    violations = Violation.objects.filter(
        mine=mine
    )

    violation_data = [
        ["Title", "Severity", "Status"]
    ]

    for violation in violations:
        violation_data.append([
            violation.title,
            violation.get_severity_display(),
            violation.get_status_display(),
        ])

    if len(violation_data) == 1:
        violation_data.append([
            "No violations recorded",
            "-",
            "-",
        ])

    table = Table(
        violation_data,
        colWidths=[250, 120, 130],
    )

    table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )

    story.append(table)

    # Inspections

    story.append(
        Paragraph("Inspections", heading_style)
    )

    inspections = Inspection.objects.filter(
        mine=mine
    )

    inspection_data = [
        ["Date", "Type", "Status"]
    ]

    for inspection in inspections:
        inspection_data.append([
            str(inspection.inspection_date),
            inspection.get_inspection_type_display(),
            inspection.get_status_display(),
        ])

    if len(inspection_data) == 1:
        inspection_data.append([
            "No inspections recorded",
            "-",
            "-",
        ])

    table = Table(
        inspection_data,
        colWidths=[130, 180, 190],
    )

    table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 6),
        ])
    )

    story.append(table)

    # Contractor documents

    story.append(
        Paragraph(
            "Contractor Document Status",
            heading_style,
        )
    )

    contractors = mine.contractors.all()

    documents = ContractorDocument.objects.filter(
        contractor__in=contractors
    )

    expired = documents.filter(
        expiry_date__lt=today
    ).count()

    expiring = documents.filter(
        expiry_date__gte=today,
        expiry_date__lte=today + timedelta(days=30),
    ).count()

    valid = documents.count() - expired - expiring

    document_data = [
        ["Status", "Count"],
        ["Valid", str(valid)],
        ["Expiring", str(expiring)],
        ["Expired", str(expired)],
    ]

    table = Table(
        document_data,
        colWidths=[300, 200],
    )

    table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(table)

    # Risk

    story.append(
        Paragraph("Current Risk Assessment", heading_style)
    )

    risk = calculate_mine_risk(mine)

    risk_data = [
        ["Risk Score", str(risk["score"])],
        ["Risk Level", risk["level"]],
    ]

    if risk["factors"]:
        risk_data.append([
            "Risk Factors",
            "; ".join(risk["factors"]),
        ])
    else:
        risk_data.append([
            "Risk Factors",
            "No significant risk factors detected.",
        ])

    table = Table(
        risk_data,
        colWidths=[150, 350],
    )

    table.setStyle(
        TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
            ("PADDING", (0, 0), (-1, -1), 7),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ])
    )

    story.append(table)

    story.append(Spacer(1, 20))

    story.append(
        Paragraph(
            "Generated by COALiZEN Coal Governance Platform",
            normal_style,
        )
    )

    document.build(story)

    buffer.seek(0)

    return buffer