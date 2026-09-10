import type { Messages } from './activateCatalog'
import { locales, type Locale } from './locales'

// The COMPILED catalog, not the `.po`. A `.po` is not JavaScript, so importing
// one is parsed as source and throws, which rendered a blank page once already.
//
// Relative rather than `src/...`, because Vite only turns a dynamic import with
// a variable in it into a chunk map when the specifier starts with ./ or ../.
//
// Its own file so Storybook's loaders can warm the same chunks the provider
// fetches, without the provider's file exporting a non-component and losing
// fast refresh.
export const loadCatalog = async (locale: Locale): Promise<Messages> => {
  const module: { messages: Messages } = await import(`../../locales/${locales[locale].catalog}.mjs`)
  return module.messages
}
