# Run Myverse with Docker

Docker can run Myverse on your computer or an existing server without Railway. Docker still requires a host. Running it on a computer uses that computer's resources; a cloud server has its own hosting charges. No new hosting purchase is authorized by this setup. The existing $5/month OpenAI budget still applies.

## Start on your computer

Install Docker Desktop (Windows/macOS) or Docker Engine with the Compose plugin (Linux), then clone the app:

```sh
git clone https://github.com/tonyellismedia/myverse-commerce-app.git
cd myverse-commerce-app
docker compose up -d --build --wait
```

The app listens on your computer's loopback interface at port **8080**. In your browser, open localhost on that port, register a merchant account, and create a store. The sample collection is at `/store/myverse-atelier`. The default setup is for use on the host computer; it does not publish a public domain.

The application and API run in one container, capped at 256 MB RAM and 0.5 CPU. Builds need additional resources. A health check verifies the API. The container restarts automatically while Docker is running. Database files live in the named `myverse-data` volume, which survives container recreation and upgrades. The server initializes the volume and serves requests as UID/GID 1000. Keep one application replica with this SQLite database.

```sh
docker compose ps
docker compose logs --tail=100 myverse
docker compose down
```

The stop command preserves the data volume. Removing volumes, including with `down --volumes`, deletes store data; back up before any intentional deletion. Keep using the same checkout directory and Compose project name so the same volume is reused.

## AI and payments

The app starts without provider credentials: catalog search works, and demo checkout collects no money. To enable optional integrations, copy `.env.example` to `.env`, enter credentials in that local file, and recreate the container:

```sh
docker compose up -d --wait
```

`.env` is ignored by Git and excluded from the image. Set `AI_API_KEY` to your OpenAI API key to enable the shopping advisor. Configure the provider budget controls too; the app's $5 estimate is not a provider billing hard cap. Do not put API keys in frontend variables or chat. Optional Stripe configuration, test-mode validation, and remaining product limitations are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

For a different local port, set `MYVERSE_HTTP_PORT` in `.env`.

## Use an existing server

Install Docker and Compose on the server and use the same commands and persistent volume. For public access, provide a domain and configure an HTTPS reverse proxy on that host to forward traffic to the app's loopback port. Production session cookies require HTTPS for public domains. Keep the app port private behind the proxy. Set `PUBLIC_APP_URL` to the exact public HTTPS origin before configuring Stripe redirects and webhooks. The local Compose setup does not issue TLS certificates or provision a server/domain.

Back up the volume using a consistent SQLite backup or stop the app before copying its data. Store a copy outside the host, and verify restoration before relying on it. Database volumes do not replace backups.

## Update

```sh
git pull --ff-only
docker compose up -d --build --wait
```

Keep the named volume and any local `.env` file. Verify sign-in, store data, and the public catalog after updating.
