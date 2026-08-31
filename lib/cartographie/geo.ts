import type { LatLng } from '@/lib/types/cartographie'

export function centroidFromGeometry(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null | undefined,
): LatLng | null {
  if (!geometry) return null
  const rings: number[][][] = geometry.type === 'Polygon'
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map(p => p[0])

  let sumLat = 0
  let sumLng = 0
  let count = 0
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      sumLat += lat
      sumLng += lng
      count++
    }
  }
  if (!count) return null
  return { lat: sumLat / count, lng: sumLng / count }
}

export function boundsFromGeometry(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null | undefined,
): [[number, number], [number, number]] | null {
  if (!geometry) return null
  const coords = geometry.type === 'Polygon'
    ? geometry.coordinates.flat()
    : geometry.coordinates.flat(2)

  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  for (const [lng, lat] of coords) {
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
  }
  return [[minLat, minLng], [maxLat, maxLng]]
}
