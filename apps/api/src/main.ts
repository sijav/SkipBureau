import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'

const PORT = Number(process.env.PORT ?? 4000)

/**
 * The web app is a different origin from the API in every deployment, so
 * without this the browser blocks every request and the app renders nothing
 * while the API logs a healthy 200.
 *
 * Listed rather than reflected: `origin: true` echoes whatever asked, which is
 * not an allow-list at all. `CORS_ORIGINS` carries the deployed site.
 */
const origins = (): string[] => [
  'http://localhost:5173',
  'http://localhost:6016',
  ...(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: origins(),
    methods: ['GET', 'POST', 'OPTIONS'],
    // No cookies and no auth header yet. Admin sign-in is SB-011 and will
    // decide this deliberately rather than inheriting a permissive default.
    credentials: false,
  })

  await app.listen(PORT)
  console.log(`GraphQL on http://localhost:${PORT}/graphql`)
  console.log(`allowing ${origins().join(', ')}`)
}

void bootstrap()
