export const AUTH_TOKEN_KEY = 'china-nails-token'

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

  let response: Response
  try {
    const [route, query = ''] = path.split('?', 2)
    const endpoint = new URL('http://localhost/china-nails-api/api.php')
    endpoint.searchParams.set('path', route)
    new URLSearchParams(query).forEach((value, key) => {
      endpoint.searchParams.append(key, value)
    })
    response = await fetch(endpoint, { ...options, headers })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el API PHP local. Comprueba que Apache de XAMPP esté en ejecución.',
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
          ? 'El API PHP local no está disponible o encontró un error. Comprueba Apache y la conexión con Aiven.'
          : `No se pudo completar la solicitud (HTTP ${response.status}).`
    throw new ApiError(message, response.status)
  }

  return payload as T
}
