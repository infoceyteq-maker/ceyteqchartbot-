process.stdout.write(
  JSON.stringify({
    databaseUrl: process.env.DATABASE_CONNECTION_URI,
    serverPort: process.env.SERVER_PORT,
    apiKey: process.env.AUTHENTICATION_API_KEY,
  }),
);
