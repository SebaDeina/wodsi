/** Ruta inicial del atleta según si completó onboarding (WhatsApp). */
export function athleteAppPath(profile) {
  if (!profile?.whatsappPhone) return '/athlete/onboarding'
  return '/athlete'
}

export function athleteNeedsOnboarding(profile) {
  return profile?.role === 'athlete' && !profile?.whatsappPhone
}
