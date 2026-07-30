const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export interface ApiListEnvelope<T> {
  data: T[]
  message: string
  current_page: number
  total_pages: number
  total_registros: number
}

export interface ApiItemEnvelope<T> {
  data: T
  message: string
}

interface ApiErrorEnvelope {
  errors?: { error?: string }
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined>

async function request<T>(path: string, params?: QueryParams): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') {
        continue
      }

      // Laravel's `boolean` validation rule only accepts 1/0 (or the actual
      // booleans true/false) — the literal strings "true"/"false" that a
      // naive String(value) would produce here fail validation.
      const serialized = typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
      url.searchParams.set(key, serialized)
    }
  }

  let response: Response

  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0)
  }

  const body = (await response.json().catch(() => null)) as (T & ApiErrorEnvelope) | null

  if (!response.ok) {
    throw new ApiError(body?.errors?.error ?? 'Ocurrió un error inesperado.', response.status)
  }

  return body as T
}

export const apiClient = { request }
