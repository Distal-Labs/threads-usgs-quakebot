export interface Env {
  THREADS_IG_USER_ID?: string
  THREADS_API_ACCESS_TOKEN?: string
}

export interface IGCreateContainerResponse {
  id: string
}

export interface GeoJSONSummary {
  type: 'FeatureCollection'
  metadata: {
    generated: number
    url: string
    title: string
    api: string
    count: number
    status: number
  }
  bbox: number[]
  features: GeoJSONFeature[]
}

export interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    mag: number
    place: string
    time: number
    updated: number
    tz?: number
    url: string
    detail: string
    felt?: number
    cdi?: number
    mmi?: number
    alert?: string
    status: string
    tsunami: number
    sig: number
    net: string
    code: string
    ids: string
    sources: string
    types: string
    nst: number
    dmin: number
    rms: number
    gap: number
    magType: string
    type: string
    title?: string
  }
  geometry: {
    type: 'Point'
    coordinates: number[]
  }
  id: string
}
