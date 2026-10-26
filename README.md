# Rehub Engineering Showcase

> A portfolio-safe technical case study of a multi-role rehabilitation management platform for patients, doctors, and administrators.

[Русская версия](README.ru.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Realtime_%26_Security-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![CI](https://github.com/RaysAndreyRU/rehub-showcase/actions/workflows/quality.yml/badge.svg)](https://github.com/RaysAndreyRU/rehub-showcase/actions/workflows/quality.yml)

## Why this repository exists

Rehub was created as a graduation project and later expanded into a broad rehabilitation platform. Its product repositories remain private because they contain the complete implementation, environment configuration, integration contracts, and detailed medical workflows.

This repository makes the engineering work reviewable without publishing the product source. It contains:

- a system architecture map;
- patient, doctor, and administrator user flows;
- focused case studies based on implemented behavior;
- a compact runnable TypeScript example of login auditing and temporary IP blocking;
- security, testing, and delivery notes;
- explicit boundaries between implemented capabilities and simplified showcase code.

The sample under `src/` is an original, reduced reference implementation. It is not copied from the private repositories and contains no credentials, personal data, production schema, medical records, or proprietary deployment configuration.

## Product overview

Rehub coordinates the rehabilitation lifecycle across three roles:

- patients follow assigned programs, complete exercises, keep a diary, and review progress;
- doctors manage patients, assign programs, inspect diaries and progress, and prepare reports;
- administrators maintain clinical catalogs, program templates, risk rules, recommendations, reports, analytics, and security operations.

The product surface is split across a multi-role Next.js application, a dedicated administrative panel, a modular NestJS backend, and separate business and technical documentation.

## System architecture

```mermaid
flowchart LR
    Patient[Patient] --> Web[Multi-role Next.js PWA]
    Doctor[Doctor] --> Web
    Admin[Administrator] --> AdminUI[Next.js admin panel]

    Web --> API[NestJS API]
    AdminUI --> API
    API --> PG[(PostgreSQL)]
    API --> Redis[(Redis)]
    API --> Storage[MinIO / object storage]
    API --> Realtime[Socket.IO notifications]
    API --> Outbox[(Notification outbox)]
    Outbox --> Queue[BullMQ / Redis]
    Queue --> PushWorker[Push worker]
    PushWorker --> FCM[Firebase Cloud Messaging]
    FCM --> Web
    API --> External[Email, SMS and optional AI services]
    Realtime --> Redis
```

The backend is organized around domain modules and a controller → service → repository → Prisma request path. The admin frontend uses runtime Zod contracts and a `schemas → services → queries → pages` flow. The main web application uses pragmatic route and service boundaries; this showcase intentionally does not label it as Feature-Sliced Design.

Read the full [architecture overview](docs/architecture.md) and [role-oriented user flows](docs/user-flows.md).

## Architecture deep dives

| Case study | Engineering focus |
| --- | --- |
| [Role-oriented platform boundaries](docs/case-studies/01-role-oriented-platform.md) ([RU](docs/case-studies/01-role-oriented-platform.ru.md)) | One domain model exposed through patient, doctor, and administrator workflows. |
| [Rehabilitation program lifecycle](docs/case-studies/02-rehabilitation-program-lifecycle.md) ([RU](docs/case-studies/02-rehabilitation-program-lifecycle.ru.md)) | Templates, assignments, planned and performed sessions, and progress. |
| [Diary and progress projections](docs/case-studies/03-diary-and-progress.md) ([RU](docs/case-studies/03-diary-and-progress.ru.md)) | Turning exercise facts and patient observations into doctor-facing context. |
| [Clinical policies and event lifecycles](docs/case-studies/04-clinical-policies.md) ([RU](docs/case-studies/04-clinical-policies.ru.md)) | Red-flag and recommendation configuration without presenting software as a diagnosis engine. |
| [Login audit and IP throttling](docs/case-studies/05-login-audit-and-ip-throttling.md) ([RU](docs/case-studies/05-login-audit-and-ip-throttling.ru.md)) | Durable security events combined with expiring Redis counters. |
| [Reports, exports, and side effects](docs/case-studies/06-reports-and-exports.md) ([RU](docs/case-studies/06-reports-and-exports.ru.md)) | Report lifecycle, PDF data, attachments, email delivery, and notifications. |
| [Contract-first mock-to-API migration](docs/case-studies/07-contract-first-frontend.md) ([RU](docs/case-studies/07-contract-first-frontend.ru.md)) | Zod contracts, React Query, MSW, and incremental backend integration. |
| [Redis-backed realtime notifications](docs/case-studies/08-realtime-notifications.md) ([RU](docs/case-studies/08-realtime-notifications.ru.md)) | Authenticated sockets, per-user connections, acknowledgements, and horizontal scale. |
| [Transactional push delivery](docs/case-studies/09-transactional-push-delivery.md) ([RU](docs/case-studies/09-transactional-push-delivery.ru.md)) | PostgreSQL outbox, BullMQ recovery, target-scoped retries, and Firebase delivery. |
| [Privacy-aware PWA and web push](docs/case-studies/10-privacy-aware-pwa.md) ([RU](docs/case-studies/10-privacy-aware-pwa.ru.md)) | One service worker, conservative caching, explicit permission, and end-to-end deduplication. |
| [Brownfield maintenance and safe migrations](docs/case-studies/11-brownfield-maintenance-and-safe-migrations.md) ([RU](docs/case-studies/11-brownfield-maintenance-and-safe-migrations.ru.md)) | Cross-surface compatibility, expand–migrate–contract rollouts, backfills, recovery, and explicit modernization limits. |
| [Production quality gates](docs/case-studies/12-production-quality-gates.md) ([RU](docs/case-studies/12-production-quality-gates.ru.md)) | Backend migration safety, frontend browser tests, diagnostic artifacts, and gated Docker publishing. |

Start with the [case study index](docs/case-studies/README.md).

## Public vertical slices

The repository contains three runnable, independently testable examples:

```text
src/
├── login-security/     Durable login audit and expiring attempt state
├── red-flag-engine/    Deterministic policy evaluation and cooldown
└── notifications/      Durable-first creation with best-effort realtime
```

Together they demonstrate:

- separation of durable security audit from expiring counters and blocks;
- deterministic evaluation of six comparison operators over time-windowed measurements;
- suppression of duplicate red-flag candidates during cooldown;
- durable notification persistence before realtime delivery;
- graceful degradation when the realtime transport is unavailable;
- dependency inversion and behavior-focused tests;
- infrastructure ports that can be backed by PostgreSQL, Redis, and Socket.IO.

The production implementation uses NestJS services and guards, Prisma repositories, Redis state, and Socket.IO gateways. The red-flag evaluator in this repository is a reference implementation of the published rule semantics, not a copy or claim of identical production execution code. Exact schema, keys, endpoints, and configuration are intentionally omitted.

## Run the sample

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run check
```

| Command | Purpose |
| --- | --- |
| `npm test` | Run behavior tests with Vitest. |
| `npm run test:coverage` | Run tests and enforce coverage thresholds. |
| `npm run typecheck` | Check strict TypeScript contracts. |
| `npm run check` | Run the complete local quality gate. |

## Verified testing and delivery

Each deployable repository now has an automated GitHub Actions pipeline. The backend validates its complete Prisma migration history against a clean PostgreSQL instance before building API, migration, and Prisma Studio images. The main web and admin applications run type checks, unit or contract tests, production builds, and Playwright browser scenarios before stage or production images can be published.

Snapshot verified on 2026-10-26:

| Surface | Automated evidence | Delivery gate |
| --- | --- | --- |
| Backend | 73 tests across 29 suites plus a clean-database migration smoke test | API, migration, and Prisma Studio images depend on both quality and migration jobs. |
| Main web | 43 unit/contract tests and 7 Chromium E2E scenarios | Stage and production images depend on quality and E2E jobs. |
| Admin | 16 unit tests and 5 Chromium E2E scenarios | Stage and production images depend on quality and E2E jobs. |

The browser suites preserve JUnit results, HTML reports, traces, screenshots, and video when useful for failure analysis. Counts are a dated evidence snapshot, not a claim of platform-wide coverage. See [Testing and Delivery](docs/testing.md) for the test boundaries and [the production quality-gates case study](docs/case-studies/12-production-quality-gates.md) for the pipeline design.

## Technology map

| Area | Technologies |
| --- | --- |
| Main application | Next.js, React, TypeScript, React Query, Zod, NextAuth, PWA service worker |
| Admin panel | Next.js, React, TypeScript, React Query, React Hook Form, Zod, MSW |
| Backend | NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO, Firebase Admin |
| Push delivery | Transactional outbox, BullMQ workers, Firebase Cloud Messaging, Web Push |
| Storage and output | MinIO-compatible storage, React PDF, spreadsheet exports |
| Delivery | Docker, GitHub Actions, Playwright, clean-database migration smoke tests |
| Public sample | TypeScript, Vitest |

## Disclosure boundary

Not published here:

- production source code or database schema;
- patient, doctor, or administrator data;
- credentials, environment files, hostnames, or deployment manifests;
- exact permission matrices and integration configuration;
- medical content that could be interpreted as treatment guidance;
- private API payloads beyond deliberately simplified examples.

See [security and disclosure notes](docs/security.md).

## Project context

This is a portfolio case study, not a medical device and not a deployable healthcare product. It documents engineering decisions, implemented workflows, and known trade-offs from a graduation project that continued to evolve after its initial delivery.
