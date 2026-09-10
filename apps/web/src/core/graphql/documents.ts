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
      quickAnswer
      verifiedAt
      locale
      translationMissing
      sources {
        url
        name
        verifiedAt
      }
    }
  }
`)

export const CountryQuery = graphql(`
  query Country($code: String!) {
    country(code: $code) {
      code
      name
    }
  }
`)
