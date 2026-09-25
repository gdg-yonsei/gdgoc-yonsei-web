// Usage: node chunks.mjs <url> — when (ms after request) each HTML chunk arrives, and where S:0 / $RC land.
const url = process.argv[2]
const t0 = performance.now()
const res = await fetch(url)
const reader = res.body.getReader()
const decoder = new TextDecoder()
let total = 0
for (;;) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value, { stream: true })
  const marks = [chunk.includes('page-header-title') && 'H1', chunk.includes('id="S:0"') && 'S:0', chunk.includes('$RC("B:0"') && '$RC'].filter(Boolean)
  total += value.length
  console.log(String(Math.round(performance.now() - t0)).padStart(5), 'ms', String(total).padStart(7), 'B', marks.join(' '))
}
