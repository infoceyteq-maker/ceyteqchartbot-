# Ceyteq (Ceylon Technology)

A messaging and automation workspace: a Next.js dashboard backed by a TypeScript/Express API, Prisma, and a MySQL-compatible database such as TiDB. The dashboard starts in a clearly labelled **sample workspace**; connect it with your own API key to manage real channels and messages.

![Ceyteq mark](public/images/ceyteq-mark.svg)

## Architecture at a glance

```text
Browser ── same-origin requests ──> Next.js workspace (frontend/)
                                      │ encrypted HTTP-only session
                                      │ server-side, allow-listed API proxy
                                      ▼
                                  Ceyteq Express API (src/)
                                      ├── Prisma ──> TiDB / MySQL
                                      ├── WhatsApp Web (Baileys) / Meta Business API
                                      ├── chatbot and event integrations
                                      └── optional Redis / S3-compatible storage
```

The frontend never connects directly to TiDB. It uses the existing API contracts; the backend owns the database connection. See [the architecture review](docs/ARCHITECTURE.md) for a file map, compatibility risks, migrations, security boundaries and remaining validation work.

## Quick start

Prerequisites: Node.js 22, npm, a TiDB cluster or MySQL 8-compatible database, and a way to reach the database from the API server. A TiDB Cloud public endpoint requires TLS. The upstream project’s MySQL migrations contain foreign keys and multiple DDL changes; **test them on a disposable cluster compatible with your TiDB version before applying them to production**. Back up existing databases first.

1. Install the two applications:

   ```bash
   npm ci
   npm --prefix frontend ci
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   ```

2. In `.env`, set `DATABASE_PROVIDER=mysql`, a real `DATABASE_URL`, a strong unique `GLOBAL_API_KEY`, and a random `CEYTEQ_SESSION_SECRET` (at least 32 characters; for example, generate one with `openssl rand -hex 32`). Never commit these secrets. Set `SERVER_URL` to the public backend URL if using webhooks/QR code integrations. Keep the existing `DATABASE_CONNECTION_CLIENT_NAME` when upgrading an existing installation, or its instances will not be listed.

   ```dotenv
   DATABASE_PROVIDER=mysql
   DATABASE_URL='mysql://USER:PASSWORD@HOST:4000/ceyteq?sslaccept=strict'
   DATABASE_CONNECTION_CLIENT_NAME=ceyteq
   SERVER_URL=http://localhost:8080
   PORT=8080
   GLOBAL_API_KEY=replace-with-a-strong-random-api-key
   ```

   The existing `DATABASE_CONNECTION_URI`, `SERVER_PORT`, and `AUTHENTICATION_API_KEY` names remain supported and **take precedence** over `DATABASE_URL`, `PORT`, and `GLOBAL_API_KEY`, respectively, when both are non-empty. Remove an old setting if you intend to use its new alias instead. The `npm run db:*` commands map `DATABASE_URL` for Prisma; if invoking the Prisma CLI directly, use `DATABASE_CONNECTION_URI`, which is still named in the Prisma schemas.

   Percent-encode special characters in the username and password. For a cluster requiring a specific CA, add `&sslcert=/path/to/ca.pem` to the connection URL and make the certificate available to the API process/container. Consult [TiDB's Prisma connection guide](https://docs.pingcap.com/tidb/stable/dev-guide-sample-application-nodejs-prisma/) for the correct TLS settings for your cluster. Do not disable certificate verification in production.

3. In `frontend/.env.local`, set `CEYTEQ_API_URL` to the **server-side** API address (`http://127.0.0.1:8080` for a local API) and set a separate strong `CEYTEQ_SESSION_SECRET`. The secret may match the one in the root `.env` for Docker Compose, but it must not be a committed placeholder. This address is never used by the browser. For multiple frontend replicas, use the same secret on each replica.

4. Generate the Prisma client and, after reviewing the migration history, apply it:

   ```bash
   npm run db:generate
   npm run db:deploy
   npm run dev:server
   # In a second terminal:
   npm --prefix frontend run dev
   ```

   Open `http://localhost:3000`, choose **Connect your workspace**, and enter the global API key. Until then the charts and contacts are illustrative and cannot send real messages. Create a WhatsApp channel and scan its QR code under **Channels**. Your WhatsApp device and messaging provider must be available for a real connection.

### Docker Compose

Set the root `.env` values described above, including `CEYTEQ_SESSION_SECRET`. Then:

```bash
# Review migrations and verify the database first. This command modifies it.
docker compose build
docker compose run --rm api npm run db:deploy
docker compose up -d
```

The frontend is available on port 3000; the API is bound to `127.0.0.1:8080` on the host by default and reachable by the frontend over the Compose network. The frontend uses the API's configured internal port (`SERVER_PORT`, then `PORT`, default 8080). Set `CEYTEQ_API_HOST_PORT` to change the host-side API port. Migrations are **not** automatically run on startup unless `RUN_DATABASE_MIGRATIONS=true` is explicitly set. The stack expects an external TiDB/MySQL server; it does not provision TiDB. Put an HTTPS reverse proxy and an access-control layer in front of the frontend for production. Protect the API separately from public access.

## Workspace features

- Overview with all-time channel counts and a seven-day activity chart based on the selected channel’s latest 500 saved messages.
- Create, connect and delete WhatsApp Web channels; view a connection QR code.
- Browse recent saved conversations and contacts, and send text messages through a selected channel.
- Read and update per-channel webhooks while retaining existing webhook headers and events not edited in the UI (disabling a webhook clears its events).
- Contact information and Ceyteq social links. Other backend integrations remain configurable through the API; the workspace does not yet configure every integration or support every API operation.

The API uses API keys rather than application user accounts. A global key grants broad administrative access; use only on trusted devices, avoid public/shared computers, restrict ingress, and terminate HTTPS at a trusted reverse proxy. The workspace session lasts 12 hours and is encrypted and HTTP-only; disconnect to remove it. No API key or database credential is shipped to the browser in JavaScript. The backend has existing privileged endpoints and should not be exposed directly to untrusted traffic. Telemetry is disabled by default; if enabled, an explicit `TELEMETRY_URL` is required and no upstream endpoint is used automatically.

## Contact Ceyteq

| Channel | Details |
| --- | --- |
| Hotline / WhatsApp | [+94 78 860 7143](https://wa.me/94788607143) |
| Mobile | [+94 76 860 7143](tel:+94768607143) |
| Email | [info.ceyteq@gmail.com](mailto:info.ceyteq@gmail.com) |
| Website | [ceyteq.online](http://ceyteq.online/) |
| Facebook | [Ceyteq on Facebook](https://www.facebook.com/share/1KM2kZvaCC/) |
| Instagram | [@ceyteq](https://www.instagram.com/ceyteq/) |
| LinkedIn | [Ceylon Technology](https://www.linkedin.com/in/ceylon-technology) |
| TikTok | [@ceyteq](https://www.tiktok.com/@ceyteq?lang=en-GB) |
| YouTube | [Ceylon Technology](https://youtube.com/@ceylontechnology-ceyteq?si=a4L-B_OZjvhjO7sw) |
| Pinterest | [infoceyteq](https://www.pinterest.com/infoceyteq/) |
| X (Twitter) | [@CeylonTech22598](https://x.com/CeylonTech22598) |

## License and attribution

Ceyteq is a modified distribution using the Evolution API backend. The original [LICENSE](LICENSE), [NOTICE](NOTICE), and [TRADEMARKS.md](TRADEMARKS.md) are retained, including upstream copyright and attribution. The repository’s license file states additional conditions, including a usage-notification requirement; review those terms and seek appropriate legal advice or permission before commercial deployment or redistribution. The new frontend does not reuse the upstream manager’s visual assets. Upstream release history is preserved in [CHANGELOG.md](CHANGELOG.md) as historical provenance, not as a Ceyteq release record.

© 2026 Ceyteq (Ceylon Technology), for Ceyteq modifications.
