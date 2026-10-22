# Case Study: Privacy-aware PWA and Web Push

## Problem

Patients and doctors benefit from an installable application and timely notifications, but a conventional offline-first strategy can be unsafe for authenticated rehabilitation data. A service worker that indiscriminately caches pages or API responses may expose stale private information after logout or account switching.

The frontend also needs one coherent worker. Independent PWA and Firebase workers would compete for the same scope and create unpredictable install, update, cache, and push behavior.

## Implemented approach

The main Next.js application publishes a web manifest and builds one service worker from composable sources. The base worker owns install, activation, conservative caching, offline fallback, and notification clicks. When push is enabled at build time, the Firebase background handler is bundled into that same worker.

```mermaid
flowchart LR
    Manifest[Web app manifest] --> Install[Installable PWA]
    Base[Base service worker] --> Bundle[Single /sw.js]
    Firebase[Firebase messaging worker] --> Bundle
    Bundle --> Cache[Public static cache]
    Bundle --> Offline[Offline fallback]
    Bundle --> Background[Background notifications]
    Bundle --> Click[Safe notification navigation]
```

## Cache trust boundary

The application uses a narrow caching policy instead of treating every GET request as public.

```mermaid
flowchart TD
    Request[Fetch request] --> Method{GET and same origin?}
    Method -->|No| Network[Network only]
    Method -->|Yes| Private{Private route or Authorization header?}
    Private -->|Yes| Network
    Private -->|No| Kind{Navigation or static asset?}
    Kind -->|Navigation| NetworkFirst[Network first]
    NetworkFirst -->|Offline| Fallback[Static offline page]
    Kind -->|Versioned static asset| CacheFirst[Cache first]
    CacheFirst --> Safe{Response cacheable?}
    Safe -->|Yes| Store[Store public response]
    Safe -->|No| Return[Return without caching]
```

Authenticated API requests and patient, doctor, authentication, and login routes bypass Cache Storage. Responses marked private or non-cacheable are not stored. This makes offline support deliberately modest: the app shell can explain network loss, but protected clinical screens are not replayed from a previous session.

## Permission and token lifecycle

Notification permission is requested only after an explicit user action in the doctor or patient profile. The application does not prompt on first page load.

```mermaid
sequenceDiagram
    participant User
    participant UI as Profile control
    participant Browser
    participant Firebase as Firebase Web SDK
    participant API as Rehub API

    User->>UI: Enable notifications
    UI->>Browser: Request permission
    Browser-->>UI: granted / denied
    alt granted
        UI->>Firebase: Get token with VAPID key and active worker
        Firebase-->>UI: Browser registration token
        UI->>API: Register token for authenticated user
        API-->>UI: Accepted
    else denied or unsupported
        UI-->>User: Explain browser state
    end

    User->>UI: Disable notifications or sign out
    UI->>API: Remove owned registration
    UI->>Firebase: Delete local token
```

Registration is idempotent and tied to the authenticated user. The token is resynchronized during later authenticated sessions because browsers and Firebase can rotate it. Logout remains available even when Firebase or the API is temporarily unreachable; local cleanup is still attempted.

## Foreground and background delivery

```mermaid
flowchart LR
    FCM[FCM data message] --> State{App visible?}
    State -->|Yes| Foreground[Foreground message handler]
    Foreground --> Dedupe[Delivery-key cache]
    Dedupe --> Toast[In-app toast]
    State -->|No| Worker[Service worker]
    Worker --> Tag[Notification tag from delivery key]
    Tag --> System[System notification]
    System --> Click[Notification click]
    Click --> Sanitize[Same-origin URL sanitizer]
    Sanitize --> Existing[Focus and navigate existing window]
    Sanitize --> New[Or open a new window]
```

The background and foreground paths share the same neutral message semantics and delivery key. Notification clicks accept only a safe same-origin destination; malformed or external destinations fall back to the application root.

## Build-time configuration

The service worker is generated before development and production builds:

```mermaid
flowchart LR
    Env[Public Firebase config] --> Validate{Push enabled?}
    Validate -->|No| BaseWorker[Bundle base PWA worker]
    Validate -->|Yes, complete config| PushWorker[Bundle PWA + Firebase worker]
    Validate -->|Yes, missing values| Fail[Fail the build]
    BaseWorker --> Output[public/sw.js]
    PushWorker --> Output
```

Client Firebase configuration and the VAPID public key are intentionally public build inputs. Firebase Admin credentials remain backend-only secrets and never enter the browser bundle.

## UX and platform behavior

- The manifest defines standalone display, application scope, theme colors, and regular/maskable icons.
- Service worker updates bypass HTTP cache to reduce stale worker deployments.
- Push support is feature-detected because browsers, private modes, device policies, and operating systems differ.
- Denied permission cannot be reversed by application code; the UI directs the user to browser settings.
- Web push requires HTTPS outside local development.
- Some mobile platforms require installation to the home screen before web push is available.

## Trade-offs

- Conservative caching provides less offline functionality but materially reduces privacy risk.
- Build-time Firebase configuration requires a rebuild when project settings change.
- Browser delivery cannot guarantee that the user saw or acted on a notification.
- Local deduplication reduces repeated presentation but does not turn the distributed pipeline into exactly-once delivery.

## Engineering signal

The PWA treats the service worker as a security boundary, not just a performance feature. Installation, offline behavior, push lifecycle, navigation safety, and backend delivery semantics are designed as one system.

The public case intentionally excludes production Firebase identifiers, private endpoints, credential material, and medical message content.
