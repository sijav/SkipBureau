/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type CountriesQueryVariables = Exact<{ [key: string]: never; }>;


export type CountriesQuery = { countries: Array<{ code: string, name: string }> };

export type TasksQueryVariables = Exact<{
  locale?: string | null | undefined;
}>;


export type TasksQuery = { tasks: Array<{ slug: string, title: string, subtitle: string | null, position: number }> };

export type GuideQueryVariables = Exact<{
  country: string;
  slug: string;
  locale?: string | null | undefined;
}>;


export type GuideQuery = { guide: { slug: string, title: string, quickAnswer: string | null, verifiedAt: string, locale: string, translationMissing: boolean, sources: Array<{ url: string, name: string, verifiedAt: string }> } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const CountriesDocument = new TypedDocumentString(`
    query Countries {
  countries {
    code
    name
  }
}
    `) as unknown as TypedDocumentString<CountriesQuery, CountriesQueryVariables>;
export const TasksDocument = new TypedDocumentString(`
    query Tasks($locale: String) {
  tasks(locale: $locale) {
    slug
    title
    subtitle
    position
  }
}
    `) as unknown as TypedDocumentString<TasksQuery, TasksQueryVariables>;
export const GuideDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<GuideQuery, GuideQueryVariables>;