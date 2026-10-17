# Myverse on Railway

Myverse is an original luxury interior commerce app. The deployment uses a pinned Node.js 24 Docker image, one application instance, and SQLite on a persistent Railway volume. `railway.json` supplies the Docker build, health check, and restart policy. The Docker build runs the production frontend build and the existing test suite.

## Authorized budget

The user authorized a maximum of **$5/month for Railway and $5/month for OpenAI**, separately. Do not choose a plan, add replicas, increase resources, enable paid extras, buy credits, or change limits beyond those amounts without authorization. Provider plan fees and usage must fit the applicable budget. The app cannot enforce Railway account billing settings.

The AI server persists usage in SQLite, limits each store to 20 requests/day and the platform to 100/day, and blocks new requests when its shared $5 monthly estimate is exhausted. It reserves $0.05 before each request, then records a conservative estimate from reported token usage using twice the standard gpt-4.1-mini rate. Failed or unreadable responses retain the reservation. Billing estimates are not a provider-level guarantee. Only gpt-4.1-mini is currently allowed by this guard. Use a dedicated OpenAI key/project, configure a $5 project budget and alerts, and review prepaid-credit/auto-recharge controls in OpenAI; some project budgets are alerts rather than hard caps. Provider billing remains authoritative. Usage windows in the application use UTC.

## Deploy through the existing GitHub connection

1. In Railway, create a project from the GitHub repository `tonyellismedia/myverse-commerce-app`. Select branch `main`, which contains Myverse's Dockerfile, railway.json, and application source. A source branch must be pushed successfully before Railway can build it; local files alone are not available to Railway.
2. Before starting a paid deployment, verify the Railway plan and account usage limit fit **$5 total per month**. Set the platform's hard usage limit when available. If the plan minimum or required resources exceed $5, leave deployment paused and report the blocker.
3. Use one replica. A local verification container runs with a 256 MB memory ceiling and 0.5 CPU; apply corresponding service limits if Railway offers them. Add a small persistent volume mounted at `/var/data` (0.5 GB is sufficient to start). Do not run multiple SQLite writers across replicas or remove the volume during redeployment.
4. Configure `NODE_ENV=production`, `HOST=0.0.0.0`, and `DATABASE_PATH=/var/data/commerce.sqlite`. Let Railway provide `PORT`; the server reads it. The container initializes volume ownership then drops to UID/GID 1000 before serving requests. Health checks use `/api/health`.
5. Generate the service's public HTTPS domain in Railway networking. Set `PUBLIC_APP_URL` to that exact HTTPS origin. No public URL exists until Railway creates it; publishing the Codex environment does not deploy this service.
6. Open the domain, create a merchant account, then create a store. Each account sees and edits only its own stores, products, and orders. Public storefront routes are `/store/<slug>`. The sample interior collection is available at `/store/myverse-atelier`. A sample catalog can be included when creating a store and should be replaced with the merchant's actual products before selling.
7. Verify store creation, product editing, delivery fee, storefront checkout, and fulfillment, then restart the service and confirm the records persist on the volume.

For automated project creation from this coding environment, Railway API access must first be supplied securely as `RAILWAY_API_TOKEN` through environment settings. A connected GitHub account does not supply this coding environment with Railway API access. Do not paste tokens into chat. Existing proxy-backed bindings should target `backboard.railway.com`. An alternative is to complete the project creation steps directly in the Railway dashboard, without supplying an API token here.

## OpenAI

Enter `AI_API_KEY` securely in Railway's variable settings. Use a real API key entered directly there; proxy placeholder values from the Codex environment are not transferable. The server calls api.openai.com over HTTPS. Never expose keys as VITE_ variables. With no key, the assistant is explicitly labeled as catalog search. Live OpenAI responses remain unverified until a working key is supplied. Requests contain the selected store's bounded catalog context and the current shopper question; the model has no tools for creating orders or taking payments.

## Stripe Connect and live checkout

The app supports Stripe Standard Connect authorization so merchants use their own payment accounts. Configure the following securely in Railway:

- `STRIPE_SECRET_KEY`: the platform's server-side Stripe key.
- `STRIPE_CONNECT_CLIENT_ID`: the Connect client ID from Stripe settings.
- `PUBLIC_APP_URL`: the actual Railway HTTPS origin.
- `STRIPE_WEBHOOK_SECRET`: the raw signing secret for the connected-account webhook endpoint, entered directly in hosting settings.
- `SHIPPING_COUNTRIES`: comma-separated delivery country codes; defaults to `US`.
- `STRIPE_AUTOMATIC_TAX=true`: enable after configuring and activating Stripe Tax; otherwise automatic tax is disabled.

Register the OAuth redirect as `<PUBLIC_APP_URL>/api/payments/callback`. Configure a connected-account webhook at `<PUBLIC_APP_URL>/api/stripe/webhook` for checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, and checkout.session.expired. Merchants then choose Payments in their workspace and authorize their own Stripe account. Stripe controls their account verification and payouts.

Checkout reserves inventory transactionally, uses server-controlled prices and the store's delivery fee, and sends customers to Stripe's hosted payment page. Signed webhooks confirm paid orders and release expired or failed reservations. Duplicate events do not release stock twice. A browser success URL alone does not mark an order paid. Merchant fulfillment is allowed for verified paid orders and demo orders. Refunds are handled in Stripe; refund-state synchronization, automated email receipts from this app, password recovery, and customer accounts are not implemented. Stripe's transaction fees are separate from the specified OpenAI and Railway budgets.

Without STRIPE_SECRET_KEY, checkout is explicitly a demo and collects no money. Incomplete live-payment configuration blocks live checkout. Provider calls and merchant onboarding require real credentials and have not been validated against a live Stripe account. Before accepting money, validate Stripe test-mode onboarding, checkout, webhook retries/expiration, tax/shipping configuration, and fulfillment for your account.

## Local container checks

```sh
docker build -t myverse-commerce .
docker volume create myverse-data
docker run --rm --name myverse -p 127.0.0.1:10000:10000 \
  --memory=256m --cpus=0.5 \
  --mount source=myverse-data,target=/var/data myverse-commerce
```

In a cloud shell whose nested Docker builder cannot resolve the egress proxy, reuse the existing npm cache with BuildKit's additional context:

```sh
DOCKER_CONFIG=/workspace/.cache/docker docker build \
  --build-context npm-cache=/workspace/.cache/npm \
  -t myverse-commerce .
```

This path runs `npm ci --offline` against cached package archives while preserving lockfile integrity checks. Normal Railway builds use `npm ci` against the registry. Optional `build_ca` build secrets support a trusted custom CA without baking it into the runtime image. Never disable TLS or package-integrity verification.

Merchant sessions use hashed random tokens, HttpOnly/SameSite cookies, and Secure cookies in production. Authentication is rate-limited, password hashes use scrypt, and cross-origin changes are rejected. An optional `DEMO_PASSWORD` adds a shared browser gate for a private review deployment; if set, it must have at least 16 characters and the username is `demo`. Public merchant accounts do not require that shared gate.
