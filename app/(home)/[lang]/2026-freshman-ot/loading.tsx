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
