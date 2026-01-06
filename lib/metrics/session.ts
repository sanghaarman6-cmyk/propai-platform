export function getSessionFromDate(d: Date) {
  const h = d.getUTCHours()

  if (h >= 6 && h < 13) return "London"
  if (h >= 13 && h < 21) return "NY"
  return "Asia"
}
