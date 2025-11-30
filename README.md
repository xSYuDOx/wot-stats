# WoT Stats in Docker

Минимальный шаблон для авторизации через OAuth Wargaming, сохранения токена в Postgres и вывода ключевой статистики игрока через React.

## Что входит
- **API (Node.js + Express)**: OAuth-авторизация, сессии, эндпоинты для получения и обновления статистики.
- **Web (React + Vite)**: простая страница с кнопкой входа и карточкой статистики.
- **Postgres**: хранит пользователей и их последнюю синхронизацию.
- **Docker Compose**: поднимает все сервисы одной командой.

## Запуск
1. Скопируйте примеры переменных окружения и заполните `WG_APPLICATION_ID`:
   ```bash
   cp server/.env.example server/.env
   cp web/.env.example web/.env
   ```
2. Запустите контейнеры:
   ```bash
   docker-compose up --build
   ```
3. Откройте интерфейс: http://localhost:4173

## Настройка OAuth Wargaming
- Зарегистрируйте приложение в Wargaming Developer Room и получите `application_id`.
- В настройках приложения пропишите redirect URL: `http://localhost:3000/auth/callback`.
- Значение `WG_REGION` можно поменять (`eu`, `ru`, `asia`, `na`).

## Основные эндпоинты API
- `GET /auth/login` — редиректит на Wargaming OAuth.
- `GET /auth/callback` — принимает `access_token`, сохраняет пользователя и создаёт сессию.
- `GET /api/session` — проверка авторизации.
- `GET /api/stats` — отдаёт сохранённую статистику или подтягивает её с Wargaming.
- `POST /api/stats/refresh` — принудительная синхронизация.
- `POST /auth/logout` — сбрасывает сессию.

## Структура
```
server/  # Express API и SQL для Postgres
web/     # React SPA (Vite)
docker-compose.yml
```
