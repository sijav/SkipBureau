import { Controller, Get } from '@nestjs/common'

/**
 * A plain GET that a platform's readiness probe can make. The GraphQL `health`
 * query cannot serve one: Apollo refuses a GET without a preflight header as a
 * possible cross-site request forgery, with a 400, which a probe reads as down
 * for ever (SB-136). Like the query, it promises only that the API answers.
 */
@Controller('health')
export class HealthController {
  @Get()
  health(): string {
    return 'ok'
  }
}
