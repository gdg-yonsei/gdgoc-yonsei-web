import { SVGProps } from 'react'

export default function InstagramWhiteBg({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <rect width="24" height="24" rx="6" fill="oklch(0.985 0 0)" />
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="4.25"
        stroke="#000000"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4.25" stroke="#000000" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="#000000" />
    </svg>
  )
}
