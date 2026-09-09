import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'

const PORT = Number(process.env.PORT ?? 4000)

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule)
  await app.listen(PORT)
  console.log(`GraphQL on http://localhost:${PORT}/graphql`)
}

void bootstrap()
