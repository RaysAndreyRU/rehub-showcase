# ADR 001: Separate Durable Audit from Expiring Throttle State

## Status

Accepted for the public reference implementation.

## Context

Login events are useful for investigation and administrative review, while failed-attempt counters exist only to enforce a short security window. They have different retention, query, and atomicity requirements.

## Decision

Expose two ports to the application use case:

- a durable append-oriented audit port;
- an expiring login-attempt port with atomic failure registration and reset.

The private system maps these responsibilities to PostgreSQL/Prisma and Redis respectively. The public sample uses in-memory adapters.

## Consequences

- Each store is used for the state lifetime it handles well.
- The use case can be tested without infrastructure.
- Failure policy across the two stores must be explicit.
- Production Redis operations must preserve threshold and TTL semantics under concurrency.
