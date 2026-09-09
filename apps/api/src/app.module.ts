import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'node:path'
import { CountryModule } from './country/country.module.js'
import { HealthModule } from './health/health.module.js'
import { PrismaModule } from './prisma/prisma.module.js'

// Code first: the SDL is generated from the decorated classes and written to
// schema.gql, which SB-047 turns into the web app's types. Hand-written SDL
// would be a second copy of the contract, free to drift from the first.
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: false,
    }),
    PrismaModule,
    HealthModule,
    CountryModule,
  ],
})
export class AppModule {}
