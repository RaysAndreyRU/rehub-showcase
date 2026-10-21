# Security and Disclosure Model

## Implemented boundaries represented by this showcase

- JWT/Passport authentication and protected route guards.
- Role- and permission-aware API endpoints.
- Durable audit records for relevant login events.
- Expiring Redis counters and temporary IP blocks after repeated failures.
- Password reset requests with a managed lifecycle.
- Authenticated Socket.IO namespaces and per-user connection tracking.
- DTO validation before service execution.
- File metadata separated from object storage payloads.

## Threat-to-control map

| Threat | Representative control |
| --- | --- |
| Repeated credential guessing | Per-IP failure counter, TTL, temporary block, and audit event. |
| Unauthorized role access | Backend guards and actor-scoped queries. |
| Contract drift between UI and API | Runtime Zod validation in frontend boundaries and validated backend DTOs. |
| Unauthenticated realtime connection | Access-token validation during socket handshake. |
| Lost realtime events during scale-out | Redis Socket.IO adapter plus durable notification records. |
| Accidental private-data publication | Simplified original sample, synthetic identifiers, and explicit disclosure exclusions. |

## Portfolio disclosure boundary

This repository does not publish:

- `.env` files, tokens, credentials, production URLs, or infrastructure manifests;
- the private Prisma schema or migration history;
- real user, patient, doctor, diary, or report data;
- complete production source files;
- detailed medical thresholds or content that could be treated as clinical advice;
- third-party integration secrets or provider-specific request contracts.

The documentation describes system behavior at an engineering-review level. Code snippets and the runnable sample are intentionally reconstructed and simplified.

## Important limitation

Rehub is a portfolio and educational project. The presence of security controls does not imply formal healthcare certification, regulatory compliance, a completed threat model, or production medical-device status.
