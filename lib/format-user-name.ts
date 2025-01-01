export default function formatUserName(
  name: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  isForeigner: boolean = false
) {
  if (firstName && lastName) {
    if (isForeigner) {
      return `${lastName} ${firstName}`
    }
    return `${firstName} ${lastName}`
  }
  if (name) {
    return name
  }
  return 'Unknown User'
}
