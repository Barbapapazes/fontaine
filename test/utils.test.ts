import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname } from 'pathe'
import handler from 'serve-handler'
import { describe, it, expect } from 'vitest'
import { getRandomPort } from 'get-port-please'
import { generateFontFace, parseFontFace } from '../src/css'
import { getMetricsForFamily, readMetrics } from '../src/metrics'

const fixtureURL = new URL('./fixture/fonts/font.woff2', import.meta.url)

describe('generateFontFace', () => {
  it('generates CSS font face override ', async () => {
    const metrics = await readMetrics(fixtureURL)
    // @ts-expect-error if metrics is not defined the test should throw
    const result = generateFontFace(metrics, {
      name: 'example override',
      fallbacks: ['fallback'],
      'font-weight': 'bold',
    })
    expect(result).toMatchInlineSnapshot(`
      "@font-face {
        font-family: \\"example override\\";
        src: local(\\"fallback\\");
        ascent-override: 92.7734375%;
        descent-override: 24.4140625%;
        line-gap-override: 0%;
        font-weight: bold;
      }
      "
    `)
  })
})

describe('getMetricsForFamily', () => {
  it('reads font metrics based on font family', async () => {
    const metrics = await getMetricsForFamily('Merriweather Sans')
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1968,
        "capHeight": 1486,
        "descent": -546,
        "familyName": "Merriweather Sans",
        "lineGap": 0,
        "unitsPerEm": 2000,
        "xHeight": 1114,
      }
    `)
  })
})

describe('readMetrics', () => {
  it('reads font metrics from a file', async () => {
    const metrics = await readMetrics(new URL('./fixture/fonts/font.woff2', import.meta.url))
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1900,
        "capHeight": 1456,
        "descent": -500,
        "familyName": "Roboto",
        "fullName": "Roboto",
        "lineGap": 0,
        "postscriptName": "Roboto-Regular",
        "subfamilyName": "Regular",
        "unitsPerEm": 2048,
        "xHeight": 1082,
      }
    `)
  })
  it('reads metrics from a URL', async () => {
    const server = createServer((request, response) => handler(request, response, {
      public: dirname(fileURLToPath(fixtureURL))
    }))
    const port = await getRandomPort()
    server.listen(port)
    const metrics = await readMetrics(`http://localhost:${port}/font.woff2`)
    expect(metrics).toMatchInlineSnapshot(`
      {
        "ascent": 1900,
        "capHeight": 1456,
        "descent": -500,
        "familyName": "Roboto",
        "fullName": "Roboto",
        "lineGap": 0,
        "postscriptName": "Roboto-Regular",
        "subfamilyName": "Regular",
        "unitsPerEm": 2048,
        "xHeight": 1082,
      }
    `)
    server.close()
  })
})

describe('parseFontFace', () => {
  it('should extract source, weight and font-family', () => {
    const result = parseFontFace(
      `@font-face {
        font-family: Roboto, "Arial Neue", sans-serif;
        src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),
             url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
        unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
      }`
    )
    expect(result).toMatchInlineSnapshot(`
      {
        "family": "Roboto",
        "source": "/fonts/OpenSans-Regular-webfont.woff2",
      }
    `)
  })
})
