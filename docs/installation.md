# Установка и зависимости

## Требования

### Мобильное приложение
- Node.js и npm (версия не закреплена в репозитории).
- Expo CLI используется через `npx`.

### Backend (Flask)
- Python 3.x (версия не закреплена в репозитории).
- Зависимости устанавливаются из `server/requirements.txt`:
  - Flask
  - Flask-Cors
  - Flask-SQLAlchemy
  - itsdangerous
  - python-dotenv

## Установка и запуск (локальная разработка)

### 1) Backend API
Команды для Windows PowerShell (из корня репозитория):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server\requirements.txt
flask run --host 0.0.0.0 --port 5000
```

Примечания:
- Порт 5000 выбран потому, что клиент по умолчанию обращается к `http://localhost:5000/api` (см. `services/api.ts`).
- Таблицы создаются автоматически при старте (см. `server/database.py:init_db`).

### 2) Мобильное приложение

```powershell
npm install
# при необходимости укажите URL backend перед стартом Metro
$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:5000/api"
npm start
```

Если вы запускаете приложение на физическом устройстве, `localhost` будет указывать на телефон.
Нужно выставить IP компьютера в локальной сети, например:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://192.168.0.10:5000/api"
```

## Конфигурация

### Переменные окружения backend
См. `server/config.py`:
- `API_SECRET_KEY` — ключ подписи токенов (в проде обязателен).
- `DATABASE_URL` — строка подключения SQLAlchemy.
- `TOKEN_MAX_AGE` — срок жизни токена в секундах.

### Переменные окружения клиента
См. `services/api.ts`:
- `EXPO_PUBLIC_API_BASE_URL` — базовый URL для API.
