# Клиентский API-клиент (`services/api.ts`)

Модуль `services/api.ts` инкапсулирует HTTP-вызовы к backend.

## Базовый URL
- Используется `process.env.EXPO_PUBLIC_API_BASE_URL`.
- Если переменная не задана, по умолчанию: `http://localhost:5000/api`.

`/` на конце обрезается, чтобы корректно формировать URL.

## Экспортируемые типы
- `ProfileSnapshotResponse`
- `AuthResponse`
- `SyncPayload`
- `LeaderboardEntryResponse`
- `LeaderboardResponse`

## Экспортируемые функции

### `registerRequest(payload)`
- Делает `POST /register`.
- Возвращает `AuthResponse`.

### `loginRequest(payload)`
- Делает `POST /login`.
- Возвращает `AuthResponse`.

### `profileRequest(token)`
- Делает `GET /profile`.
- Требует заголовок `Authorization: Bearer ...`.
- Возвращает `ProfileSnapshotResponse`.

### `syncRequest(token, payload)`
- Делает `POST /sync`.
- Возвращает `ProfileSnapshotResponse`.

### `leaderboardRequest(token, limit=25)`
- Делает `GET /leaderboard?limit=<n>`.
- Лимит принудительно приводится к диапазону 1..100.
- Возвращает `LeaderboardResponse`.

## Ошибки
Если HTTP-статус не OK:
- парсится поле `message` из JSON (если есть);
- иначе выбрасывается `Error` с текстом `Запрос к API завершился ошибкой <status>`.

Если ответ пустой или не JSON:
- выбрасывается `Error('Ответ API не содержит данных.')`.

## Примечание
Смысл ключей в `upgrades`/`stats` задаётся клиентскими сторами и используется как снимок состояния при синхронизации.
