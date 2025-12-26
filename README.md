# Лига героев: Match-3 Tower

Мобильная игра на Expo/React Native (TypeScript) с механикой match-3 и системой улучшений.
Репозиторий также содержит небольшой backend на Flask (Python) для аккаунтов, синхронизации прогресса и таблицы лидеров.

## Быстрый старт

### 1) Мобильное приложение

```powershell
npm install
npx expo start
```

Проект использует file-based routing через Expo Router; основные экраны находятся в папке `app/`.

### 2) Backend API (Flask)

Backend находится в `server/`.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server\requirements.txt
flask --app server.app run --host 0.0.0.0 --port 5000
```

Факт из кода:
- Клиентская часть по умолчанию обращается к `http://localhost:5000/api` (см. `services/api.ts`).

Если вы хотите указать другой URL, задайте переменную окружения до запуска Metro:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:5000/api"
npm start
```

Если приложение запущено на физическом устройстве, используйте IP вашего компьютера в локальной сети вместо `localhost`.

## Конфигурация

### Клиент
- `EXPO_PUBLIC_API_BASE_URL` — базовый URL backend (см. `services/api.ts`).

### Backend
См. `server/config.py`:
- `API_SECRET_KEY` — ключ подписи токенов (обязателен в проде).
- `DATABASE_URL` — строка подключения SQLAlchemy.
- `TOKEN_MAX_AGE` — срок жизни токена (секунды).

## Тесты и качество

```powershell
npm run lint
npm test
```

Сценарии ручного/интеграционного тестирования описаны в `TEST_PLAN.md`.

## Документация
- Архитектура: `docs/overview.md`
- Установка: `docs/installation.md`
- Сценарии: `docs/usage.md`
- API: `docs/api/README.md`
- Troubleshooting: `docs/troubleshooting.md`
- Единый отчёт (XeLaTeX, ГОСТ 7.32-2017): `main.tex`

## Примечания
- В репозитории нет `.env.example`; переменные окружения задаются вручную.
- Версии Node.js/Python в репозитории не закреплены.
- Адрес backend на клиенте задаётся через `EXPO_PUBLIC_API_BASE_URL`.
