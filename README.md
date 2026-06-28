<p align="center">
  <img src="assets/logo.svg" alt="WARP Config Generator" width="460">
</p>

Минималистичный генератор конфигов Cloudflare WARP в форматах **AmneziaWG 1.5** и
**Clash**. Для каждой генерации создаётся свежая пара ключей X25519 и регистрируется
через официальный WARP API, поэтому конфиги рабочие «из коробки».

Вдохновлён [nellimonix/warp-config-generator-vercel](https://github.com/nellimonix/warp-config-generator-vercel),
но намеренно упрощён: два формата, два DNS, два эндпоинта.

## Зеркала

Проект доступен по нескольким адресам — выбирайте любой:

- https://warp-ru.duckdns.org/
- https://warp-ru.vercel.app/
- https://warp-ru.netlify.app/

## Что внутри

- **Форматы:** AmneziaWG (`.conf`, awg1.5) и Clash (`.yaml`)
- **DNS:** `dns.geohide.ru` и `xbox-dns.ru`
- **Эндпоинты (для AmneziaWG):** `162.159.195.1:500` и `engage.cloudflareclient.com:2408`
- **Шаблоны Clash:** кастомные локальные шаблоны Computer / Mobile / Router в
  [`config/templates/`](config/templates/) — на основе
  [codelabhq/clash-warp-config](https://github.com/codelabhq/clash-warp-config), но
  переработаны: без релеев, со своей структурой групп и расширенным пулом WARP-эндпоинтов
- Результат открывается в модальном окне: копирование и скачивание файла

## Стек

- Next.js 15 (App Router) + React 19 + TypeScript
- Генерация ключей — нативный `node:crypto` (X25519), без внешних крипто-зависимостей
- Без UI-фреймворков: чистый CSS по дизайн-системе из `DESIGN.md`

## Как это работает

```
ключи X25519  ──►  POST /reg (Cloudflare)  ──►  PATCH /reg/{id} warp_enabled
                                                       │
        ┌──────────────────────────────────────────────┘
        ▼
  AmneziaWG: собираем .conf (Jc/Jmin/Jmax, S1/S2, H1–H4, I1-сигнатура)
  Clash:     берём локальный шаблон устройства и подставляем private-key, ipv6, dns
```

Вся логика — в [`lib/`](lib/) (регистрация, билдеры) и [`config/`](config/) (DNS, эндпоинты,
шаблоны Clash). Точки входа — [`app/api/generate/route.ts`](app/api/generate/route.ts) (сайт)
и [`app/api/telegram/route.ts`](app/api/telegram/route.ts) (Telegram-бот).

## Локальный запуск

```bash
npm install
npm run dev      # http://localhost:3000
```

Прод-сборка:

```bash
npm run build
npm start
```

## Деплой

### Vercel

1. Импортируйте репозиторий на [vercel.com/new](https://vercel.com/new).
2. Framework определится как **Next.js** автоматически — настройки менять не нужно.
3. Deploy. API-роут `/api/generate` поедет как serverless-функция (Node runtime).

Или через CLI:

```bash
npm i -g vercel
vercel
```

### Netlify

В репозитории есть [`netlify.toml`](netlify.toml) с плагином
`@netlify/plugin-nextjs` — Netlify подхватит Next.js автоматически.

1. На [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Build command: `npm run build` (уже в `netlify.toml`), publish — по умолчанию.
3. Deploy.

Или через CLI:

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

## Где что менять

| Нужно изменить | Файл |
|---|---|
| DNS-провайдеры | [`config/dns.ts`](config/dns.ts) |
| Эндпоинты AmneziaWG | [`config/endpoints.ts`](config/endpoints.ts) |
| Clash-шаблоны: правила, группы, узлы | [`config/templates/*.yaml`](config/templates/) |
| Карта «устройство → файл шаблона» | [`config/clash-templates.ts`](config/clash-templates.ts) |
| WARP-эндпоинты в шаблонах (диапазоны/порты) | [`scripts/gen-endpoints.mjs`](scripts/gen-endpoints.mjs) → `npm run gen:endpoints` |
| Параметры awg1.5 (Jc/Jmin/Jmax, H1–H4) | [`lib/builders/amneziawg.ts`](lib/builders/amneziawg.ts) |
| I1-маски (awg1.5-сигнатура) | [`lib/i1-masks.ts`](lib/i1-masks.ts) |
| Логика Telegram-бота | [`lib/telegram.ts`](lib/telegram.ts) |

## Telegram-бот

Тот же генератор доступен как Telegram-бот — вебхук [`app/api/telegram/route.ts`](app/api/telegram/route.ts)
(общая логика в [`lib/telegram.ts`](lib/telegram.ts)), переиспользует ту же `generateConfig`.
Работает бесплатно на Vercel/Netlify — это обычная
serverless-функция, которую дёргает Telegram.

Бот пошагово спрашивает формат → устройство/эндпоинт → DNS и присылает готовый `.conf`/`.yaml` файлом.

Настройка:

1. Создайте бота у [@BotFather](https://t.me/BotFather) → получите токен.
2. В переменных окружения деплоя задайте `TELEGRAM_BOT_TOKEN` (опц. `TELEGRAM_WEBHOOK_SECRET` —
   защита вебхука от посторонних запросов). Передеплойте.
3. Привяжите вебхук — откройте один раз в браузере (адрес и секрет подставятся сами):

   ```
   https://<ваш-деплой>/api/telegram?token=<TELEGRAM_BOT_TOKEN>
   ```

   Должно вернуть `{"ok":true,...}`. Передеплой вебхук не сбрасывает — повторять не нужно.

Готово — напишите боту `/start`.

## Замечание про serverless

WARP API (`api.cloudflareclient.com`) иногда ограничивает регистрацию с IP облачных
провайдеров. Если на Vercel/Netlify регистрация начнёт отдавать ошибки HTTP 429/403 —
это лимит со стороны Cloudflare, а не баг генератора. Запросы к WARP идут с таймаутом
и понятной ошибкой в ответе API.
