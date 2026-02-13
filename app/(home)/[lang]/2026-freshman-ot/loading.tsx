/**
 * `FreshmanOTLoading` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function FreshmanOTLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        {/* Google-colored dots animation */}
        <div className="flex gap-3">
          {['bg-gdg-blue-300', 'bg-gdg-red-300', 'bg-gdg-yellow-300', 'bg-gdg-green-300'].map(
            (color, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full ${color}`}
                style={{
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ),
          )}
        </div>
        <p className="text-sm tracking-widest text-neutral-400">
          Loading...
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
