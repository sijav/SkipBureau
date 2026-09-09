import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

// Prisma 7 takes a driver adapter rather than a URL in the schema, so the
// connection is built here. One client per process. Whether the URL is direct
// or pooled depends on the host and is SB-014's decision.
const connection = (): string => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set. See .env.example, and `npm run db:dev` for a local one.')
  return url
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: connection() }) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
