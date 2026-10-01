/* ============================================================================
   SEED DATA, a deterministic dataset that mirrors the Django ORM exactly, so
   the UI is fully demonstrable with no database and no backend running.

   `mulberry32` gives us a fixed PRNG: the same dataset on every load, which
   matters when you are demoing to a judge.
   ========================================================================== */

import type {
  AuditLog,
  AppNotification,
  Compliance,
  Contractor,
  ContractorDocument,
  DocumentType,
  Inspection,
  InspectionType,
  Mine,
  MineStatus,
  RiskHistory,
  Severity,
  User,
  Violation,
} from '@/lib/types'
import { calculateMineRisk } from '@/lib/risk'

/* --------------------------------------------------------------- PRNG */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(20260301)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min
const chance = (p: number) => rnd() < p

/* --------------------------------------------------------------- dates */

/**
 * Anchored to the real current day (UTC midnight) rather than a hard-coded
 * date. `daysUntil()` in `format.ts` measures against the live clock, so a
 * fixed anchor would eventually mark the entire dataset as overdue.
 */
const TODAY = (() => {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
})()

function dayOffset(days: number): string {
  const d = new Date(TODAY)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function stampOffset(days: number, hour = 9): string {
  const d = new Date(TODAY)
  d.setUTCDate(d.getUTCDate() + days)
  d.setUTCHours(hour, int(0, 59), 0, 0)
  return d.toISOString()
}

/* --------------------------------------------------------------- users */

export const USERS: User[] = [
  { id: 1, username: 'admin', first_name: 'Aarav', last_name: 'Sharma', email: 'admin@CoaliZEN.in', role: 'ADMIN', is_active: true, is_staff: true },
  { id: 2, username: 'manager1', first_name: 'Priya', last_name: 'Raghunathan', email: 'priya@CoaliZEN.in', role: 'MANAGER', is_active: true, is_staff: false },
  { id: 3, username: 'inspector1', first_name: 'Rohit', last_name: 'Banerjee', email: 'rohit@CoaliZEN.in', role: 'INSPECTOR', is_active: true, is_staff: false },
  { id: 4, username: 'safety1', first_name: 'Meera', last_name: 'Nair', email: 'meera@CoaliZEN.in', role: 'SAFETY_OFFICER', is_active: true, is_staff: false },
  { id: 5, username: 'contractor1', first_name: 'Suresh', last_name: 'Yadav', email: 'suresh@CoaliZEN.in', role: 'CONTRACTOR', is_active: true, is_staff: false },
  { id: 6, username: 'regulator1', first_name: 'Ananya', last_name: 'Iyer', email: 'ananya@CoaliZEN.in', role: 'REGULATOR', is_active: true, is_staff: false },
  { id: 7, username: 'manager2', first_name: 'Vikram', last_name: 'Singh', email: 'vikram@CoaliZEN.in', role: 'MANAGER', is_active: true, is_staff: false },
  { id: 8, username: 'manager3', first_name: 'Deepa', last_name: 'Menon', email: 'deepa@CoaliZEN.in', role: 'MANAGER', is_active: true, is_staff: false },
  { id: 9, username: 'inspector2', first_name: 'Karthik', last_name: 'Pillai', email: 'karthik@CoaliZEN.in', role: 'INSPECTOR', is_active: true, is_staff: false },
  { id: 10, username: 'safety2', first_name: 'Ishita', last_name: 'Ghosh', email: 'ishita@CoaliZEN.in', role: 'SAFETY_OFFICER', is_active: true, is_staff: false },
  { id: 11, username: 'contractor2', first_name: 'Ramesh', last_name: 'Kumar', email: 'ramesh@CoaliZEN.in', role: 'CONTRACTOR', is_active: true, is_staff: false },
  { id: 12, username: 'regulator2', first_name: 'Kabir', last_name: 'Malhotra', email: 'kabir@CoaliZEN.in', role: 'REGULATOR', is_active: true, is_staff: false },
]

export const DEMO_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  manager1: 'manager123',
  inspector1: 'inspector123',
  safety1: 'safety123',
  contractor1: 'contractor123',
  regulator1: 'regulator123',
  manager2: 'manager123',
  manager3: 'manager123',
  inspector2: 'inspector123',
  safety2: 'safety123',
  contractor2: 'contractor123',
  regulator2: 'regulator123',
}

const MANAGER_IDS = [2, 7, 8]

/* --------------------------------------------------------------- mines */

interface MineSeed {
  name: string
  code: string
  subsidiary: string
  location: string
  state: string
  district: string
  lat: number
  lon: number
  capacity: number
  status: MineStatus
}

const MINE_SEEDS: MineSeed[] = [
  { name: 'Jharia Colliery', code: 'BCCL-JHA-01', subsidiary: 'BCCL', location: 'Dhanbad', state: 'Jharkhand', district: 'Dhanbad', lat: 23.7957, lon: 86.4304, capacity: 2_940_000, status: 'ACTIVE' },
  { name: 'Giridih Coalfield', code: 'CCL-GIR-02', subsidiary: 'CCL', location: 'Giridih', state: 'Jharkhand', district: 'Giridih', lat: 24.1568, lon: 86.6423, capacity: 1_860_000, status: 'ACTIVE' },
  { name: 'Bokapahari OCP', code: 'CCL-BOK-07', subsidiary: 'CCL', location: 'Bokapahari', state: 'Jharkhand', district: 'Ramgarh', lat: 23.6681, lon: 86.1568, capacity: 3_400_000, status: 'ACTIVE' },
  { name: 'Khalari Open Cast', code: 'WCL-KHL-11', subsidiary: 'WCL', location: 'Khalari', state: 'Madhya Pradesh', district: 'Balaghat', lat: 21.8333, lon: 79.6667, capacity: 1_120_000, status: 'ACTIVE' },
  { name: 'Mandira Washery', code: 'WCL-MND-14', subsidiary: 'WCL', location: 'Ib Valley', state: 'Odisha', district: 'Sundargarh', lat: 22.1900, lon: 84.6300, capacity: 2_250_000, status: 'MAINTENANCE' },
  { name: 'Basundhara West OCP', code: 'MCL-BSW-21', subsidiary: 'MCL', location: 'Sundargarh', state: 'Odisha', district: 'Sundargarh', lat: 22.3400, lon: 84.2100, capacity: 4_100_000, status: 'ACTIVE' },
  { name: 'Basundhara East OCP', code: 'MCL-BSE-22', subsidiary: 'MCL', location: 'Angul', state: 'Odisha', district: 'Angul', lat: 22.0100, lon: 84.8800, capacity: 3_750_000, status: 'ACTIVE' },
  { name: 'Talcher Colliery', code: 'MCL-TLC-23', subsidiary: 'MCL', location: 'Talcher', state: 'Odisha', district: 'Angul', lat: 20.9000, lon: 84.9000, capacity: 1_980_000, status: 'ACTIVE' },
  { name: 'Ib Valley Coalfield', code: 'MCL-IVB-24', subsidiary: 'MCL', location: 'Sundargarh', state: 'Odisha', district: 'Sundargarh', lat: 22.1000, lon: 83.7500, capacity: 2_640_000, status: 'ACTIVE' },
  { name: 'Bisrampur OCP', code: 'SECL-BSR-31', subsidiary: 'SECL', location: 'Korba', state: 'Chhattisgarh', district: 'Korba', lat: 22.3600, lon: 82.7500, capacity: 5_300_000, status: 'ACTIVE' },
  { name: 'Gevra Road OCP', code: 'SECL-GVR-32', subsidiary: 'SECL', location: 'Bilaspur', state: 'Chhattisgarh', district: 'Bilaspur', lat: 22.1000, lon: 82.1500, capacity: 3_450_000, status: 'ACTIVE' },
  { name: 'Durgapur OCP', code: 'SECL-DGP-33', subsidiary: 'SECL', location: 'Bilaspur', state: 'Chhattisgarh', district: 'Bilaspur', lat: 22.4200, lon: 82.3400, capacity: 2_870_000, status: 'ACTIVE' },
  { name: 'Khodri OCP', code: 'SECL-KHD-34', subsidiary: 'SECL', location: 'Bilaspur', state: 'Chhattisgarh', district: 'Bilaspur', lat: 22.2500, lon: 82.0100, capacity: 1_640_000, status: 'INACTIVE' },
  { name: 'Jayantdri OCP', code: 'SECL-JYD-35', subsidiary: 'SECL', location: 'Koriya', state: 'Chhattisgarh', district: 'Koriya', lat: 23.2000, lon: 82.3000, capacity: 4_020_000, status: 'ACTIVE' },
  { name: 'Sare Pasnaini OCP', code: 'SECL-SPN-36', subsidiary: 'SECL', location: 'Koriya', state: 'Chhattisgarh', district: 'Koriya', lat: 23.4000, lon: 82.4000, capacity: 2_310_000, status: 'ACTIVE' },
  { name: 'Pench Mine', code: 'NCL-PNC-41', subsidiary: 'NCL', location: 'Chhindwara', state: 'Madhya Pradesh', district: 'Chhindwara', lat: 22.0700, lon: 78.9300, capacity: 1_980_000, status: 'ACTIVE' },
  { name: 'Dudhichua Mine', code: 'NCL-DDC-42', subsidiary: 'NCL', location: 'Chhindwara', state: 'Madhya Pradesh', district: 'Chhindwara', lat: 22.3800, lon: 78.9800, capacity: 2_160_000, status: 'ACTIVE' },
  { name: 'Kudgi OCP', code: 'NCL-KDG-43', subsidiary: 'NCL', location: 'Singrauli', state: 'Madhya Pradesh', district: 'Singrauli', lat: 24.1900, lon: 82.6800, capacity: 6_100_000, status: 'ACTIVE' },
  { name: 'Nigahi OCP', code: 'NCL-NGH-44', subsidiary: 'NCL', location: 'Singrauli', state: 'Madhya Pradesh', district: 'Singrauli', lat: 24.0500, lon: 82.8500, capacity: 4_800_000, status: 'ACTIVE' },
  { name: 'Sohagpur OCP', code: 'BCCL-SGP-51', subsidiary: 'BCCL', location: 'Singrauli', state: 'Madhya Pradesh', district: 'Singrauli', lat: 24.2500, lon: 82.5000, capacity: 2_720_000, status: 'MAINTENANCE' },
  { name: 'Sripur OCP', code: 'BCCL-SRP-52', subsidiary: 'BCCL', location: 'Birbhum', state: 'West Bengal', district: 'Birbhum', lat: 23.6700, lon: 87.5100, capacity: 1_480_000, status: 'ACTIVE' },
  { name: 'Rajmahal OCP', code: 'BCCL-RJM-53', subsidiary: 'BCCL', location: 'Dhanbad', state: 'Jharkhand', district: 'Dhanbad', lat: 24.1800, lon: 86.6800, capacity: 3_200_000, status: 'ACTIVE' },
  { name: 'Kudgirna OCP', code: 'WCL-KDG-61', subsidiary: 'WCL', location: 'Nagpur', state: 'Maharashtra', district: 'Nagpur', lat: 21.4000, lon: 79.1500, capacity: 2_090_000, status: 'ACTIVE' },
  { name: 'Nandira OCP', code: 'WCL-NDR-62', subsidiary: 'WCL', location: 'Chandrapur', state: 'Maharashtra', district: 'Chandrapur', lat: 19.9500, lon: 79.3000, capacity: 1_760_000, status: 'ACTIVE' },
  { name: 'Khadia OCP', code: 'NCL-KHD-71', subsidiary: 'NCL', location: 'Singrauli', state: 'Madhya Pradesh', district: 'Sidhi', lat: 24.3800, lon: 82.6000, capacity: 2_540_000, status: 'ACTIVE' },
  { name: 'Khodri Washery', code: 'SECL-KHW-72', subsidiary: 'SECL', location: 'Bilaspur', state: 'Chhattisgarh', district: 'Bilaspur', lat: 22.3100, lon: 81.8900, capacity: 1_050_000, status: 'INACTIVE' },
  { name: 'Dipka OCP', code: 'SECL-DPK-73', subsidiary: 'SECL', location: 'Korba', state: 'Chhattisgarh', district: 'Korba', lat: 22.5200, lon: 82.6200, capacity: 3_650_000, status: 'ACTIVE' },
  { name: 'Gautam OCP', code: 'MCL-GTM-81', subsidiary: 'MCL', location: 'Sundargarh', state: 'Odisha', district: 'Sundargarh', lat: 22.5500, lon: 84.0500, capacity: 2_430_000, status: 'ACTIVE' },
  { name: 'Belpahar OCP', code: 'MCL-BLP-82', subsidiary: 'MCL', location: 'Jharsuguda', state: 'Odisha', district: 'Jharsuguda', lat: 22.1500, lon: 84.1000, capacity: 1_830_000, status: 'ACTIVE' },
  { name: 'Lakhanpur OCP', code: 'MCL-LKP-83', subsidiary: 'MCL', location: 'Jharsuguda', state: 'Odisha', district: 'Sundargarh', lat: 22.2800, lon: 84.0200, capacity: 2_670_000, status: 'ACTIVE' },
  { name: 'Khalipani OCP', code: 'MCL-KLP-84', subsidiary: 'MCL', location: 'Angul', state: 'Odisha', district: 'Angul', lat: 21.3200, lon: 84.7200, capacity: 1_340_000, status: 'MAINTENANCE' },
  { name: 'Tetriapani OCP', code: 'MCL-TTP-85', subsidiary: 'MCL', location: 'Sundargarh', state: 'Odisha', district: 'Sundargarh', lat: 22.4200, lon: 83.9000, capacity: 1_970_000, status: 'ACTIVE' },
  { name: 'Belpahar Washery', code: 'MCL-BLW-86', subsidiary: 'MCL', location: 'Jharsuguda', state: 'Odisha', district: 'Jharsuguda', lat: 22.0500, lon: 84.2500, capacity: 890_000, status: 'ACTIVE' },
  { name: 'Sirma OCP', code: 'SECL-SRM-91', subsidiary: 'SECL', location: 'Raipur', state: 'Chhattisgarh', district: 'Raipur', lat: 21.4500, lon: 82.6000, capacity: 1_210_000, status: 'ACTIVE' },
  { name: 'Hasdeo OCP', code: 'SECL-HSD-92', subsidiary: 'SECL', location: 'Korba', state: 'Chhattisgarh', district: 'Korba', lat: 22.2500, lon: 82.9500, capacity: 2_880_000, status: 'ACTIVE' },
  { name: 'Rampapur OCP', code: 'BCCL-RPR-93', subsidiary: 'BCCL', location: 'Birbhum', state: 'West Bengal', district: 'Birbhum', lat: 23.8300, lon: 87.2500, capacity: 1_620_000, status: 'ACTIVE' },
  { name: 'Khalibahal OCP', code: 'WCL-KHB-94', subsidiary: 'WCL', location: 'Raipur', state: 'Chhattisgarh', district: 'Raipur', lat: 21.3000, lon: 82.8000, capacity: 1_410_000, status: 'ACTIVE' },
  { name: 'Pench Washery', code: 'NCL-PNW-95', subsidiary: 'NCL', location: 'Chhindwara', state: 'Madhya Pradesh', district: 'Chhindwara', lat: 22.2500, lon: 79.1500, capacity: 940_000, status: 'INACTIVE' },
  { name: 'Makri OCP', code: 'BCCL-MKR-96', subsidiary: 'BCCL', location: 'Dhanbad', state: 'Jharkhand', district: 'Dhanbad', lat: 23.9000, lon: 86.2500, capacity: 2_030_000, status: 'ACTIVE' },
  { name: 'Gomia OCP', code: 'BCCL-GOM-97', subsidiary: 'BCCL', location: 'Bokaro', state: 'Jharkhand', district: 'Bokaro', lat: 23.5500, lon: 86.1500, capacity: 2_780_000, status: 'ACTIVE' },
  { name: 'Bhandaria OCP', code: 'BCCL-BHD-98', subsidiary: 'BCCL', location: 'Dhanbad', state: 'Jharkhand', district: 'Dhanbad', lat: 23.8800, lon: 86.4800, capacity: 1_560_000, status: 'ACTIVE' },
  { name: 'Chas Colliery', code: 'BCCL-CHS-99', subsidiary: 'BCCL', location: 'Bokaro', state: 'Jharkhand', district: 'Bokaro', lat: 23.6000, lon: 86.3000, capacity: 1_190_000, status: 'ACTIVE' },
  { name: 'Bharatpur OCP', code: 'NCL-BTP-101', subsidiary: 'NCL', location: 'Sidhi', state: 'Madhya Pradesh', district: 'Sidhi', lat: 24.4500, lon: 82.7000, capacity: 1_320_000, status: 'ACTIVE' },
  { name: 'Amalgamated Bagrais OCP', code: 'WCL-ABG-102', subsidiary: 'WCL', location: 'Nagpur', state: 'Maharashtra', district: 'Nagpur', lat: 21.5500, lon: 79.4000, capacity: 1_870_000, status: 'ACTIVE' },
  { name: 'Durgapur Colliery', code: 'BCCL-DGP-103', subsidiary: 'BCCL', location: 'Dhanbad', state: 'Jharkhand', district: 'Dhanbad', lat: 23.7000, lon: 86.3200, capacity: 1_450_000, status: 'MAINTENANCE' },
]

/* ------------------------------------------------------- derived records */

const COMPLIANCE_REQUIREMENTS: { requirement: string; category: Compliance['category']; description: string }[] = [
  { requirement: 'DGMS-approved mine safety plan', category: 'SAFETY', description: 'Statutory mine safety plan approved by DGMS and displayed at the mine entry.' },
  { requirement: 'AnnualShot-firing licence renewal', category: 'SAFETY', description: 'Renew the annual licence for using explosives in the mine.' },
  { requirement: 'Methane emission monitoring', category: 'SAFETY', description: 'Continuous methane monitoring with calibration certificates for all sensors.' },
  { requirement: 'Environmental clearance compliance', category: 'ENVIRONMENT', description: 'Report air, water and noise emissions against the environmental clearance conditions.' },
  { requirement: 'Fly ash and reject management', category: 'ENVIRONMENT', description: 'Document the daily handling and utilisation of fly ash and washery rejects.' },
  { requirement: 'Afforestation and land reclamation', category: 'ENVIRONMENT', description: 'Progress report on the mine reclamation and green cover plan.' },
  { requirement: 'Production target achievement', category: 'PRODUCTION', description: 'Verify against the annual plan-of-mine and the linkage commitment.' },
  { requirement: 'Dispatch weighment reconciliation', category: 'PRODUCTION', description: 'Reconcile weighbridge records against dispatch registers monthly.' },
  { requirement: 'Pit slope stability survey', category: 'SAFETY', description: 'Quarterly geotechnical survey of open-cast pit slopes.' },
  { requirement: 'Working hours and shift roster audit', category: 'LABOUR', description: 'Audit shift rosters against statutory working-hour limits.' },
  { requirement: 'Welfare facility maintenance', category: 'LABOUR', description: 'Inspect canteen, drinking water, rest shelters and first-aid centres.' },
  { requirement: 'Medical examination of workers', category: 'LABOUR', description: 'Ensure every worker holds a current medical fitness certificate.' },
  { requirement: 'Third-party audit closure', category: 'OTHER', description: 'Close all open observations from the last third-party safety audit.' },
  { requirement: 'Dust suppression system uptime', category: 'SAFETY', description: 'Verify water-spray and fogging systems meet the prescribed suppression standard.' },
  { requirement: 'Mine boundary demarcation', category: 'SAFETY', description: 'Confirm boundary pillars, survey pillars and fencing are intact.' },
  { requirement: 'Emergency response plan drill', category: 'SAFETY', description: 'Conduct and document a full-scale emergency evacuation drill.' },
]

const INSPECTION_FINDINGS = [
  'Vibration monitoring at the bench face exceeded the amber threshold during the morning shift. The geotechnical team was notified and a review was scheduled.',
  'Haul road drainage was found partially blocked near the main ramp. A pumper was dispatched and the section was barricaded until cleared.',
  'Fire-fighting equipment in the main substation was found without current inspection tags. A replacement schedule was raised.',
  'Conveyor belt splice joints showed wear beyond the acceptable limit on the CV-4 section. Maintenance was scheduled within 48 hours.',
  'Statutory signage at the decline portal was partially faded. Signage was reprinted and re-installed the same week.',
  'Underground air quality readings remained within prescribed limits across all sampled points. No action required.',
  'Diesel storage bunding was inspected and found compliant. Volume reconciliation was recorded in the register.',
  'Dust levels at the transfer point measured above the internal control limit. Additional water spray was deployed.',
  'The mine rescue team completed a full equipment inventory. Two self-rescuers were found due for service and were replaced.',
  'Workers were observed without updated PPE in the crusher gallery. The area was inspected and compliance was restored within the shift.',
  'Slope drainage channels were found partially silted on the upper bench. Clearing was ordered and verified.',
  'First-aid kit inventory at the remote substation was found complete and within expiry dates.',
  'Explosive magazine records were reconciled against the register with no discrepancy.',
  'A methane alert was raised at the UG development face. Ventilation was increased and the face was cleared before resumption.',
]

const VIOLATION_TITLES: { title: string; description: string; corrective: string }[] = [
  { title: 'Unguarded conveyor drive pulley', description: 'The drive pulley guard on the CV-2 conveyor was found removed, exposing the nip point to personnel.', corrective: 'Reinstall the pulley guard and add a weekly interlock inspection to the safety schedule.' },
  { title: 'Methane sensor calibration overdue', description: 'Two methane sensors in the development section were past their 30-day calibration interval.', corrective: 'Recalibrate both sensors immediately and implement a 21-day internal reminder cycle.' },
  { title: 'Missing barrier at UG crossover', description: 'A safety barrier at an underground walkway crossover was missing, creating a fall-of-ground exposure.', corrective: 'Reinstall the barrier and inspect all UG crossovers before the next shift.' },
  { title: 'PPE non-compliance in crusher gallery', description: 'Three workers were observed without dust respirators in the crusher gallery.', corrective: 'Retrain the crew and enforce gate-level PPE verification with supervisor sign-off.' },
  { title: 'Overloaded electrical feeder', description: 'A surface feeder was recorded at 112% of rated capacity on the OCP substation feeder.', corrective: 'Redistribute the load and revise the demand forecast for the feeder.' },
  { title: 'Fire door left open', description: 'A rated fire door in the UG return airway was found propped open during the shift.', corrective: 'Issue a formal caution and install a self-closing alarm on the door.' },
  { title: 'Unexploded explosives reconciliation gap', description: 'The magazine register and the daily return showed a variance of two detonators.', corrective: 'Complete a physical count and reconcile with the district explosives officer.' },
  { title: 'Open pit haul road speed breach', description: 'Two repeat exceedances of the 20 km/h in-pit speed limit were recorded in the same week.', corrective: 'Install speed governors and refresh the in-pit speed briefing.' },
  { title: 'Drainage sump water accumulation', description: 'The UG main sump was above the high-water mark, reducing available dewatering margin.', corrective: 'Clear the sump and increase the pumping redundancy.' },
  { title: 'Missing shot-firing clearance record', description: 'A shot-firing clearance certificate was absent from the blasting record for one face.', corrective: 'Reinstate the clearance discipline and audit the record monthly.' },
  { title: 'Dust suppression pump offline', description: 'The primary water-spray pump for the transfer station was non-functional for two shifts.', corrective: 'Repair the pump and add an automatic low-pressure trip.' },
  { title: 'Untrained operator on UG loader', description: 'An UG loader was operated by an operator without the required competency certification.', corrective: 'Suspend the operator from UG duties pending certification.' },
  { title: 'Ventilation plan deviation', description: 'Ventilation survey readings deviated from the approved plan by more than 5% at two measurement stations.', corrective: 'Recalculate the ventilation plan and re-issue it to the mine manager for approval.' },
  { title: 'Emergency lighting failure', description: 'Emergency lighting failed on the UG workshop approach, leaving the escape route unlit.', corrective: 'Replace the lighting circuit and add it to the standby power test schedule.' },
  { title: 'Slope bench height exceedance', description: 'A bench on the northern pit wall was cut to 14 metres against the 12 metre design specification.', corrective: 'Re-profile the bench and reissue the geotechnical design.' },
  { title: 'Waste dump crest encroachment', description: 'The waste dump crest was advanced beyond the surveyed boundary at two locations.', corrective: 'Restore the survey line and re-survey before further dumping.' },
]

const CONTRACTOR_COMPANIES = [
  { name: 'Suresh Yadav', code: 'CTR-0112', company: 'Yadav Civil Works Pvt Ltd', person: 'Suresh Yadav', phone: '+91 98320 44112', email: 'suresh@yadavcivil.in', work: 'Surface civil works, haul road construction and mine infrastructure development.' },
  { name: 'Ramesh Kumar', code: 'CTR-0113', company: 'Kumar Electricals Ltd', person: 'Ramesh Kumar', phone: '+91 94440 77213', email: 'ramesh@kumarelectrical.in', work: 'HT/LT installation, substation maintenance and power system upgradation.' },
  { name: 'Deepak Joshi', code: 'CTR-0114', company: 'Joshi Mining Services', person: 'Deepak Joshi', phone: '+91 90901 22814', email: 'deepak@joshimining.in', work: 'Drilling, blasting and OB removal operations on open-cast benches.' },
  { name: 'Anil Chatterjee', code: 'CTR-0115', company: 'Chatterjee Haulage', person: 'Anil Chatterjee', phone: '+91 98311 99015', email: 'anil@chatterjeehaulage.in', work: 'Haulage fleet operation, dispatch and weighbridge management.' },
  { name: 'Praveen Kulkarni', code: 'CTR-0116', company: 'Kulkarni Environmentals', person: 'Praveen Kulkarni', phone: '+91 90040 33516', email: 'praveen@kulkarnienv.in', work: 'Environmental monitoring, dust suppression and land reclamation works.' },
  { name: 'Nitin Bora', code: 'CTR-0117', company: 'Bora Safety Consultants', person: 'Nitin Bora', phone: '+91 97020 11817', email: 'nitin@borasafety.in', work: 'Third-party safety audits, risk assessments and safety training delivery.' },
  { name: 'Sanjeev Thakur', code: 'CTR-0118', company: 'Thakur Mechanical Works', person: 'Sanjeev Thakur', phone: '+91 88610 55318', email: 'sanjeev@thakurmech.in', work: 'Conveyor maintenance, crusher overhauls and mechanical plant servicing.' },
  { name: 'Gaurav Sethi', code: 'CTR-0119', company: 'Sethi Explosives Pvt Ltd', person: 'Gaurav Sethi', phone: '+91 93140 77419', email: 'gaurav@sethiexplosives.in', work: 'Explosives supply, magazine management and shot-firing services.' },
  { name: 'Vikas Rawat', code: 'CTR-0120', company: 'Rawat Transport Corp', person: 'Vikas Rawat', phone: '+91 70110 88220', email: 'vikas@rawattransport.in', work: 'Long-haul coal transportation and rail siding evacuation.' },
  { name: 'Harsh Agarwal', code: 'CTR-0121', company: 'Agarwal Scaffolding', person: 'Harsh Agarwal', phone: '+91 98110 44321', email: 'harsh@agarwalscaff.in', work: 'Scaffolding, structural erection and industrial shed construction.' },
  { name: 'Manish Pradhan', code: 'CTR-0122', company: 'Pradhan Drilling & Blast', person: 'Manish Pradhan', phone: '+91 94310 66522', email: 'manish@pradhandb.in', work: 'Exploratory and production drilling, geological logging support.' },
  { name: 'Aakash Rana', code: 'CTR-0123', company: 'Rana Water Systems', person: 'Aakash Rana', phone: '+91 91770 22623', email: 'aakash@ranawater.in', work: 'Mine water management, sump dewatering and pumping station upkeep.' },
]

const DOCUMENT_TYPES: DocumentType[] = [
  'LICENSE',
  'SAFETY_CERTIFICATE',
  'INSURANCE',
  'LABOUR_LICENSE',
  'ENVIRONMENTAL',
  'OTHER',
]

const AUTHORITIES = [
  'Directorate General of Mines Safety',
  'State Directorate of Mining Safety',
  'Regional Enforcement Institute',
  'Central Mine Inspectorate',
]

const AUDIT_ACTIONS: { action: string; model: string; description: (n: string) => string }[] = [
  { action: 'CREATE', model: 'Mine', description: (n) => `Created mine ${n}` },
  { action: 'UPDATE', model: 'Mine', description: (n) => `Updated mine record ${n}` },
  { action: 'DELETE', model: 'Mine', description: (n) => `Deleted mine ${n}` },
  { action: 'CREATE', model: 'Inspection', description: (n) => `Logged inspection for ${n}` },
  { action: 'UPDATE', model: 'Violation', description: (n) => `Updated violation status for ${n}` },
  { action: 'CREATE', model: 'Violation', description: (n) => `Raised violation for ${n}` },
  { action: 'LOGIN', model: 'Session', description: (n) => `User session opened: ${n}` },
  { action: 'EXPORT', model: 'Report', description: (n) => `Exported compliance report for ${n}` },
  { action: 'UPDATE', model: 'Contractor', description: (n) => `Updated contractor ${n}` },
  { action: 'CREATE', model: 'ContractorDocument', description: (n) => `Registered contractor document for ${n}` },
]

/* --------------------------------------------------------------- builder */

export interface Database {
  users: User[]
  mines: Mine[]
  compliances: Compliance[]
  inspections: Inspection[]
  violations: Violation[]
  contractors: Contractor[]
  documents: ContractorDocument[]
  notifications: AppNotification[]
  riskHistory: RiskHistory[]
  auditLogs: AuditLog[]
  seq: number
}

function iso(d: Date) {
  return d.toISOString()
}

export function buildSeed(): Database {
  const mines: Mine[] = MINE_SEEDS.map((seed, i) => {
    const id = i + 1
    return {
      id,
      name: seed.name,
      mine_code: seed.code,
      subsidiary: seed.subsidiary,
      location: seed.location,
      state: seed.state,
      district: seed.district,
      latitude: seed.lat.toFixed(6),
      longitude: seed.lon.toFixed(6),
      manager: MANAGER_IDS[i % MANAGER_IDS.length] ?? null,
      manager_name: null,
      status: seed.status,
      production_capacity: seed.capacity.toFixed(2),
      risk_score: '0.00',
      risk_level: 'LOW',
      risk_updated_at: null,
      created_at: stampOffset(-int(400, 900), int(9, 17)),
      updated_at: stampOffset(-int(1, 40), int(9, 17)),
    }
  })

  for (const m of mines) {
    const manager = USERS.find((u) => u.id === m.manager)
    m.manager_name = manager ? `${manager.first_name} ${manager.last_name}` : null
  }

  const compliances: Compliance[] = []
  const inspections: Inspection[] = []
  const violations: Violation[] = []
  const contractors: Contractor[] = []
  const documents: ContractorDocument[] = []
  const notifications: AppNotification[] = []
  const riskHistory: RiskHistory[] = []
  const auditLogs: AuditLog[] = []

  let seq = 1
  const next = () => seq++

  /* ---------------------------------------------------------- compliance */
  for (const mine of mines) {
    const count = int(4, 9)
    for (let i = 0; i < count; i++) {
      const req = pick(COMPLIANCE_REQUIREMENTS)
      const status: Compliance['status'] = chance(0.46) ? 'COMPLETED' : 'PENDING'
      // Overdue / due-soon / upcoming, weighted toward a live pipeline.
      const roll = rnd()
      const dueOffset = roll < 0.24 ? -int(1, 45) : roll < 0.55 ? int(1, 7) : int(10, 120)
      const person = pick(USERS.filter((u) => u.role === 'MANAGER' || u.role === 'SAFETY_OFFICER'))
      const responsible = chance(0.8) ? person : null
      const id = next()

      let monitoring: Compliance['monitoring_status'] = 'UPCOMING'
      if (status === 'COMPLETED') monitoring = 'COMPLETED'
      else if (dueOffset < 0) monitoring = 'OVERDUE'
      else if (dueOffset <= 7) monitoring = 'DUE_SOON'

      compliances.push({
        id,
        mine: mine.id,
        mine_name: mine.name,
        requirement: req.requirement,
        category: req.category,
        description: req.description,
        due_date: dayOffset(dueOffset),
        status,
        responsible_person: responsible?.id ?? null,
        responsible_person_name: responsible ? `${responsible.first_name} ${responsible.last_name}` : null,
        completed_date: status === 'COMPLETED' ? dayOffset(dueOffset - int(1, 20)) : null,
        monitoring_status: monitoring,
        created_at: stampOffset(dueOffset - int(30, 180), int(9, 17)),
        updated_at: stampOffset(-int(0, 25), int(9, 17)),
      })
    }
  }

  /* --------------------------------------------------------- inspections */
  for (const mine of mines) {
    const count = int(3, 7)
    for (let i = 0; i < count; i++) {
      const type = pick<InspectionType>(['ROUTINE', 'SAFETY', 'ENVIRONMENT', 'SURPRISE', 'COMPLIANCE'])
      const roll = rnd()
      const dateOffset = roll < 0.16 ? -int(1, 40) : roll < 0.45 ? int(1, 21) : -int(20, 180)
      const status: Inspection['status'] = dateOffset < 0
        ? chance(0.88)
          ? 'COMPLETED'
          : 'SCHEDULED'
        : chance(0.5)
          ? 'SCHEDULED'
          : 'IN_PROGRESS'
      const inspector = pick(USERS.filter((u) => u.role === 'INSPECTOR'))
      const id = next()

      inspections.push({
        id,
        mine: mine.id,
        mine_name: mine.name,
        inspector: inspector.id,
        inspector_name: `${inspector.first_name} ${inspector.last_name}`,
        inspection_type: type,
        inspection_date: dayOffset(dateOffset),
        status,
        findings: status === 'SCHEDULED' ? '' : pick(INSPECTION_FINDINGS),
        remarks: status === 'COMPLETED' ? 'Report submitted and countersigned by the mine manager.' : '',
        violation_count: 0,
        created_at: stampOffset(dateOffset - int(10, 60), int(9, 17)),
        updated_at: stampOffset(dateOffset - int(0, 10), int(9, 17)),
      })
    }
  }

  /* ---------------------------------------------------------- violations */
  const cleanTitles = VIOLATION_TITLES
  for (const inspection of inspections) {
    if (inspection.status !== 'COMPLETED') continue
    const count = chance(0.55) ? int(1, 3) : 0
    for (let i = 0; i < count; i++) {
      const template = pick(cleanTitles)
      const severityRoll = rnd()
      const severity: Severity =
        severityRoll < 0.1 ? 'CRITICAL' : severityRoll < 0.34 ? 'HIGH' : severityRoll < 0.7 ? 'MEDIUM' : 'LOW'
      const statusRoll = rnd()
      const status: Violation['status'] =
        statusRoll < 0.36 ? 'OPEN' : statusRoll < 0.62 ? 'IN_PROGRESS' : statusRoll < 0.84 ? 'RESOLVED' : 'CLOSED'
      const dueOffset = status === 'RESOLVED' || status === 'CLOSED' ? -int(1, 60) : int(-20, 40)
      const assignee = chance(0.75) ? pick(USERS.filter((u) => u.role === 'MANAGER' || u.role === 'INSPECTOR' || u.role === 'SAFETY_OFFICER')) : null
      const id = next()
      const mine = mines.find((m) => m.id === inspection.mine)!

      violations.push({
        id,
        inspection: inspection.id,
        inspection_date: inspection.inspection_date,
        mine: mine.id,
        mine_name: mine.name,
        title: template.title,
        description: template.description,
        severity,
        status,
        corrective_action: template.corrective,
        assigned_to: assignee?.id ?? null,
        assigned_to_name: assignee ? `${assignee.first_name} ${assignee.last_name}` : null,
        due_date: dayOffset(dueOffset),
        resolved_date:
          status === 'RESOLVED' || status === 'CLOSED' ? dayOffset(dueOffset + int(1, 25)) : null,
        remarks: status === 'CLOSED' ? 'Closed after verification of corrective action.' : '',
        created_at: stampOffset(-int(1, 70), int(9, 17)),
        updated_at: stampOffset(-int(0, 20), int(9, 17)),
      })

      inspection.violation_count += 1
    }
  }

  /* --------------------------------------------------------- contractors */
  for (const mine of mines) {
    const count = int(1, 4)
    for (let i = 0; i < count; i++) {
      const c = pick(CONTRACTOR_COMPANIES)
      const status: Contractor['status'] = chance(0.76) ? 'ACTIVE' : chance(0.6) ? 'INACTIVE' : 'SUSPENDED'
      const id = next()
      const startOffset = -int(30, 700)

      contractors.push({
        id,
        name: c.name,
        contractor_code: c.code,
        company_name: c.company,
        contact_person: c.person,
        phone: c.phone,
        email: c.email,
        address: `${c.company}, ${pick(['Sector-V', 'Civil Lines', 'Station Road', 'Gandhi Nagar', 'Model Town'])}, ${mine.district}, ${mine.state}`,
        mine: mine.id,
        mine_name: mine.name,
        work_description: c.work,
        start_date: dayOffset(startOffset),
        end_date: status === 'ACTIVE' ? null : dayOffset(-int(1, 90)),
        status,
        document_count: 0,
        expiring_document_count: 0,
        created_at: stampOffset(startOffset, int(9, 17)),
        updated_at: stampOffset(-int(0, 30), int(9, 17)),
      })
    }
  }

  /* ------------------------------------------------------- doc + risk gen */
  let docId = 1
  for (const contractor of contractors) {
    const count = int(2, 5)
    for (let i = 0; i < count; i++) {
      const type = pick(DOCUMENT_TYPES)
      const roll = rnd()
      const expiryOffset = roll < 0.16 ? -int(1, 180) : roll < 0.36 ? int(1, 30) : int(45, 540)
      const issueOffset = expiryOffset - int(180, 730)
      let status: ContractorDocument['calculated_status'] = 'VALID'
      if (expiryOffset < 0) status = 'EXPIRED'
      else if (expiryOffset <= 30) status = 'EXPIRING'

      documents.push({
        id: docId++,
        contractor: contractor.id,
        document_type: type,
        document_number: `${type.split('_')[0]}-${int(10000, 99999)}/${int(2023, 2026)}`,
        issue_date: dayOffset(issueOffset),
        expiry_date: dayOffset(expiryOffset),
        issuing_authority: pick(AUTHORITIES),
        status,
        calculated_status: status,
        remarks: '',
        created_at: stampOffset(issueOffset, int(9, 17)),
        updated_at: stampOffset(-int(0, 20), int(9, 17)),
      })
    }
  }

  for (const contractor of contractors) {
    const docs = documents.filter((d) => d.contractor === contractor.id)
    contractor.document_count = docs.length
    contractor.expiring_document_count = docs.filter((d) => d.calculated_status !== 'VALID').length
  }

  /* --------------------------------------------------------------- risk */
  for (const mine of mines) {
    const mineViolations = violations.filter((v) => v.mine === mine.id)
    const mineCompliances = compliances.filter((c) => c.mine === mine.id)
    const mineInspections = inspections.filter((i) => i.mine === mine.id)
    const contractorIds = contractors.filter((c) => c.mine === mine.id).map((c) => c.id)
    const mineDocs = documents.filter((d) => contractorIds.includes(d.contractor))

    // Reuse the real engine so seeded scores are never invented.
    const result = calculateMineRisk({
      violations: mineViolations,
      compliances: mineCompliances,
      inspections: mineInspections,
      documents: mineDocs,
    })

    mine.risk_score = result.score.toFixed(2)
    mine.risk_level = result.level
    mine.risk_updated_at = iso(TODAY)

    // 6 months of history, walking backwards with mild noise.
    let score = Math.max(0, result.score - int(4, 22))
    for (let i = 5; i >= 0; i--) {
      const drift = int(-6, 8)
      score = Math.max(0, Math.min(100, score + drift))
      const level = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'
      riskHistory.push({
        id: riskHistory.length + 1,
        mine: mine.id,
        risk_score: score.toFixed(2),
        risk_level: level,
        risk_factors: i === 0 ? result.factors.join('; ') : '',
        recorded_at: stampOffset(-i * 30, 6),
      })
    }
  }

  /* ------------------------------------------------------ notifications */
  let notifId = 1
  for (const user of USERS) {
    const relevantCompliances = compliances.filter((c) => c.monitoring_status === 'OVERDUE' || c.monitoring_status === 'DUE_SOON')
    const relevantDocs = documents.filter((d) => d.calculated_status === 'EXPIRED' || d.calculated_status === 'EXPIRING')
    const relevantViolations = violations.filter((v) => v.status === 'OPEN' || v.status === 'IN_PROGRESS')

    const pool: { type: AppNotification['notification_type']; title: string; message: string; link: string }[] = [
      ...relevantCompliances.slice(0, 6).map((c) => ({
        type: 'COMPLIANCE' as const,
        title: c.monitoring_status === 'OVERDUE' ? 'Compliance Overdue' : 'Compliance Due Soon',
        message: `${c.requirement} for ${c.mine_name} is ${c.monitoring_status === 'OVERDUE' ? 'overdue' : `due on ${c.due_date}`}.`,
        link: '/compliance',
      })),
      ...relevantDocs.slice(0, 5).map((d) => {
        const contractor = contractors.find((c) => c.id === d.contractor)
        return {
          type: 'CONTRACTOR' as const,
          title: d.calculated_status === 'EXPIRED' ? 'Contractor Document Expired' : 'Contractor Document Expiring',
          message: `${d.document_type.replace(/_/g, ' ')} for ${contractor?.company_name ?? 'a contractor'} ${d.calculated_status === 'EXPIRED' ? 'has expired' : `expires on ${d.expiry_date}`}.`,
          link: '/contractors',
        }
      }),
      ...relevantViolations.slice(0, 5).map((v) => ({
        type: 'VIOLATION' as const,
        title: v.severity === 'CRITICAL' ? 'Critical Violation Open' : 'Violation Requires Action',
        message: `'${v.title}' at ${v.mine_name} is ${v.status.toLowerCase().replace(/_/g, ' ')}.`,
        link: '/violations',
      })),
      {
        type: 'SYSTEM' as const,
        title: 'Predictive risk model refreshed',
        message: 'The risk engine recomputed all mine scores overnight. Review the Risk Intelligence board.',
        link: '/risk',
      },
    ]

    for (let i = 0; i < Math.min(pool.length, 6 + int(0, 5)); i++) {
      const n = pool[i]
      if (!n) continue
      notifications.push({
        id: notifId++,
        recipient: user.id,
        notification_type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        is_read: chance(0.35),
        created_at: stampOffset(-int(0, 9), int(8, 19)),
      })
    }
  }
  notifications.sort((a, b) => b.created_at.localeCompare(a.created_at))

  /* -------------------------------------------------------------- audit */
  let auditId = 1
  for (let i = 0; i < 60; i++) {
    const t = pick(AUDIT_ACTIONS)
    const user = pick(USERS)
    const mine = pick(mines)
    const contractor = pick(contractors)
    const subject = t.model === 'Contractor' || t.model === 'ContractorDocument' ? contractor.company_name : mine.name
    auditLogs.push({
      id: auditId++,
      user: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      action: t.action,
      model_name: t.model,
      object_id: String(t.model === 'Mine' ? mine.id : int(1, 40)),
      description: t.description(subject),
      created_at: stampOffset(-int(0, 21), int(8, 19)),
    })
  }
  auditLogs.sort((a, b) => b.created_at.localeCompare(a.created_at))

  return {
    users: USERS,
    mines,
    compliances,
    inspections,
    violations,
    contractors,
    documents,
    notifications,
    riskHistory,
    auditLogs,
    seq: 100000,
  }
}
