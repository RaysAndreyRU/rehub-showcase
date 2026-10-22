# Кейс: realtime-уведомления на Redis

[English](08-realtime-notifications.md) | [Русский]

## Проблема

Отчёты, запросы пациентов, события безопасности, назначения и клинические alerts меняются, пока администратор онлайн. Polling всех списков расходует ресурсы, а in-memory socket map перестаёт работать при нескольких API instances.

## Реализованный подход

Backend сохраняет notification records и использует Socket.IO для немедленной доставки. Handshake проверяет access token, подключение хранится в Redis set пользователя, а Redis adapter распространяет events между API instances.

```mermaid
flowchart LR
    Domain[Доменный сервис] --> Record[(Запись уведомления)]
    Domain --> Gateway[Notification gateway]
    Gateway --> Adapter[Socket.IO Redis adapter]
    Adapter --> API1[API instance A]
    Adapter --> API2[API instance B]
    API1 --> Browser1[Socket пользователя]
    API2 --> Browser2[Второй socket]
```

Протокол включает acknowledgement `ready` до сохранения socket. Сервис отправляет новые и изменённые элементы, а также unread/unseen counts. Ошибки доставки изолированы от долговечного domain action: временный сбой socket не откатывает отчёт или назначение.

Через module configuration realtime заменяется disabled gateway с тем же service dependency.

## Публичный durable-first sample

Запускаемый slice `src/notifications` сводит сценарий к главной гарантии:

```mermaid
sequenceDiagram
    participant UseCase as CreateNotification
    participant Store as Durable repository
    participant Realtime as Realtime port
    participant Monitor as Failure reporter
    UseCase->>Store: Создать уведомление
    Store-->>UseCase: Сохранённая запись
    UseCase->>Realtime: Best-effort доставка
    alt доставлено
        Realtime-->>UseCase: Успех
    else transport недоступен
        Realtime-->>UseCase: Ошибка
        UseCase->>Monitor: Зафиксировать сбой
        UseCase-->>UseCase: Сохранить durable result
    end
```

Persistence failure остаётся фатальным, потому что восстанавливаемого уведомления нет. Realtime failure регистрируется, но возвращается как `DEFERRED`: клиент восстановит данные из persisted list после reconnect.

## Компромиссы

- Socket delivery — advisory; persisted list остаётся recovery path.
- Connection sets требуют cleanup и защиты от stale entries.
- Проверка токена при подключении не перевалидирует long-lived socket после изменения роли или сессии.
- Acknowledgement timeouts улучшают протокол, но требуют совместимости клиента.

## Инженерный результат

Архитектура отделяет долговечное состояние уведомления от best-effort realtime transport и поддерживает горизонтальное масштабирование API.

Realtime — только один канал. Фоновая доставка использует PostgreSQL outbox, BullMQ и Firebase, как описано в [кейсе push-доставки](09-transactional-push-delivery.ru.md). Браузерная граница разобрана в [кейсе PWA и Web Push](10-privacy-aware-pwa.ru.md).
