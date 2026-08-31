import html2canvas from 'html2canvas'
import type { CartoPlan } from '@/lib/types/cartographie'
import { saveCartoPlan } from '@/lib/cartographie/storage'

/** Capture la zone carte (conteneur parent de la div Leaflet) en PNG. */
export async function captureCartoMapImage(mapContainer: HTMLElement | null): Promise<string | null> {
  if (!mapContainer) return null
  try {
    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a1a3d',
      scale: 2,
      logging: false,
    })
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export function persistCartoExportImage(plan: CartoPlan, exportImage: string): CartoPlan {
  const next = { ...plan, exportImage, updatedAt: new Date().toISOString() }
  saveCartoPlan(next)
  return next
}
