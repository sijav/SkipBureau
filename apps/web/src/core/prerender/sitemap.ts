import { absolute } from 'src/shared/page-languages'
import type { Page } from './prerender'

const xml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

/**
 * SB-088: every canonical page once, dated where it has a date of its own,
 * with its alternates where it has any. A page whose canonical is elsewhere is
 * that other page's to list.
 */
export const sitemap = (pages: readonly Page[], origin: string): string => {
  const listed = new Set<string>()
  const urls = pages.flatMap((page) => {
    if (page.links.canonical !== page.address || listed.has(page.address)) return []
    listed.add(page.address)
    const lines = [
      `    <loc>${xml(absolute(page.address, origin))}</loc>`,
      ...(page.lastModified ? [`    <lastmod>${xml(page.lastModified)}</lastmod>`] : []),
      ...page.links.alternates.map(
        (each) => `    <xhtml:link rel="alternate" hreflang="${xml(each.hreflang)}" href="${xml(absolute(each.path, origin))}"/>`,
      ),
    ]
    return [`  <url>\n${lines.join('\n')}\n  </url>`]
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/**
 * Read by crawlers only at a host's root, which on a GitHub project page is
 * not this site's to serve; it is here for the day the site has a root of its
 * own. DESIGN.md says what points search engines at the sitemap meanwhile.
 */
export const robots = (origin: string): string => ['User-agent: *', 'Allow: /', '', `Sitemap: ${absolute('/sitemap.xml', origin)}`, ''].join('\n')
