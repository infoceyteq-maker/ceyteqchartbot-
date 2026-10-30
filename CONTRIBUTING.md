# Contributing to Ceyteq

Thanks for helping improve Ceyteq (Ceylon Technology). Please open an issue or discuss substantial changes before starting work. Do not commit credentials, generated build artifacts, or customer data.

Use Node.js 22 and follow the setup in [README.md](README.md). Generate the appropriate Prisma client before building the API. Run `npm run test:config`, `npm run lint:check`, `npm run build`, `npm --prefix frontend run typecheck`, and `npm --prefix frontend run build`; test database-related changes with the relevant MySQL/TiDB and PostgreSQL providers. Describe migration, compatibility, security, and UI impacts in pull requests.

The original license and attribution files must remain intact. See [LICENSE](LICENSE), [NOTICE](NOTICE), and [TRADEMARKS.md](TRADEMARKS.md). Contact [info.ceyteq@gmail.com](mailto:info.ceyteq@gmail.com) for project questions.
