/** Prisma uses JSONPath strings for MySQL/TiDB and path arrays for PostgreSQL. */
export function prismaJsonPath(provider: string, property: string): any {
  return provider === 'mysql' ? `$.${property}` : [property];
}
