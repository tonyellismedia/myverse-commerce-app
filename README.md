# Myverse

myverse commerce project

An original multi-store commerce application for luxury interiors, furniture, lighting, and decorative objects. Myverse has its own design and branding and has no Shopify dependency.

## Run with Docker

With Docker and Compose installed, run `docker compose up -d --build --wait`. The app listens on loopback port 8080 and keeps store data in a persistent named volume. See [DOCKER.md](DOCKER.md) for setup, optional AI credentials, updates, and using an existing server. Railway is optional.

## Development

Use Node.js 24 or newer and npm:

```sh
export npm_config_cache=/workspace/.cache/npm
npm ci
npm run dev
```

The frontend uses loopback port 5173 and proxies `/api` to the API on port 3001. Both are started by the development supervisor. Open the application, register a merchant account, and create your first store. Public example collection: `/store/myverse-atelier`.

```sh
npm test
npm run build
npm start
```

`npm start` serves the built frontend and API together on port 3001; use it instead of the development supervisor. Readiness requires a successful `/api/health` response and a functional storefront request, not just an open port. SQLite persists in the ignored `.data/commerce.sqlite` directory; preserve it. Tests use separate disposable databases. Existing local stores and data are preserved during schema upgrades; legacy sample stores remain public examples and are not assigned to new merchants.

## Included

- Merchant registration, sign-in, sign-out, scrypt password hashing, hashed sessions, and store ownership checks.
- Multiple independently branded stores, product catalogs, HTTPS product photo URLs, original interior illustrations, prices, inventory, and taking products off sale.
- Luxury decor starter collection, category filters, persistent browser cart, and configurable flat delivery fees.
- Transactional stock handling, demo checkout, order line items, and merchant fulfillment updates.
- Optional Stripe Standard Connect, hosted checkout, signed payment webhooks, and expired/failed reservation release.
- Optional OpenAI interior shopping advisor with bounded inputs, short responses, persistent daily allowances, and a shared $5 monthly estimated budget guard. Catalog search works without a key.
- Railway deployment configuration and a Docker runtime that initializes the persistent data volume and serves requests as UID 1000.

## External configuration and limitations

Read [DEPLOYMENT.md](DEPLOYMENT.md) for Railway, the authorized **$5/month per service** limits for Railway and OpenAI, persistence, secure credentials, Stripe configuration, and live validation still required. Provider billing limits must be verified in their account settings; an app-side AI estimate is not a hard provider spending cap. The current instance has no OpenAI or Stripe key, so catalog search and demo checkout are the verified modes. No public hosted URL is created by saving deployment files.

Stripe transactions, payouts, taxes, delivery coverage, and account eligibility require merchant/provider setup. Password recovery, customer accounts, app-generated email receipts, and refund-state synchronization are not implemented. Do not call the service fully production-ready before provider setup and live/test-mode verification.

Railway deployment source: `tonyellismedia/myverse-commerce-app`, branch `main`.
