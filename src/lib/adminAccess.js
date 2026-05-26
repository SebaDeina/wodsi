/** Único email con acceso al panel /admin (mismo valor en Firestore app_config/admins). */
export const ADMIN_EMAIL = 'sebadeina1@gmail.com'

export function getAdminEmails() {
  return [ADMIN_EMAIL]
}

export function isAdminEmail(email) {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}
