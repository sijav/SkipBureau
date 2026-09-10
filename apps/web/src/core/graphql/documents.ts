import { graphql } from './generated/gql'

// Every operation the app sends lives here as a `graphql()` call, which is
// what makes it statically discoverable. An operation codegen cannot find
// still compiles, as `unknown`, so a document written anywhere else would be a
// contract that stopped holding without anyone noticing.

export const CountriesQuery = graphql(`
  query Countries {
    countries {
      code
      name
    }
  }
`)

export const TasksQuery = graphql(`
  query Tasks($locale: String) {
    tasks(locale: $locale) {
      slug
      title
      subtitle
      position
    }
  }
`)

export const GuideQuery = graphql(`
  query Guide($country: String!, $slug: String!, $locale: String) {
    guide(country: $country, slug: $slug, locale: $locale) {
      slug
      title
      description
      quickAnswer
      verifiedAt
      locale
      translationMissing
      showDisclaimer
      showSuggestUpdate
      cost
      time
      deadlines
      costNote
      place {
        categorySlug
        categoryTitle
        goalSlug
        goalTitle
        goalAreas
      }
      sections {
        kind
        position
        title
        body
        note
        callout
        calloutBody
        calloutSource
        link {
          slug
          title
          description
        }
        steps {
          position
          title
          body
          note
          label
        }
      }
      options {
        title
        body
        bestFor
        caveat
      }
      sources {
        url
        name
        publisher
        official
        note
        verifiedAt
      }
      related {
        slug
        title
        description
      }
    }
  }
`)

export const CountryQuery = graphql(`
  query Country($code: String!, $locale: String) {
    country(code: $code, locale: $locale) {
      code
      name
    }
  }
`)

// Home in one request: the twelve goals, which of them this country has
// content for, and its common questions.
export const HomeQuery = graphql(`
  query Home($country: String!, $locale: String) {
    tasks(locale: $locale) {
      slug
      title
      subtitle
      position
    }
    categories(country: $country, locale: $locale) {
      slug
      taskSlug
    }
    questions(country: $country, locale: $locale) {
      slug
      question
      answer
      guideSlug
    }
  }
`)

export const TaskHubQuery = graphql(`
  query TaskHub($country: String!, $slug: String!, $locale: String) {
    taskHub(country: $country, slug: $slug, locale: $locale) {
      slug
      title
      heading
      intro
      areasIntro
      dependsNote
      otherRoutesIntro
      locale
      translationMissing
      areas {
        slug
        kind
        title
        description
      }
      guides {
        slug
        title
        verifiedAt
      }
      sources {
        url
        name
        publisher
        verifiedAt
      }
    }
  }
`)

export const CategoryHubQuery = graphql(`
  query CategoryHub($country: String!, $goal: String!, $slug: String!, $locale: String) {
    categoryHub(country: $country, goal: $goal, slug: $slug, locale: $locale) {
      slug
      title
      description
      askPrompt
      locale
      translationMissing
      goalSlug
      goalTitle
      goalAreas
      lastReviewed
      start {
        guideSlug
        title
        reason
      }
      guides {
        slug
        title
        description
        readingMinutes
      }
      checklist
      related {
        slug
        title
        subtitle
        open
      }
    }
  }
`)
