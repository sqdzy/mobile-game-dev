# Архитектурный обзор

## Что это за проект
Репозиторий содержит мобильную игру на Expo/React Native и небольшой backend на Flask для:
- регистрации/логина игрока;
- синхронизации прогресса между устройствами;
- получения таблицы лидеров.

Код разделён на две основные части:
- **Мобильное приложение** (TypeScript, Expo Router) — папки `app/`, `components/`, `store/`, `game/`.
- **Backend API** (Python, Flask, SQLAlchemy) — пакет `server/`.

## Высокоуровневая схема компонентов

### Мобильное приложение
- Навигация построена на **Expo Router** (`app/`). Корневой layout в `app/_layout.tsx` создаёт `RootStore` и прокидывает его через React Context.
- Состояние приложения хранится в **MobX** сторах (`store/`).
  - `AuthStore` отвечает за авторизацию, хранение токена, и синхронизацию снапшота прогресса.
  - `LeaderboardStore` загружает таблицу лидеров из API.
  - `CurrencyStore` / `UpgradeStore` / `StatStore` хранят локальный прогресс.
- Игровая логика match-3 вынесена в `game/match3/`.
  - В `game/match3/logic.ts` находятся функции и правила матчинга/спешалов.
  - UI-компоненты поля/панелей — в `components/match3/`.

### Backend API
- Entry point: `server/app.py`.
- Конфигурация: `server/config.py` (env vars + defaults).
- База данных: `server/database.py` (SQLAlchemy + `create_all`).
- Модели: `server/models.py` (таблицы `users`, `profiles`).
- Маршруты: `server/routes.py` (Blueprint `/api`).
- Аутентификация: `server/auth.py` (пароли + Bearer-токены).

## Потоки данных

### Авторизация
1. Клиент вызывает `POST /api/register` или `POST /api/login`.
2. Сервер возвращает `token` и `profile`.
3. Клиент сохраняет токен в AsyncStorage и использует его в `Authorization: Bearer ...`.

### Синхронизация прогресса
1. Клиент формирует снапшот: `coins`, `upgrades`, `stats` (см. `AuthStore.buildSyncPayload`).
2. Клиент вызывает `POST /api/sync`.
3. Сервер сохраняет значения в `profiles` и возвращает обновлённый снапшот.

### Таблица лидеров
1. Клиент вызывает `GET /api/leaderboard?limit=25`.
2. Сервер возвращает список игроков, сортированный по монетам.

## Примечания по контрактам
- Адрес backend API задаётся переменной окружения `EXPO_PUBLIC_API_BASE_URL`. Если она не установлена, клиент использует `http://localhost:5000/api`.
- Поля `upgrades` и `stats` — это JSON-снимки состояния. Сервер хранит и возвращает их как данные, а смысл ключей задаётся клиентской частью (MobX сторами).
