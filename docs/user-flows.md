# Role-oriented User Flows

## Rehabilitation loop

```mermaid
flowchart LR
    Doctor[Doctor selects patient] --> Assign[Assign program and exercises]
    Assign --> Patient[Patient receives active plan]
    Patient --> Perform[Complete or skip planned session]
    Perform --> Diary[Record pain, effort and observations]
    Diary --> Progress[Update progress context]
    Progress --> Review[Doctor reviews dynamics]
    Review --> Adjust[Adjust assignment or exercise state]
    Adjust --> Patient
    Review --> Report[Prepare rehabilitation report]
```

## Doctor assigns a program

```mermaid
sequenceDiagram
    actor Doctor
    participant Web as Doctor application
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Notify as Notification boundary

    Doctor->>Web: Choose patient, template and schedule
    Web->>API: Submit assignment contract
    API->>API: Validate role, relations and status
    API->>DB: Create patient program and planned sessions
    DB-->>API: Created assignment
    API->>Notify: Publish relevant notification
    API-->>Web: Assignment details
```

## Patient completes a session

```mermaid
sequenceDiagram
    actor Patient
    participant Web as Patient application
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Progress as Progress projection

    Patient->>Web: Open today's session
    Patient->>Web: Record repetitions, pain and effort
    Web->>API: Save performed session and diary data
    API->>DB: Persist execution facts
    API->>Progress: Recalculate response projection
    Progress-->>API: Updated context
    API-->>Web: Session result and progress
```

## Administrator prepares and sends a report

```mermaid
sequenceDiagram
    actor Admin
    participant UI as Admin panel
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Mail as Email service
    participant RT as Realtime notifications

    Admin->>UI: Review report data
    UI->>API: Update report and mark READY
    API->>DB: Persist report and attachments
    API->>RT: Notify administrators
    UI->>API: Request export data
    API-->>UI: Structured PDF model
    UI->>UI: Render PDF preview
    Admin->>UI: Send to patient
    UI->>API: Report URL and message data
    API->>Mail: Send patient email
    API->>DB: Mark report SENT
    API->>RT: Publish REPORT_SENT
```

## Scope enforcement

The UI adapts navigation to role and permissions, but the backend remains the authorization boundary. Doctor and patient operations are scoped to the authenticated actor and their relations; administrative endpoints apply explicit role or permission guards.
