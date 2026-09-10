import { Args, Query, Resolver } from '@nestjs/graphql'
import { CategoryView, GuideView, QuestionView, TaskView } from './guide.model.js'
import { GuideService } from './guide.service.js'

const LOCALE = { type: () => String, nullable: true, defaultValue: 'en-US' } as const

@Resolver(() => GuideView)
export class GuideResolver {
  constructor(private readonly content: GuideService) {}

  @Query(() => [TaskView], { description: 'The twelve goals. Global: the same intention in every country.' })
  async tasks(@Args('locale', LOCALE) locale: string): Promise<TaskView[]> {
    return this.content.tasks(locale)
  }

  @Query(() => [CategoryView], { description: 'The categories one country has, between a goal and a guide.' })
  async categories(
    @Args('country', { type: () => String }) country: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<CategoryView[]> {
    return this.content.categories(country, locale)
  }

  @Query(() => [QuestionView], { description: 'Common questions in one country, each with its short answer.' })
  async questions(
    @Args('country', { type: () => String }) country: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<QuestionView[]> {
    return this.content.questions(country, locale)
  }

  @Query(() => [GuideView], { name: 'guides', description: 'Every guide in one country.' })
  async guides(
    @Args('country', { type: () => String }) country: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<GuideView[]> {
    return this.content.guides(country, locale)
  }

  @Query(() => GuideView, { nullable: true, description: 'One guide, or null where we do not have it.' })
  async guide(
    @Args('country', { type: () => String }) country: string,
    @Args('slug', { type: () => String }) slug: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<GuideView | null> {
    return this.content.guide(country, slug, locale)
  }
}
