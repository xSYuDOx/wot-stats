# WoT Stats у Docker

Мінімальний шаблон для авторизації через OAuth Wargaming, збереження токена в Postgres і показу ключової статистики гравця через React.

## Що входить
- **API (Node.js + Express)**: OAuth-авторизація, сесії, ендпоінти для отримання й оновлення статистики.
- **Web (React + Vite)**: проста сторінка з кнопкою входу та карткою статистики.
- **Postgres**: зберігає користувачів і їхню останню синхронізацію.
- **Docker Compose**: підіймає всі сервіси однією командою.

## Запуск
1. Скопіюйте приклади змінних середовища та заповніть `WG_APPLICATION_ID` **реальним** значенням з Wargaming Developer Room (плейсхолдер `your_wargaming_app_id` спричинить помилку `INVALID_APPLICATION_ID`):
   ```bash
   cp server/.env.example server/.env
   cp web/.env.example web/.env
   ```
2. Запустіть контейнери:
   ```bash
   docker-compose up --build
   ```
   Збірка використовує файли з поточної директорії проєкту як робочі каталоги контейнерів. Код серверу й вебклієнта монтується безпосередньо всередину контейнерів, тож зміни у файловій системі відразу доступні сервісам без копіювання.
   Дані Postgres зберігаються у директорії `./postgres-data`, доступній поза контейнером.
   Якщо ви оновлювали значення у будь-якому `.env` файлі, пересберіть образи:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up
   ```
3. Відкрийте інтерфейс: http://localhost:4173

## Налаштування OAuth Wargaming
- Зареєструйте застосунок у Wargaming Developer Room і отримайте `application_id`.
- У налаштуваннях застосунку додайте redirect URL: `http://localhost:3000/auth/callback`.
- Значення `WG_REGION` можна змінити (`eu`, `ru`, `asia`, `na`).

## Основні ендпоінти API
- `GET /auth/login` — редіректить на Wargaming OAuth.
- `GET /auth/callback` — приймає `access_token`, зберігає користувача й створює сесію.
- `GET /api/session` — перевірка авторизації.
- `GET /api/stats` — віддає збережену статистику або підтягує її з Wargaming.
- `POST /api/stats/refresh` — примусова синхронізація.
- `POST /auth/logout` — скидає сесію.

## Структура
```
server/  # Express API та SQL для Postgres
web/     # React SPA (Vite)
docker-compose.yml
```
