// The design's three typefaces and the owner's Persian face, Vazirmatn, chosen
// 2026-09-10, self-hosted rather than fetched from a font service, and only in
// the weights the type scale uses. Each file splits its face by unicode-range,
// so a page downloads only the scripts it shows. font-display is swap.
import '@fontsource/archivo/400.css'
import '@fontsource/archivo/500.css'
import '@fontsource/archivo/600.css'
import '@fontsource/archivo/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
// Source Serif 4 as Figma sets it: the variable face, whose optical size
// follows the font size. The static 400 is the 14pt cut only, and ran 1.2
// percent wide at 16 and 18, enough to wrap lines the design fits on one.
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/600.css'
import '@fontsource/vazirmatn/700.css'
