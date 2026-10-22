# Rehub Engineering Case Studies

These notes were reconstructed from a focused review of the private Rehub backend, main web application, admin panel, and technical documentation. They explain implemented behavior without copying production source or exposing sensitive contracts.

## System map

```mermaid
flowchart LR
    Patient --> MainWeb[Main Next.js PWA]
    Doctor --> MainWeb
    Admin --> AdminWeb[Admin Next.js app]
    MainWeb --> API[NestJS API]
    AdminWeb --> API
    API --> DB[(PostgreSQL)]
    API --> Redis[(Redis)]
    API --> Files[Object storage]
    API --> Notify[Realtime and external notifications]
    API --> Outbox[(Push outbox)]
    Outbox --> Queue[BullMQ / Redis]
    Queue --> Worker[Push worker]
    Worker --> FCM[Firebase]
    FCM --> MainWeb
```

## Deep dives

1. [Role-oriented platform boundaries](01-role-oriented-platform.md)
2. [Rehabilitation program lifecycle](02-rehabilitation-program-lifecycle.md)
3. [Diary and progress projections](03-diary-and-progress.md)
4. [Clinical policies and event lifecycles](04-clinical-policies.md)
5. [Login audit and IP throttling](05-login-audit-and-ip-throttling.md)
6. [Reports, exports, and side effects](06-reports-and-exports.md)
7. [Contract-first mock-to-API migration](07-contract-first-frontend.md)
8. [Redis-backed realtime notifications](08-realtime-notifications.md)
9. [Transactional push delivery](09-transactional-push-delivery.md)
10. [Privacy-aware PWA and web push](10-privacy-aware-pwa.md)

## Reading rule

Each case distinguishes what exists in the private project from what is simplified in the public sample. Known limitations are part of the analysis rather than hidden from it.
