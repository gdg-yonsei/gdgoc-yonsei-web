/** The code-style section label (`<about />`). Decorative: the section's
    heading carries its name. */
export default function SectionTag({ children }: { children: string }) {
  return (
    <p aria-hidden="true" className="section-tag">
      {children}
    </p>
  )
}
