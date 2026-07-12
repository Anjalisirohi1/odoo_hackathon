const EMOJI_REGEX = /\p{Extended_Pictographic}/u
const FULL_NAME_MAX_LENGTH = 50

export function sanitizeFullName(value) {
  return value.replace(new RegExp(EMOJI_REGEX, 'gu'), '').slice(0, FULL_NAME_MAX_LENGTH)
}

export function getFullNameError(value) {
  const trimmed = value.trim()
  if (!trimmed) return 'Full name is required'
  if (trimmed.length < 2) return 'Full name must be at least 2 characters'
  if (trimmed.length > FULL_NAME_MAX_LENGTH) return `Full name must be under ${FULL_NAME_MAX_LENGTH} characters`
  if (EMOJI_REGEX.test(trimmed)) return 'Full name cannot contain emojis'
  return null
}

export function getEmailError(value) {
  const trimmed = value.trim()
  if (!trimmed) return 'Corporate email is required'
  if (!/^\S+@\S+\.\S+$/.test(trimmed)) return 'Enter a valid email address'
  return null
}

export const passwordRequirements = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
  { key: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export function getPasswordError(value) {
  if (!value) return 'Password is required'
  const failed = passwordRequirements.filter((rule) => !rule.test(value))
  if (failed.length) return `Password must include: ${failed.map((rule) => rule.label.toLowerCase()).join(', ')}`
  return null
}

export { FULL_NAME_MAX_LENGTH }
