/**
 * 코드 모양 섹션 꼬리표(`<about />`).
 */

/** 코드 모양 섹션 꼬리표. 섹션 이름은 제목이 전달하므로 장식으로 취급한다. */
export default function SectionTag({ children }: { children: string }) {
  return (
    <p aria-hidden="true" className="section-tag">
      {children}
    </p>
  )
}
