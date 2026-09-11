import { graphql } from './generated/gql'

// Every operation the app sends lives here as a `graphql()` call, which is
// what makes it statically discoverable. An operation codegen cannot find
// still compiles, as `unknown`, so a document written anywhere else would be a
// contract that stopped holding without anyone noticing.

export const CountriesQuery = graphql(`
  query Countries($locale: String) {
    countries(locale: $locale) {
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

// Every guide a country has, which the prerender (SB-076) then asks for one
// by one, exactly as the guide page does.
export const GuidesQuery = graphql(`
  query Guides($country: String!, $locale: String) {
    guides(country: $country, locale: $locale) {
      slug
    }
  }
`)

export const GuideQuery = graphql(`
  query Guide($country: String!, $slug: String!, $locale: String) {
    guide(country: $country, slug: $slug, locale: $locale) {
      slug
      title
      description
      intro
      quickAnswer
      verifiedAt
      locale
      translationMissing
      locales
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

// A suggestion is stored for review and never edits the guide.
export const SuggestUpdateMutation = graphql(`
  mutation SuggestUpdate($input: SuggestUpdateInput!) {
    suggestUpdate(input: $input) {
      received
      problem
    }
  }
`)

// Ask, Figma 46:659: what matches a question, grouped by kind.
export const AskQuery = graphql(`
  query Ask($country: String!, $text: String!, $locale: String) {
    ask(country: $country, text: $text, locale: $locale) {
      tasks {
        slug
        title
        subtitle
        open
      }
      guides {
        slug
        title
        verifiedAt
      }
      answers {
        slug
        question
        answer
        guideSlug
      }
    }
  }
`)

export const SearchQuery = graphql(`
  query Search($country: String!, $text: String!, $locale: String) {
    search(country: $country, text: $text, locale: $locale) {
      tasks {
        slug
        title
        subtitle
        open
      }
      guides {
        slug
        title
        verifiedAt
        snippet
        written
      }
      answers {
        slug
        question
        answer
        guideSlug
      }
    }
  }
`)
