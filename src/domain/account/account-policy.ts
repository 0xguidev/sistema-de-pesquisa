export const ACCOUNT_NAME_MIN_LENGTH = 2
export const ACCOUNT_NAME_MAX_LENGTH = 100
export const ACCOUNT_PASSWORD_MIN_LENGTH = 8
export const ACCOUNT_PASSWORD_MAX_LENGTH = 128

export function normalizeAccountEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeAccountName(name: string) {
  return name.trim()
}

export function isAccountEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAccountEmail(email))
}

export function isAccountNameValid(name: string) {
  const normalizedName = normalizeAccountName(name)

  return (
    normalizedName.length >= ACCOUNT_NAME_MIN_LENGTH &&
    normalizedName.length <= ACCOUNT_NAME_MAX_LENGTH
  )
}

export function isAccountPasswordValid(password: string) {
  return (
    password.trim().length > 0 &&
    password.length >= ACCOUNT_PASSWORD_MIN_LENGTH &&
    password.length <= ACCOUNT_PASSWORD_MAX_LENGTH
  )
}
