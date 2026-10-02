/**
 * 프로그램 카드(Bridge Hackathon)의 교차 국기 그림(서버 컴포넌트, 장식용 SVG).
 */
import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'
import { landingCopy } from '@/lib/contents/site-copy'

/** 깃대 길이와 기울기. 두 깃대는 밑동에서 이만큼 위에서 교차한다. */
const POLE = 150
const LEAN = 24
const CROSS = 38
const FOOT = CROSS * Math.tan((LEAN * Math.PI) / 180)

/** 깃발 비율은 3:2이고, 깃대 꼭대기 장식 바로 아래에 단다. */
const FLAG_W = 84
const FLAG_H = 56
const HOIST = POLE - 5

function Pole() {
  return (
    <>
      <rect
        x={-1.75}
        y={-POLE}
        width={3.5}
        height={POLE}
        rx={1.75}
        className="bridge-flags-pole"
      />
      <circle cy={-POLE - 3} r={4.5} className="bridge-flags-finial" />
    </>
  )
}

/** 태극기(원점을 중심으로 한 144 × 96 그림). */
function Taegukgi() {
  return (
    <g
      transform={`translate(${FLAG_W / 2} ${FLAG_H / 2}) scale(${FLAG_W / 144})`}
    >
      <path fill="#fff" d="M-72-48v96H72v-96z" />
      <g stroke="#000" strokeWidth={4}>
        <path
          transform="rotate(33.69)"
          d="M-50-12v24m6 0v-24m6 0v24m76 0V1m0-2v-11m6 0v11m0 2v11m6 0V1m0-2v-11"
        />
        <path
          transform="rotate(-33.69)"
          d="M-50-12v24m6 0V1m0-2v-11m6 0v24m76 0V1m0-2v-11m6 0v24m6 0V1m0-2v-11"
        />
      </g>
      <g transform="rotate(33.69)">
        <path fill="#cd2e3a" d="M12 0a18 18 0 11-36 0 24 24 0 1148 0" />
        <path
          fill="#0047a0"
          d="M-24 0a24 24 0 1048 0A12 12 0 100 0a12 12 0 11-24 0"
        />
      </g>
    </g>
  )
}

/** 일장기: 지름이 깃발 높이의 3/5인 원. */
function Hinomaru() {
  return (
    <>
      <rect width={FLAG_W} height={FLAG_H} fill="#fff" />
      <circle
        cx={FLAG_W / 2}
        cy={FLAG_H / 2}
        r={(FLAG_H * 3) / 10}
        fill="#bc002d"
      />
    </>
  )
}

function Cloth({ x, children }: { x: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${-HOIST})`}>
      {children}
      <rect width={FLAG_W} height={FLAG_H} className="bridge-flags-edge" />
    </g>
  )
}

/**
 * Bridge Hackathon의 두 나라를 교차한 깃발로 그린다. 각 깃발은 자기 깃대에서 바깥쪽으로 휘날린다.
 * 외국기와 교차 게양할 때의 국기 규정에 따라 태극기를 왼쪽에, 깃대를 앞쪽에 둔다. 태극기는 좌우 반전하지
 * 않고 그린다(반전하면 괘의 위치가 바뀐다).
 */
export default function BridgeFlags({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].programArt

  return (
    <div className="program-art">
      <svg
        role="img"
        aria-label={copy.flags}
        viewBox="0 0 240 172"
        className="bridge-flags"
      >
        <g transform={`translate(${120 - FOOT} 166) rotate(${LEAN})`}>
          <Pole />
          <Cloth x={1.75}>
            <Hinomaru />
          </Cloth>
        </g>
        <g transform={`translate(${120 + FOOT} 166) rotate(${-LEAN})`}>
          <Pole />
          <Cloth x={-1.75 - FLAG_W}>
            <Taegukgi />
          </Cloth>
        </g>
      </svg>
    </div>
  )
}
