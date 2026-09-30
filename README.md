# MineGov

## Smart Governance Platform for Mining Operations

MineGov is a web-based mining governance and monitoring platform designed to help government authorities, mine managers, inspectors, safety officers, contractors, and regulators manage mining operations from a centralized system.

The platform combines **mine management, compliance monitoring, inspections, violation tracking, contractor management, GIS visualization, risk assessment, machine learning, and AI-assisted risk explanations** into a single Django-based application.

---

## Features

### 1. Role-Based Access Control

MineGov supports multiple user roles with different responsibilities:

- Admin
- Mine Manager
- Inspector
- Safety Officer
- Contractor
- Regulator

Each role can access the functionality relevant to its responsibilities.

---

### 2. Mine Management

The platform allows authorized users to:

- Register mining sites
- Maintain mine codes and locations
- Store mine manager information
- Track mine status
- Maintain production capacity
- Store latitude and longitude
- View detailed mine information

Mine status includes:

- Active
- Inactive
- Maintenance

---

### 3. Compliance Management

MineGov provides centralized compliance tracking.

Users can:

- Create compliance requirements
- Assign responsible personnel
- Set due dates
- Track completion status
- Identify overdue requirements
- Identify requirements due soon
- Track safety, environmental, production, and labour compliance

Compliance categories include:

- Safety
- Environment
- Production
- Labour
- Other

---

### 4. Inspection Management

The platform provides inspection management functionality.

Users can:

- Schedule inspections
- Assign inspectors
- Record inspection findings
- Add remarks
- Track inspection status
- View inspection details

Inspection types include:

- Routine
- Safety
- Environment
- Surprise
- Compliance

Inspection statuses include:

- Scheduled
- In Progress
- Completed
- Cancelled

---

### 5. Violation Management

MineGov provides a centralized violation tracking system.

Users can:

- Record violations
- Assign violations to responsible personnel
- Define severity
- Set corrective actions
- Set deadlines
- Track resolution
- Record remarks

Violation severity levels:

- Low
- Medium
- High
- Critical

Violation statuses:

- Open
- In Progress
- Resolved
- Closed

---

### 6. Contractor Management

The system maintains contractor information associated with mines.

Contractor records include:

- Company name
- Contractor code
- Contact person
- Phone
- Email
- Address
- Work description
- Start date
- End date
- Status

Contractor statuses include:

- Active
- Inactive
- Suspended

---

### 7. Contractor Document Monitoring

MineGov tracks important contractor documents such as:

- Licenses
- Safety certificates
- Insurance
- Labour licenses
- Environmental documents

The system automatically identifies documents as:

- Valid
- Expiring
- Expired

This helps authorities identify contractor compliance issues before they become operational problems.

---

### 8. GIS Mine Map

MineGov provides a GIS-based visualization of registered mines.

The map displays:

- Mine locations
- Mine names
- Mine codes
- Mine status
- Links to mine details

The GIS functionality is implemented using **Leaflet.js** and **OpenStreetMap**.

---

### 9. Notification System

MineGov generates notifications for important events such as:

- Overdue compliance requirements
- Compliance requirements due soon
- Overdue violations
- Violations approaching deadlines
- Expired contractor documents
- Expiring contractor documents

Users can view their notifications from the centralized notification page.

Unread notification counts are also displayed in the navigation panel.

---

### 10. Mine Risk Assessment

MineGov includes a rule-based risk assessment engine.

The risk score considers factors such as:

- Open violations
- Violation severity
- Overdue compliance
- Overdue inspections
- Expired contractor documents

Risk levels are classified as:

| Score | Risk Level |
|---:|---|
| 0–24 | Low |
| 25–49 | Medium |
| 50–74 | High |
| 75–100 | Critical |

The system also stores historical risk assessments for individual mines.

---

### 11. Machine Learning Risk Prediction

MineGov includes a machine learning component for mine risk prediction.

The current implementation uses a **Random Forest Regressor**.

The model uses operational features including:

- Total violations
- Critical violations
- High-severity violations
- Open violations
- Overdue compliance
- Total compliance records
- Total inspections
- Completed inspections
- Overdue inspections
- Expired contractor documents
- Current risk score

The prediction produces:

- Predicted risk score
- Predicted risk level

The ML pipeline includes:

```text
Mine Data
     |
     v
Feature Extraction
     |
     v
Dataset Generation
     |
     v
Random Forest Model
     |
     v
Risk Prediction
     |
     v
Risk Level
