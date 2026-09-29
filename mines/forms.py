from django import forms

from .models import (
    Compliance,
    Inspection,
    Mine,
    Violation,
    Contractor,
    ContractorDocument,
)


class MineForm(forms.ModelForm):

    class Meta:
        model = Mine

        fields = [
            "name",
            "mine_code",
            "subsidiary",
            "location",
            "state",
            "district",
            "latitude",
            "longitude",
            "manager",
            "status",
            "production_capacity",
        ]

        widgets = {
            "name": forms.TextInput(
                attrs={
                    "placeholder": "Enter mine name"
                }
            ),

            "mine_code": forms.TextInput(
                attrs={
                    "placeholder": "Example: MINE-001"
                }
            ),

            "subsidiary": forms.TextInput(
                attrs={
                    "placeholder": "Enter subsidiary"
                }
            ),

            "location": forms.TextInput(
                attrs={
                    "placeholder": "Enter location"
                }
            ),

            "state": forms.TextInput(
                attrs={
                    "placeholder": "Enter state"
                }
            ),

            "district": forms.TextInput(
                attrs={
                    "placeholder": "Enter district"
                }
            ),

            "latitude": forms.NumberInput(
                attrs={
                    "step": "0.000001",
                    "placeholder": "Example: 23.7957"
                }
            ),

            "longitude": forms.NumberInput(
                attrs={
                    "step": "0.000001",
                    "placeholder": "Example: 86.4304"
                }
            ),

            "production_capacity": forms.NumberInput(
                attrs={
                    "step": "0.01",
                    "placeholder": "Annual capacity in tonnes"
                }
            ),
        }


class ComplianceForm(forms.ModelForm):

    class Meta:
        model = Compliance

        fields = [
            "mine",
            "requirement",
            "category",
            "description",
            "due_date",
            "status",
            "responsible_person",
            "completed_date",
        ]

        widgets = {
            "requirement": forms.TextInput(
                attrs={
                    "placeholder": "Enter compliance requirement"
                }
            ),

            "description": forms.Textarea(
                attrs={
                    "placeholder": "Describe the compliance requirement",
                    "rows": 4
                }
            ),

            "due_date": forms.DateInput(
                attrs={
                    "type": "date"
                }
            ),

            "completed_date": forms.DateInput(
                attrs={
                    "type": "date"
                }
            ),
        }


class InspectionForm(forms.ModelForm):

    class Meta:
        model = Inspection

        fields = [
            "mine",
            "inspector",
            "inspection_type",
            "inspection_date",
            "status",
            "findings",
            "remarks",
        ]

        widgets = {
            "inspection_date": forms.DateInput(
                attrs={"type": "date"}
            ),
            "findings": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Enter inspection findings..."
                }
            ),
            "remarks": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Enter additional remarks..."
                }
            ),
        }

class ViolationForm(forms.ModelForm):

    class Meta:
        model = Violation

        fields = [
            "inspection",
            "mine",
            "title",
            "description",
            "severity",
            "status",
            "corrective_action",
            "assigned_to",
            "due_date",
            "resolved_date",
            "remarks",
        ]

        widgets = {
            "description": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Describe the violation..."
                }
            ),

            "corrective_action": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Describe the corrective action required..."
                }
            ),

            "due_date": forms.DateInput(
                attrs={"type": "date"}
            ),

            "resolved_date": forms.DateInput(
                attrs={"type": "date"}
            ),

            "remarks": forms.Textarea(
                attrs={
                    "rows": 3,
                    "placeholder": "Additional remarks..."
                }
            ),
        }


class ContractorForm(forms.ModelForm):

    class Meta:
        model = Contractor

        fields = [
            "name",
            "contractor_code",
            "company_name",
            "contact_person",
            "phone",
            "email",
            "address",
            "mine",
            "work_description",
            "start_date",
            "end_date",
            "status",
        ]

        widgets = {
            "address": forms.Textarea(
                attrs={
                    "rows": 3
                }
            ),

            "work_description": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Describe the contractor's work..."
                }
            ),

            "start_date": forms.DateInput(
                attrs={"type": "date"}
            ),

            "end_date": forms.DateInput(
                attrs={"type": "date"}
            ),
        }


class ContractorDocumentForm(forms.ModelForm):

    class Meta:
        model = ContractorDocument

        fields = [
            "contractor",
            "document_type",
            "document_number",
            "issue_date",
            "expiry_date",
            "issuing_authority",
            "status",
            "remarks",
        ]

        widgets = {
            "issue_date": forms.DateInput(
                attrs={"type": "date"}
            ),

            "expiry_date": forms.DateInput(
                attrs={"type": "date"}
            ),

            "remarks": forms.Textarea(
                attrs={
                    "rows": 3,
                    "placeholder": "Additional remarks..."
                }
            ),
        }