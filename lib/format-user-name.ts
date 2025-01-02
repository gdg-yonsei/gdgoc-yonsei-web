export default function formatUserName(
  name: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  isForeigner: boolean = false
) {
  if (firstName && lastName) {
    if (isForeigner) {
      return `${firstName} ${lastName}`
    }
    return `${lastName} ${firstName}`
  }
  if (name) {
    return name
  }
  return 'Unknown User'
}
