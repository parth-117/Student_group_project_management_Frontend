const normalizeBaseUrl = (value) => {
  if (!value) return ''
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

const buildUrl = (path) => {
  if (!path) throw new Error('apiFetch: path is required')
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`
  return `${API_BASE_URL}${path}`
}

export const apiFetch = async (path, options = {}) => {
  const {
    method = 'GET',
    headers,
    body,
    signal,
    credentials = 'omit',
  } = options

  const requestHeaders = new Headers(headers || {})
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }
  let requestBody = body

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  if (body != null && typeof body === 'object' && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  const res = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
    credentials,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const text = await res.text()
      if (text) {
        try {
          const json = JSON.parse(text)
          if (json.message) message = json.message
          else if (json.error) message = json.error
          else message = text
        } catch {
          message = text
        }
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (res.status === 204) return null

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export const apiDownloadBlob = async (path, options = {}) => {
  const requestHeaders = new Headers(options.headers || {})
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null
  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers: requestHeaders,
    signal: options.signal,
    credentials: options.credentials || 'omit',
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const text = await res.text()
      if (text) message = text
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return res.blob()
}
