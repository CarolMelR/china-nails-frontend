export const AUTH_TOKEN_KEY = 'china-nails-token'
export const API_BASE_URL = import.meta.env.VITE_API_URL

interface ApiErrorPayload {
  message?: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function createApiUrl(file: string): URL {
  const baseUrl = API_BASE_URL?.trim()
  if (!baseUrl) {
    throw new ApiError('Falta configurar la variable VITE_API_URL.', 0)
  }

  try {
    return new URL(file, `${baseUrl.replace(/\/+$/, '')}/`)
  } catch {
    throw new ApiError('La variable VITE_API_URL no contiene una URL válida.', 0)
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const [route, query = ''] = path.split('?', 2)
  const endpoint = createApiUrl('api.php')
  endpoint.searchParams.set('path', route)
  new URLSearchParams(query).forEach((value, key) => {
    endpoint.searchParams.append(key, value)
  })

  let response: Response
  try {
    response = await fetch(endpoint, { ...options, headers })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el API PHP. Comprueba que VITE_API_URL sea correcto y que el servicio esté disponible.',
      0,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof (payload as ApiErrorPayload).message === 'string'
        ? (payload as ApiErrorPayload).message!
        : response.status >= 500
          ? 'El API PHP no está disponible o encontró un error. Comprueba el servicio y la conexión con la base de datos.'
          : `No se pudo completar la solicitud (HTTP ${response.status}).`
    throw new ApiError(message, response.status)
  }

  return payload as T
}
