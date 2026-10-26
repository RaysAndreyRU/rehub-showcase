# Architecture Overview

## System context

Rehub uses one backend domain model to support three different operational views. Patients interact with assignments and daily execution, doctors work with clinical context and adjustment, and administrators maintain catalogs, rules, reports, and platform operations.

```mermaid
flowchart LR
    Patient[Patient] --> Web[Patient and doctor Next.js PWA]
    Doctor[Doctor] --> Web
    Admin[Administrator] --> AdminUI[Administrative Next.js application]
    Web --> API[NestJS domain API]
    AdminUI --> API
    API --> DB[(PostgreSQL)]
    API --> Redis[(Redis)]
    API --> Storage[Object storage]
    API --> Outbox[(Notification outbox)]
    Outbox --> Queue[BullMQ / Redis]
    Queue --> PushWorker[Push worker]
    PushWorker --> FCM[Firebase Cloud Messaging]
    FCM --> Web
```

## Backend request path

```mermaid
flowchart LR
    Request --> Guard[JWT / role / permission guards]
    Guard --> DTO[DTO validation and transformation]
    DTO --> Controller
    Controller --> Service[Domain service]
    Service --> Repository
    Repository --> Prisma
    Prisma --> PostgreSQL[(PostgreSQL)]
    Service --> Redis[(Redis)]
    Service --> SideEffects[Notifications / email / storage]
```

Controllers bind transport contracts, services coordinate business scenarios, and repositories isolate query composition. Cross-cutting filters and interceptors normalize validation, successful responses, and errors.

## Product decomposition

| Surface | Responsibility | Architectural character |
| --- | --- | --- |
| Main web | Patient and doctor journeys plus public content | Pragmatic installable Next.js PWA with shared services, route groups, and one service worker. |
| Admin | Catalogs, rules, reports, analytics, security | Layered frontend with schemas, services, React Query hooks, pages, and MSW handlers. |
| Backend | Domain behavior and integrations | Modular NestJS application with services and repositories around Prisma. |
| Docs | Business processes and technical contracts | Role, domain, route, sequence, and data-model documentation. |

## Notification delivery planes

Realtime and push solve related but different delivery problems. Socket.IO provides low-latency projection while a session is connected. Push uses a transactional outbox because delivery intent must survive API, Redis, worker, and provider failures.

```mermaid
flowchart TB
    Event[Domain event] --> TX[Notification transaction]
    TX --> Notification[(Durable notification)]
    TX --> Outbox[(Push outbox)]

    Notification --> Socket[Socket.IO projection]
    Socket --> Active[Connected client]

    Outbox --> Dispatcher[Conditional dispatcher]
    Dispatcher --> Bull[(BullMQ / Redis)]
    Bull --> Worker[Push worker]
    Worker --> Firebase[Firebase]
    Firebase --> PWA[Foreground or service worker]
```

The durable list remains the recovery interface for both channels. Neither a socket event nor a provider acknowledgement proves that a person read or acted on the notification.

## PWA boundary

```mermaid
flowchart LR
    Manifest --> Installed[Installed application]
    BaseWorker[Cache and offline worker] --> SW[Single service worker]
    Messaging[Firebase background handler] --> SW
    SW --> PublicCache[Public static cache]
    SW -. bypass .-> Private[Authenticated routes and API]
    SW --> Notification[System notification]
```

The worker caches public shell assets and an offline fallback while bypassing authenticated routes, API requests, and responses marked private or non-cacheable. Firebase messaging is composed into the same worker so only one process controls the application scope.

This distinction is deliberate. The product is not presented as one uniform frontend architecture, and the main application is not described as FSD.

## Domain map

```mermaid
flowchart TB
    Identity[Users, roles, auth] --> Assignment[Doctor-patient assignment]
    Catalog[Exercises and clinical dictionaries] --> Templates[Program templates and phases]
    Policies[Red flags and recommendations] --> Templates
    Templates --> Program[Patient program]
    Assignment --> Program
    Program --> Planned[Planned sessions]
    Planned --> Performed[Performed sessions]
    Performed --> Diary[Diary and observations]
    Diary --> Progress[Progress projections]
    Progress --> Reports[Rehabilitation reports]
    Policies --> Reports
    Identity --> Audit[Security audit]
```

## Data and state ownership

- PostgreSQL stores durable domain state and audit records.
- Redis stores expiring login-attempt state, socket connection sets, cross-instance realtime transport, and BullMQ queue data. PostgreSQL outbox state remains the durable source for push recovery.
- Object storage holds file and media payloads while relational records retain metadata and ownership.
- React Query owns remote frontend cache; form state remains local to the relevant UI boundary.
- MSW provides deterministic domain responses for admin screens that have not yet moved to live endpoints.

## Known trade-offs

- The backend grew from a graduation project and contains both newer domain modules and older integration surfaces.
- The main web application has large route components and mixed legacy/new boundaries.
- Backend integration progressed incrementally, so mock and live data paths coexist in parts of the frontends.
- Test depth still varies by module, but every deployable repository now has an automated quality gate; both frontends include browser-level critical-path coverage, and the backend validates migrations against a clean database.
- Push processing is at-least-once: generation and lease controls prevent stale completion, while frontend delivery keys reduce duplicate presentation.

Related deep dives: transactional push delivery ([EN](case-studies/09-transactional-push-delivery.md) · [RU](case-studies/09-transactional-push-delivery.ru.md)), privacy-aware PWA ([EN](case-studies/10-privacy-aware-pwa.md) · [RU](case-studies/10-privacy-aware-pwa.ru.md)), and production quality gates ([EN](case-studies/12-production-quality-gates.md) · [RU](case-studies/12-production-quality-gates.ru.md)).
