export type CartoTool = 'select' | 'equipment' | 'line' | 'polygon' | 'circle' | 'text'

export type LineStyle = 'solid' | 'dashed' | 'dotted'
export type LineWeight = 1 | 2 | 3 | 4

export interface LatLng {
  lat: number
  lng: number
}

export interface CartoStyle {
  color: string
  fillColor?: string
  fillOpacity?: number
  weight: LineWeight
  lineStyle: LineStyle
}

export interface CartoElementBase {
  id: string
  nom?: string
  description?: string
}

export interface CartoEquipment extends CartoElementBase {
  type: 'equipment'
  equipmentId: string
  position: LatLng
}

export interface CartoLine extends CartoElementBase, CartoStyle {
  type: 'line'
  points: LatLng[]
}

export interface CartoPolygon extends CartoElementBase, CartoStyle {
  type: 'polygon'
  points: LatLng[]
}

export interface CartoCircle extends CartoElementBase, CartoStyle {
  type: 'circle'
  center: LatLng
  radiusM: number
}

export interface CartoText extends CartoElementBase {
  type: 'text'
  position: LatLng
  text: string
  color: string
  fontSize: number
}

export type CartoElement =
  | CartoEquipment
  | CartoLine
  | CartoPolygon
  | CartoCircle
  | CartoText

export interface CartoPlanMeta {
  id: string
  adresse: string
  codePostal: string
  commune: string
  insee: string
  sectionCadastrale: string
  numeroParcelle: string
  center: LatLng
  zoom: number
  parcelleGeometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  updatedAt: string
  exportImage?: string // data URL PNG pour rapport
}

export interface CartoPlan extends CartoPlanMeta {
  elements: CartoElement[]
}

export const DEFAULT_CARTO_STYLE: CartoStyle = {
  color: '#2563eb',
  fillColor: '#2563eb',
  fillOpacity: 0.2,
  weight: 2,
  lineStyle: 'solid',
}

export const CARTO_COLORS = ['#2563eb', '#16a34a', '#eab308', '#f97316', '#dc2626', '#7c3aed', '#0e2a52']

export function planStorageKey(insee: string, section: string, numero: string): string {
  return `${insee}_${section.toUpperCase()}_${numero.padStart(4, '0')}`
}

export function newElementId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
