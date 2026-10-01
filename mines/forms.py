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

    def clean_latitude(self):
        value = self.cleaned_data.get("latitude")
        if value is not None and not (-90 <= float(value) <= 90):
            raise forms.ValidationError("Latitude must be between -90 and 90.")
        return value

    def clean_longitude(self):
        value = self.cleaned_data.get("longitude")
        if value is not None and not (-180 <= float(value) <= 180):
            raise forms.ValidationError("Longitude must be between -180 and 180.")
        return value

    def clean(self):
        cleaned = super().clean()
        # Limit manager dropdown to MANAGER users even outside admin.
        manager = cleaned.get("manager")
        if manager is not None and getattr(manager, "role", None) != "MANAGER":
            self.add_error("manager", "Manager must be a user with MANAGER role.")
        return cleaned

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

    def clean(self):
        cleaned = super().clean()
        inspection = cleaned.get("inspection")
        mine = cleaned.get("mine")
        if inspection is not None and mine is not None:
            if inspection.mine_id != mine.id:
                raise forms.ValidationError(
                    "Selected inspection belongs to a different mine. "
                    f"Inspection is for '{inspection.mine}', "
                    f"but violation mine is '{mine}'."
                )
        due = cleaned.get("due_date")
        resolved = cleaned.get("resolved_date")
        if due and resolved and resolved < due:
            self.add_error(
                "resolved_date",
                "Resolved date cannot be before due date."
            )
        return cleaned

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

    def clean(self):
        from datetime import date, timedelta
        cleaned = super().clean()
        # Auto-sync status from expiry date so DB never drifts.
        expiry = cleaned.get("expiry_date")
        if expiry:
            today = date.today()
            if expiry < today:
                cleaned["status"] = "EXPIRED"
            elif expiry <= today + timedelta(days=30):
                cleaned["status"] = "EXPIRING"
            else:
                cleaned["status"] = "VALID"
        issue = cleaned.get("issue_date")
        if issue and expiry and expiry < issue:
            self.add_error(
                "expiry_date",
                "Expiry date cannot be before issue date."
            )
        return cleaned

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