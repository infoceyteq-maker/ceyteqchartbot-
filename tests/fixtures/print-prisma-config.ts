import prismaConfig from '../../prisma.config';

console.log(
  JSON.stringify({ schema: prismaConfig.schema, connectionUri: process.env.DATABASE_CONNECTION_URI }),
);
