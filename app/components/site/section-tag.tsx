export default function SectionTag({ children }: { children: string }) {
  return (
    <p aria-hidden="true" className="section-tag">
      {children}
    </p>
  )
}
