import { JSON_LD, type StructuredDatum } from './guide'

/** SB-087: a page's schema.org markup, one script per object. */
export const StructuredData = ({ data }: { data: readonly StructuredDatum[] }) => (
  <>
    {data.map((datum) => (
      <script key={datum['@type']} type={JSON_LD}>
        {JSON.stringify(datum)}
      </script>
    ))}
  </>
)
