const UNAUTHORIZED_EVENT = 'auth:unauthorized'

export function notifyUnauthorized() {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export function subscribeToUnauthorized(handler: () => void) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
}
