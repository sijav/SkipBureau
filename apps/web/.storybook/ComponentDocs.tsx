import { Controls, Markdown, Primary, Stories, Title, useOf } from '@storybook/addon-docs/blocks'

// Each component's prose lives in markdown beside it (SB-059), `StatusTag.md`
// beside `StatusTag.tsx` and its story, not in the .tsx. Found here by the
// story file's own path, which Storybook records as `parameters.fileName`.
// Not the plans, `#SB-…md`, whose `#` an import reads as the start of a fragment.
const DOCS = import.meta.glob<string>(['../src/**/*.md', '!../src/**/#*.md'], { query: '?raw', import: 'default', eager: true })

const docFor = (fileName: unknown): string | undefined =>
  typeof fileName === 'string' ? DOCS[fileName.replace(/^\.\//, '../').replace(/\.stories\.tsx$/, '.md')] : undefined

/** The Docs page every story file gets: its title, its markdown when it has one, and its stories. */
export const ComponentDocs = () => {
  const { preparedMeta } = useOf('meta', ['meta'])
  const doc = docFor(preparedMeta.parameters['fileName'])

  return (
    <>
      <Title />
      {/* The file's own first heading is the title above. */}
      {doc && <Markdown>{doc.replace(/^# .*\n+/, '')}</Markdown>}
      <Primary />
      <Controls />
      <Stories />
    </>
  )
}
