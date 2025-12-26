# Backend API (Flask)

Базовый префикс: `/api` (см. `server/app.py`).

## Аутентификация
- Используется Bearer token в заголовке:

```
Authorization: Bearer <token>
```

Токен выдаётся методами `/register` и `/login`.

## `GET /health`
Назначение: проверка работоспособности.

Ответ (200):
```json
{"status":"ok"}
```

## `POST /register`
Назначение: создать пользователя и вернуть токен.

Тело запроса:
```json
{"nickname":"hero","password":"secret123"}
```

Ограничения (из кода `server/routes.py`):
- `nickname` длиной минимум 3.
- `password` длиной минимум 6.

Ответ (200):
- `token` (string)
- `nickname` (string)
- `profile` (object): `nickname`, `coins`, `upgrades`, `stats`, `updatedAt`

Ошибки:
- 400: короткий ник/пароль
- 409: ник занят

## `POST /login`
Назначение: выдать токен по существующим учётным данным.

Тело запроса:
```json
{"nickname":"hero","password":"secret123"}
```

Ответ (200): такой же, как у `/register`.

Ошибки:
- 401: неверные учётные данные

## `GET /profile`
Назначение: получить текущий снапшот профиля.

Требует токен.

Ответ (200):
```json
{
  "nickname": "hero",
  "coins": 10,
  "upgrades": {"someUpgrade": 1},
  "stats": {"moves": 42},
  "updatedAt": "2025-11-14T10:00:00.000000"
}
```

Примечание:
- Структуры `upgrades` и `stats` на сервере не валидируются; они хранятся как JSON и возвращаются клиенту.

## `POST /sync`
Назначение: сохранить снапшот прогресса.

Требует токен.

Тело запроса:
```json
{
  "coins": 10,
  "upgrades": {"someUpgrade": 1},
  "stats": {"moves": 42}
}
```

Ошибки:
- 400: если `upgrades` или `stats` не сериализуются в JSON

## `GET /leaderboard`
Назначение: таблица лидеров.

Требует токен.

Query params:
- `limit` (int): по умолчанию 25, максимум 100.

Ответ:
```json
{"entries":[{"nickname":"hero","coins":10,"updatedAt":"..."}]}
```

## Ограничения текущей реализации
- Endpoint для удаления аккаунта/данных в API не реализован.
- Валидация `nickname` ограничена `.strip()` и проверкой длины (см. `server/routes.py`).
- Rate limiting и защита от перебора паролей на уровне приложения не реализованы.
