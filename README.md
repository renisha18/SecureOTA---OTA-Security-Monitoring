# SecureOTA

**OTA Security Monitoring Prototype for Connected Vehicles**

SecureOTA is a software prototype for exploring security monitoring concepts around Over-the-Air (OTA) software updates in connected vehicles.

The project models an OTA update workflow, generates security events from real application execution, applies deterministic rule-based detection to identify potentially suspicious activity, and presents flagged events through a monitoring dashboard.

The project also explores selected cybersecurity and software-update concepts relevant to **UNECE UN R155 and UN R156**.

> **Note:** SecureOTA is an educational prototype. It does not represent a real vehicle ECU, production OTA infrastructure, or regulatory compliance with UN R155/R156.

---

## Objective

Modern connected vehicles increasingly depend on software that can be updated remotely. This creates security requirements around:

- Firmware authenticity
- Firmware integrity
- Update authorization
- Version management
- Downgrade protection
- Authentication
- Update failure handling
- Security event monitoring
- Traceability and logging

SecureOTA demonstrates a simplified software implementation of these concepts.

---

## Core Workflow

```text
              OTA Update System
                     │
                     ▼
              Vehicle Client
                     │
                     ▼
             Security Events
                     │
                     ▼
              MySQL Database
                     │
                     ▼
            Rule-Based Detector
                     │
                     ▼
                Alerts
                     │
                     ▼
             React Dashboard
```

The system does not use machine learning for anomaly detection.

Instead, predefined security rules are used so that every alert has an explainable reason.

---

## Features

### OTA Update Monitoring

The prototype models a vehicle receiving software updates from an OTA backend.

The vehicle can:

1. Authenticate with the backend
2. Check for available updates
3. Download a firmware artifact
4. Verify the firmware
5. Check the requested version
6. Install the update
7. Report the result

---

### Firmware Integrity Verification

Firmware artifacts are hashed using SHA-256.

The expected hash is compared with the hash calculated from the downloaded artifact.

```text
Expected Hash
      │
      │ comparison
      ▼
Downloaded Firmware Hash
```

If the values do not match:

```text
HASH_MISMATCH
       ↓
Update rejected
       ↓
Security event generated
```

This demonstrates detection of modification or corruption of the firmware artifact.

---

### Digital Signature Verification

The prototype can use public-key cryptography to verify firmware authenticity.

Conceptually:

```text
Manufacturer
     │
     ├── Firmware
     │
     └── Private Key
            │
            ▼
       Digital Signature
            │
            ▼
        OTA Package
```

The vehicle uses the trusted public key to verify the signature.

An invalid signature results in:

```text
INVALID_SIGNATURE
       ↓
Update rejected
       ↓
Security event generated
```

The private signing key is kept outside the repository.

---

### Downgrade Detection

The vehicle maintains its current software version.

For example:

```text
Current Version: 1.1.0
Requested Version: 1.0.0
```

The system identifies this as a downgrade attempt:

```text
DOWNGRADE_ATTEMPT
        ↓
       FLAG
        ↓
     REJECT
```

This prevents unauthorized movement to an older software version.

---

### Authentication Monitoring

Authentication failures are recorded as security events.

A rule can identify repeated failures within a time window.

Example:

```text
IF authentication failures > 5
within 5 minutes

THEN

AUTHENTICATION_ANOMALY
```

The rule is deterministic and explainable.

---

## Rule-Based Security Detection

The monitoring component uses predefined rules rather than machine learning.

Example rules:

| Event | Rule | Result |
|---|---|---|
| Hash mismatch | Firmware hash differs from expected hash | High severity |
| Invalid signature | Signature verification fails | Critical severity |
| Downgrade attempt | Requested version < current version | High severity |
| Authentication failures | More than threshold within time window | Medium severity |
| Successful update | Update completes successfully | Informational |

Each flagged event contains a reason explaining which rule was triggered.

---

## Example Security Event

```json
{
  "vehicleId": "RE001",
  "eventType": "HASH_MISMATCH",
  "severity": "HIGH",
  "description": "Downloaded firmware hash does not match expected hash",
  "timestamp": "2026-09-24T10:30:00"
}
```

The event is stored in the database and made available to the monitoring dashboard.

---

## Dashboard

The React dashboard provides an overview of OTA security activity.

Example information displayed:

```text
Vehicles                 5
OTA Updates             18
Security Alerts          7
Critical Alerts          2
```

Security events can be displayed with:

- Vehicle ID
- Event type
- Severity
- Detection reason
- Timestamp
- Status

The dashboard allows security events to be investigated based on the actual events generated by the application.

---

## Technology Stack

### Frontend

- React.js

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Security

- SHA-256
- Digital signatures
- JWT authentication
- Role-based authorization
- Rule-based security detection

### Development

- Git
- GitHub
- npm

---

## Project Structure

```text
SecureOTA/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   ├── db.js
│   ├── server.js
│   └── seed.js
│
├── frontend/
│
├── firmware/
│   ├── v1.0.0.bin
│   └── v1.1.0.bin
│
├── keys/
│   └── public.pem
│
├── database/
│   └── schema.sql
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Security Event Types

The prototype can generate events such as:

```text
UPDATE_STARTED
UPDATE_SUCCESS
UPDATE_FAILED
HASH_MISMATCH
INVALID_SIGNATURE
DOWNGRADE_ATTEMPT
AUTHENTICATION_FAILURE
AUTHENTICATION_ANOMALY
ROLLBACK
```

These events form the input to the rule-based monitoring component.

---

## R155 / R156 Concepts

SecureOTA explores selected concepts related to UNECE regulations.

### UN R155

UN R155 focuses on vehicle cybersecurity and cybersecurity management.

The project explores related concepts such as:

- Security event monitoring
- Authentication and authorization
- Firmware integrity
- Firmware authenticity
- Threat-oriented security controls
- Security logging
- Detection of suspicious activity

### UN R156

UN R156 focuses on software updates and the Software Update Management System (SUMS).

The project explores concepts such as:

- Software version management
- Update authorization
- Update integrity and authenticity
- Update traceability
- Downgrade protection
- Update failure handling
- Recovery and rollback

> The project demonstrates selected technical concepts inspired by these areas and is **not a demonstration of regulatory compliance or certification**.

---

## Security Test Scenarios

The prototype is intended to be tested using actual application executions.

### 1. Normal Update

```text
1.0.0 → 1.1.0
      ↓
Verification succeeds
      ↓
Installation succeeds
      ↓
UPDATE_SUCCESS
```

### 2. Modified Firmware

```text
Modify firmware
      ↓
SHA-256 mismatch
      ↓
HASH_MISMATCH
      ↓
Update rejected
```

### 3. Invalid Firmware Signature

```text
Unsigned/fake firmware
      ↓
Signature verification fails
      ↓
INVALID_SIGNATURE
      ↓
Update rejected
```

### 4. Downgrade Attempt

```text
1.1.0 → 1.0.0
      ↓
DOWNGRADE_ATTEMPT
      ↓
Update rejected
```

### 5. Authentication Abuse

```text
Repeated failed authentication
      ↓
Rule threshold exceeded
      ↓
AUTHENTICATION_ANOMALY
      ↓
Alert generated
```

### 6. Installation Failure

```text
Update installation
      ↓
Failure
      ↓
ROLLBACK
      ↓
Previous version restored
```

---

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd SecureOTA
```

### 2. Install dependencies

```bash
npm install
```

If the frontend has a separate package:

```bash
cd frontend
npm install
```

---

### 3. Configure environment variables

Create a `.env` file based on `.env.example`.

Example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=secure_ota
DB_USER=your_username
DB_PASSWORD=your_password

JWT_SECRET=your_secret
```

Do not commit `.env` to GitHub.

---

### 4. Create the database

Create the MySQL database:

```sql
CREATE DATABASE secure_ota;
```

Then run the schema:

```bash
mysql -u root -p secure_ota < database/schema.sql
```

---

### 5. Seed development data

If the project includes a seed script:

```bash
npm run seed
```

The seed script should create development records required to test the application.

---

### 6. Start the backend

```bash
npm run dev
```

---

### 7. Start the frontend

From the frontend directory:

```bash
npm run dev
```

---

## Testing

The project should test both normal operation and security failures.

### Authentication

- Valid login
- Invalid login
- Unauthorized request
- Insufficient role

### Firmware

- Valid firmware
- Modified firmware
- Invalid signature
- Hash mismatch

### Version Management

- Valid upgrade
- Downgrade attempt

### OTA

- Successful update
- Verification failure
- Installation failure
- Rollback

### Monitoring

- Security event creation
- Rule triggering
- Alert generation
- Dashboard display

---

## Limitations

This prototype does **not** implement a complete production automotive OTA system.

It does not include:

- Real ECU hardware
- Real vehicle firmware
- CAN/CAN-FD communication
- AUTOSAR
- Hardware Security Modules (HSM)
- Secure Boot
- Automotive PKI
- Vehicle gateway
- Real cloud OTA infrastructure
- Hardware-backed key storage
- Regulatory certification

The firmware files used by the project are test artifacts created for the prototype.

---

## Future Improvements

Possible extensions include:

- Mutual TLS between vehicle and backend
- Device certificates
- Automotive PKI
- Hardware-backed key storage
- Secure Boot integration
- A/B firmware partitions
- Stronger rollback protection
- CAN-based ECU communication
- Remote attestation
- SBOM integration
- Vulnerability management
- Cloud-based OTA infrastructure
- Integration with real ECU hardware

---

## Disclaimer

SecureOTA is an educational cybersecurity and software-update prototype created to explore concepts relevant to connected-vehicle security.

It should not be interpreted as a production-ready automotive OTA system or as evidence of compliance with UNECE UN R155 or UN R156.
