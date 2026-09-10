import { Args, Query, Resolver } from '@nestjs/graphql'
import { AskView, CategoryHubView, CategoryView, GuideView, QuestionView, TaskHubView, TaskView } from './guide.model.js'
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

  @Query(() => TaskHubView, { nullable: true, description: 'What one goal involves in one country, or null where it is Coming soon.' })
  async taskHub(
    @Args('country', { type: () => String }) country: string,
    @Args('slug', { type: () => String }) slug: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<TaskHubView | null> {
    return this.content.taskHub(country, slug, locale)
  }

  @Query(() => CategoryHubView, { nullable: true, description: 'One area of a goal in one country, or null where it does not exist.' })
  async categoryHub(
    @Args('country', { type: () => String }) country: string,
    @Args('goal', { type: () => String }) goal: string,
    @Args('slug', { type: () => String }) slug: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<CategoryHubView | null> {
    return this.content.categoryHub(country, goal, slug, locale)
  }

  @Query(() => AskView, { description: 'What matches a question in one country, grouped by kind; what is popular when it is empty.' })
  async ask(
    @Args('country', { type: () => String }) country: string,
    @Args('text', { type: () => String }) text: string,
    @Args('locale', LOCALE) locale: string,
  ): Promise<AskView> {
    return this.content.ask(country, locale, text.slice(0, 500))
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
