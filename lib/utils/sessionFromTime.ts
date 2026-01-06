export function sessionFromTime(tsISO: string) {
  const hour = new Date(tsISO).getUTCHours()

  if (hour >= 0 && hour < 7) return "Asia"
  if (hour >= 7 && hour < 13) return "London"
  if (hour >= 13 && hour < 20) return "New York"

  return "Off-hours"
}
