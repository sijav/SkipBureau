import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { dark, light } from '../src/core/theme/tokens.ts'

/**
 * SB-157: the site's icons and manifest, drawn from the wordmark's mark
 * (Figma 43:525, a square with corners a third of its side, in the accent) and
 * coloured from the tokens. Run it again when the palette changes:
 *
 *   node scripts/icons.mjs
 *
 * The outputs are committed, so a build never needs a browser.
 */

const publicDir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'public')
const NAME = 'Skipbureau'

// The mark, `side` wide, centred in a `size` square, on `ground` or on nothing.
const svg = ({ size, side, ground, schemes }) => {
  const at = (size - side) / 2
  const radius = side / 3
  const style = schemes
    ? `<style>rect.mark{fill:${light.accent}}@media (prefers-color-scheme: dark){rect.mark{fill:${dark.accent}}}</style>`
    : ''
  const back = ground ? `<rect width="${size}" height="${size}" fill="${ground}"/>` : ''
  const fill = schemes ? '' : ` fill="${light.accent}"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${style}${back}<rect class="mark" x="${at}" y="${at}" width="${side}" height="${side}" rx="${radius}"${fill}/></svg>\n`
}

// Transparent, following the reader's scheme: what a tab and a result show.
writeFileSync(join(publicDir, 'favicon.svg'), svg({ size: 48, side: 36, schemes: true }))

// On paper, the mark inside the middle 60%, so the same image is safe masked.
const tiles = [
  { file: 'favicon-48.png', size: 48, side: 36, ground: null },
  { file: 'apple-touch-icon.png', size: 180, side: 108, ground: light.background },
  { file: 'icon-192.png', size: 192, side: 116, ground: light.background },
  { file: 'icon-512.png', size: 512, side: 308, ground: light.background },
]

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const { file, size, side, ground } of tiles) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<html><body style="margin:0">${svg({ size, side, ground, schemes: false })}</body></html>`)
    await page.locator('svg').screenshot({ path: join(publicDir, file), omitBackground: !ground })
  }
} finally {
  await browser.close()
}

const manifest = {
  name: NAME,
  short_name: NAME,
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: light.background,
  theme_color: light.background,
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}
writeFileSync(join(publicDir, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`icons: favicon.svg, ${tiles.map((tile) => tile.file).join(', ')} and manifest.webmanifest in public/`)
