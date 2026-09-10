/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Countries {\n    countries {\n      code\n      name\n    }\n  }\n": typeof types.CountriesDocument,
    "\n  query Tasks($locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n  }\n": typeof types.TasksDocument,
    "\n  query Guide($country: String!, $slug: String!, $locale: String) {\n    guide(country: $country, slug: $slug, locale: $locale) {\n      slug\n      title\n      quickAnswer\n      verifiedAt\n      locale\n      translationMissing\n      sources {\n        url\n        name\n        verifiedAt\n      }\n    }\n  }\n": typeof types.GuideDocument,
    "\n  query Country($code: String!, $locale: String) {\n    country(code: $code, locale: $locale) {\n      code\n      name\n    }\n  }\n": typeof types.CountryDocument,
    "\n  query Home($country: String!, $locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n    categories(country: $country, locale: $locale) {\n      slug\n      taskSlug\n    }\n    questions(country: $country, locale: $locale) {\n      slug\n      question\n      answer\n      guideSlug\n    }\n  }\n": typeof types.HomeDocument,
};
const documents: Documents = {
    "\n  query Countries {\n    countries {\n      code\n      name\n    }\n  }\n": types.CountriesDocument,
    "\n  query Tasks($locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n  }\n": types.TasksDocument,
    "\n  query Guide($country: String!, $slug: String!, $locale: String) {\n    guide(country: $country, slug: $slug, locale: $locale) {\n      slug\n      title\n      quickAnswer\n      verifiedAt\n      locale\n      translationMissing\n      sources {\n        url\n        name\n        verifiedAt\n      }\n    }\n  }\n": types.GuideDocument,
    "\n  query Country($code: String!, $locale: String) {\n    country(code: $code, locale: $locale) {\n      code\n      name\n    }\n  }\n": types.CountryDocument,
    "\n  query Home($country: String!, $locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n    categories(country: $country, locale: $locale) {\n      slug\n      taskSlug\n    }\n    questions(country: $country, locale: $locale) {\n      slug\n      question\n      answer\n      guideSlug\n    }\n  }\n": types.HomeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Countries {\n    countries {\n      code\n      name\n    }\n  }\n"): (typeof documents)["\n  query Countries {\n    countries {\n      code\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Tasks($locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n  }\n"): (typeof documents)["\n  query Tasks($locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Guide($country: String!, $slug: String!, $locale: String) {\n    guide(country: $country, slug: $slug, locale: $locale) {\n      slug\n      title\n      quickAnswer\n      verifiedAt\n      locale\n      translationMissing\n      sources {\n        url\n        name\n        verifiedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query Guide($country: String!, $slug: String!, $locale: String) {\n    guide(country: $country, slug: $slug, locale: $locale) {\n      slug\n      title\n      quickAnswer\n      verifiedAt\n      locale\n      translationMissing\n      sources {\n        url\n        name\n        verifiedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Country($code: String!, $locale: String) {\n    country(code: $code, locale: $locale) {\n      code\n      name\n    }\n  }\n"): (typeof documents)["\n  query Country($code: String!, $locale: String) {\n    country(code: $code, locale: $locale) {\n      code\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Home($country: String!, $locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n    categories(country: $country, locale: $locale) {\n      slug\n      taskSlug\n    }\n    questions(country: $country, locale: $locale) {\n      slug\n      question\n      answer\n      guideSlug\n    }\n  }\n"): (typeof documents)["\n  query Home($country: String!, $locale: String) {\n    tasks(locale: $locale) {\n      slug\n      title\n      subtitle\n      position\n    }\n    categories(country: $country, locale: $locale) {\n      slug\n      taskSlug\n    }\n    questions(country: $country, locale: $locale) {\n      slug\n      question\n      answer\n      guideSlug\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;