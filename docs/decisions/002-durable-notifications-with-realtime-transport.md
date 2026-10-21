# ADR 002: Persist Notifications Before Realtime Delivery

## Status

Accepted in the represented architecture.

## Context

Socket connections are temporary and delivery can fail. Report, request, security, assignment, and clinical events still need to be visible after reconnecting.

## Decision

Store the notification as durable data and treat Socket.IO delivery as a low-latency projection. Use Redis to coordinate connections and the Socket.IO adapter across instances.

## Consequences

- Reconnection does not lose the notification history.
- Realtime errors do not need to roll back the originating domain transaction.
- Clients must reconcile socket events with the list endpoint.
- Duplicate delivery must be tolerated by identifier.
