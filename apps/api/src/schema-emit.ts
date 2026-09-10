import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql'
import { NestFactory } from '@nestjs/core'
import { lexicographicSortSchema, printSchema } from 'graphql'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CountryResolver } from './country/country.resolver.js'
import { GuideResolver } from './guide/guide.resolver.js'
import { HealthResolver } from './health/health.resolver.js'
import { RulesResolver } from './rules/rules.resolver.js'

// Builds the SDL from resolver metadata alone: no listener, no database, no
// DATABASE_URL. Booting AppModule would construct PrismaService, which throws
// without a connection string, so the schema could only be emitted by someone
// who already had a database running. The web app's typecheck depends on this
// file being current, so emitting it has to be cheap and unconditional.
const emit = async (): Promise<void> => {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: false })
  await app.init()

  const factory = app.get(GraphQLSchemaFactory)
  const schema = await factory.create([HealthResolver, CountryResolver, GuideResolver, RulesResolver], {
    skipCheck: false,
  })

  // Sorted, because the running server sorts too (sortSchema: true) and a
  // contract file that changes shape depending on who wrote it is not one.
  writeFileSync(join(process.cwd(), 'schema.gql'), printSchema(lexicographicSortSchema(schema)))
  await app.close()
  console.log('schema.gql written')
}

void emit()
