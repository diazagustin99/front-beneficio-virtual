const STORAGE_KEY = 'bv_user'

export interface UserIdentity {
  token: string
  email?: string
}

export function getStoredUserIdentity(): UserIdentity | null {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as UserIdentity
  } catch {
    return null
  }
}

export function storeUserIdentity(identity: UserIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
}

export function clearStoredUserIdentity(): void {
  localStorage.removeItem(STORAGE_KEY)
}
