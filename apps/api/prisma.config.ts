import { defineConfig } from 'prisma/config'

// Prisma 7 moved the connection URL out of schema.prisma: the schema describes
// shape, this describes where. `migrate` reads it here; the client gets a
// driver adapter instead, in prisma.service.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
})
