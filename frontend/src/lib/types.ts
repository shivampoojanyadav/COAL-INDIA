/* ============================================================================
   Domain types — 1:1 with the Django ORM in `mines/models.py` + `accounts/models.py`.
   Field names match the model field names so the DRF serializer swap is
   mechanical: Django emits snake_case, and nothing here needs renaming.
   ========================================================================== */

/* ---------------------------------------------------------------- accounts */

export const ROLES = [
  'ADMIN',
  'MANAGER',
  'INSPECTOR',
  'SAFETY_OFFICER',
  'CONTRACTOR',
  'REGULATOR',
] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Mine Manager',
  INSPECTOR: 'Inspector',
  SAFETY_OFFICER: 'Safety Officer',
  CONTRACTOR: 'Contractor',
  REGULATOR: 'Regulatory Officer',
}

export const ROLE_SHORT: Record<Role, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  INSPECTOR: 'Inspector',
  SAFETY_OFFICER: 'Safety',
  CONTRACTOR: 'Contractor',
  REGULATOR: 'Regulator',
}

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  role: Role
  is_active: boolean
  is_staff: boolean
}

/* ------------------------------------------------------------------- mines */

export const MINE_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const
export type MineStatus = (typeof MINE_STATUSES)[number]

export const MINE_STATUS_LABELS: Record<MineStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Under Maintenance',
}

export interface Mine {
  id: number
  name: string
  mine_code: string
  subsidiary: string
  location: string
  state: string
  district: string
  latitude: string | null
  longitude: string | null
  manager: number | null
  manager_name: string | null
  status: MineStatus
  production_capacity: string | null
  risk_score: string
  risk_level: RiskLevel
  risk_updated_at: string | null
  created_at: string
  updated_at: string
}

/* --------------------------------------------------------------- compliance */

export const COMPLIANCE_CATEGORIES = [
  'SAFETY',
  'ENVIRONMENT',
  'PRODUCTION',
  'LABOUR',
  'OTHER',
] as const
export type ComplianceCategory = (typeof COMPLIANCE_CATEGORIES)[number]

export const COMPLIANCE_CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  SAFETY: 'Safety',
  ENVIRONMENT: 'Environment',
  PRODUCTION: 'Production',
  LABOUR: 'Labour',
  OTHER: 'Other',
}

export type ComplianceStatus = 'PENDING' | 'COMPLETED'
export type MonitoringStatus = 'COMPLETED' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'

export interface Compliance {
  id: number
  mine: number
  mine_name: string
  requirement: string
  category: ComplianceCategory
  description: string
  due_date: string
  status: ComplianceStatus
  responsible_person: number | null
  responsible_person_name: string | null
  completed_date: string | null
  monitoring_status: MonitoringStatus
  created_at: string
  updated_at: string
}

/* -------------------------------------------------------------- inspections */

export const INSPECTION_TYPES = [
  'ROUTINE',
  'SAFETY',
  'ENVIRONMENT',
  'SURPRISE',
  'COMPLIANCE',
] as const
export type InspectionType = (typeof INSPECTION_TYPES)[number]

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  ROUTINE: 'Routine Inspection',
  SAFETY: 'Safety Inspection',
  ENVIRONMENT: 'Environmental Inspection',
  SURPRISE: 'Surprise Inspection',
  COMPLIANCE: 'Compliance Inspection',
}

export type InspectionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export interface Inspection {
  id: number
  mine: number
  mine_name: string
  inspector: number | null
  inspector_name: string | null
  inspection_type: InspectionType
  inspection_date: string
  status: InspectionStatus
  findings: string
  remarks: string
  violation_count: number
  created_at: string
  updated_at: string
}

/* --------------------------------------------------------------- violations */

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export type ViolationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export const VIOLATION_STATUS_LABELS: Record<ViolationStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export interface Violation {
  id: number
  inspection: number
  inspection_date: string | null
  mine: number
  mine_name: string
  title: string
  description: string
  severity: Severity
  status: ViolationStatus
  corrective_action: string
  assigned_to: number | null
  assigned_to_name: string | null
  due_date: string | null
  resolved_date: string | null
  remarks: string
  created_at: string
  updated_at: string
}

/* -------------------------------------------------------------- contractors */

export type ContractorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export const CONTRACTOR_STATUS_LABELS: Record<ContractorStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
}

export interface Contractor {
  id: number
  name: string
  contractor_code: string
  company_name: string
  contact_person: string
  phone: string
  email: string
  address: string
  mine: number
  mine_name: string
  work_description: string
  start_date: string
  end_date: string | null
  status: ContractorStatus
  document_count: number
  expiring_document_count: number
  created_at: string
  updated_at: string
}

export const DOCUMENT_TYPES = [
  'LICENSE',
  'SAFETY_CERTIFICATE',
  'INSURANCE',
  'LABOUR_LICENSE',
  'ENVIRONMENTAL',
  'OTHER',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  LICENSE: 'License',
  SAFETY_CERTIFICATE: 'Safety Certificate',
  INSURANCE: 'Insurance',
  LABOUR_LICENSE: 'Labour License',
  ENVIRONMENTAL: 'Environmental Certificate',
  OTHER: 'Other',
}

export type DocumentStatus = 'VALID' | 'EXPIRING' | 'EXPIRED'

export interface ContractorDocument {
  id: number
  contractor: number
  document_type: DocumentType
  document_number: string
  issue_date: string
  expiry_date: string
  issuing_authority: string
  status: DocumentStatus
  calculated_status: DocumentStatus
  remarks: string
  created_at: string
  updated_at: string
}

/* ------------------------------------------------------------ notifications */

export const NOTIFICATION_TYPES = [
  'COMPLIANCE',
  'VIOLATION',
  'CONTRACTOR',
  'INSPECTION',
  'SYSTEM',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  COMPLIANCE: 'Compliance',
  VIOLATION: 'Violation',
  CONTRACTOR: 'Contractor',
  INSPECTION: 'Inspection',
  SYSTEM: 'System',
}

export interface AppNotification {
  id: number
  recipient: number
  notification_type: NotificationType
  title: string
  message: string
  link: string
  is_read: boolean
  created_at: string
}

/* -------------------------------------------------------------------- risk */

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export interface RiskHistory {
  id: number
  mine: number
  risk_score: string
  risk_level: RiskLevel
  risk_factors: string
  recorded_at: string
}

export interface RiskResult {
  score: number
  level: RiskLevel
  factors: string[]
}

export interface RiskRow {
  mine: Mine
  score: number
  level: RiskLevel
  factors: string[]
  risk_change: number
  /** Recorded history, oldest → newest, for the sparkline. */
  trend: number[]
  ml_score: number
  ml_level: RiskLevel
  explanations: string[]
  recommendations: string[]
}

/* ------------------------------------------------------------------- audit */

export interface AuditLog {
  id: number
  user: number | null
  user_name: string | null
  action: string
  model_name: string
  object_id: string
  description: string
  created_at: string
}

/* --------------------------------------------------------------- analytics */

export interface ChartSlice {
  label: string
  value: number
}

export interface Analytics {
  total_mines: number
  active_mines: number
  inactive_mines: number
  maintenance_mines: number

  total_compliance: number
  completed_compliance: number
  pending_compliance: number
  overdue_compliance: number
  due_soon_compliance: number

  total_inspections: number
  scheduled_inspections: number
  in_progress_inspections: number
  completed_inspections: number
  cancelled_inspections: number

  total_violations: number
  open_violations: number
  in_progress_violations: number
  resolved_violations: number
  closed_violations: number

  critical_violations: number
  high_violations: number
  medium_violations: number
  low_violations: number

  total_contractors: number
  active_contractors: number
  inactive_contractors: number
  suspended_contractors: number

  total_documents: number
  valid_documents: number
  expiring_documents: number
  expired_documents: number

  low_risk: number
  medium_risk: number
  high_risk: number
  critical_risk: number

  mine_status_labels: string[]
  mine_status_data: number[]
  compliance_status_labels: string[]
  compliance_status_data: number[]
  inspection_status_labels: string[]
  inspection_status_data: number[]
  violation_severity_labels: string[]
  violation_severity_data: number[]
  document_status_labels: string[]
  document_status_data: number[]
  risk_labels: string[]
  risk_data: number[]
}

export interface AdminDashboardData {
  total_mines: number
  active_mines: number
  inactive_mines: number
  maintenance_mines: number
  active_users: number
  open_violations: number
  overdue_compliance: number
  upcoming_inspections: number
  active_contractors: number
  expired_documents: number
  risk_summary: Record<RiskLevel, number>
}

export interface ManagerDashboardData {
  total_mines: number
  active_mines: number
  open_violations: number
  overdue_compliance: number
}

export interface ContractorDashboardData {
  total_contractors: number
  active_contractors: number
  inactive_contractors: number
  suspended_contractors: number
  total_documents: number
  expired_documents: number
  expiring_documents: number
}

export interface InspectorDashboardData {
  total_inspections: number
  scheduled: number
  in_progress: number
  completed: number
  cancelled: number
  violations_raised: number
  open_violations: number
}

export interface SafetyDashboardData {
  total_inspections: number
  total_violations: number
  open_violations: number
  critical_violations: number
  high_violations: number
  overdue_compliance: number
  high_risk_mines: number
  critical_risk_mines: number
}

export interface RegulatorDashboardData {
  total_mines: number
  active_mines: number
  total_inspections: number
  total_violations: number
  open_violations: number
  critical_violations: number
  low_risk: number
  medium_risk: number
  high_risk: number
  critical_risk: number
  compliance_rate: number
}
