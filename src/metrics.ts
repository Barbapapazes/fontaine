import { fileURLToPath } from 'node:url'
import { fromBlob, fromFile, fromUrl, Font } from '@capsizecss/unpack'
import { parseURL } from 'ufo'
import { camelCase } from 'scule'
import { withoutQuotes } from './css'

const metricCache: Record<string, Font | null> = {}

export async function getMetricsForFamily(family?: string) {
  if (!family) return null
  family = withoutQuotes(family)

  if (family in metricCache) return metricCache[family]

  try {
    const name = camelCase(family).replace(/ /, '')
    const metrics: Font = await import(`@capsizecss/metrics/${name}.js`).then(r => r.default || r)
    metricCache[family] = metrics
    return metrics
  } catch {
    metricCache[family] = null
    return null
  }
}

export async function readMetrics(_source: URL | string | Blob) {
  const source = typeof _source !== 'string' && 'href' in _source ? _source.href : _source

  if (typeof source !== 'string') {
    return fromBlob(source)
  }

  if (source in metricCache) {
    return Promise.resolve(metricCache[source])
  }

  const { protocol } = parseURL(source)
  if (!protocol) return null

  const metrics =
    protocol === 'file:' ? await fromFile(fileURLToPath(source)) : await fromUrl(source)

  metricCache[source] = metrics

  return metrics
}
