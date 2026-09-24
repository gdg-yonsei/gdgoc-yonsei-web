export const CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?src=677628d5283429965be172c135ff0c67830795e5adfb3bc11782b305d14b392c%40group.calendar.google.com&ctz=Asia%2FSeoul'

export default function GoogleCalendar() {
  return (
    <iframe
      src={CALENDAR_EMBED_URL}
      title="GDGoC Yonsei Google Calendar"
      loading="lazy"
      className="calendar-embed"
    />
  )
}
