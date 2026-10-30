import { Auth, configService, Database, HttpServer } from '../../src/config/env.config';

process.stdout.write(
  JSON.stringify({
    databaseUrl: configService.get<Database>('DATABASE').CONNECTION.URI,
    prismaUrlEnv: process.env.DATABASE_CONNECTION_URI,
    serverPort: configService.get<HttpServer>('SERVER').PORT,
    serverUrl: configService.get<HttpServer>('SERVER').URL ?? null,
    apiKey: configService.get<Auth>('AUTHENTICATION').API_KEY.KEY,
  }),
);
