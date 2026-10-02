/**
 * 히어로 배경의 WebGL2 망점(halftone) 필드(클라이언트 전용, 별도 청크).
 *
 * `bracket-stage.tsx`가 브라우저 유휴 시간에 동적 import한다. GPU가 없거나 느리면 스스로 물러나
 * 서버가 그린 SVG 포스터가 남는다. 괄호 모양 계산은 `lib/site/bracket-geometry.ts`와 공유한다.
 *
 * 셰이더 소스(GLSL 문자열) 안의 주석은 영어로 둔다. 일부 GPU 드라이버는 ASCII가 아닌 셰이더
 * 소스를 컴파일하지 못한다.
 */
import {
  capsulesFromBracketRects,
  partingOffset,
  scrollProgress,
  type Capsule,
  type CapsuleHue,
  type Rect,
} from '@/lib/site/bracket-geometry'
import { CAPSULE_HEX, hexToUnitRgb } from '@/lib/site/brand'

const CAPSULE_RGB = Object.fromEntries(
  Object.entries(CAPSULE_HEX).map(([hue, hex]) => [hue, hexToUnitRgb(hex)])
) as Record<CapsuleHue, readonly [number, number, number]>

/** 셰이더 uniform으로 넘길 캡슐 데이터(기기 픽셀). */
export type PackedCapsules = {
  positions: Float32Array
  colors: Float32Array
  radius: number
}

/** 캡슐들을 기기 픽셀 단위로 `into`에 쓴다(생략하면 새로 할당한다). */
export function packCapsules(
  capsules: readonly Capsule[],
  dpr: number,
  into: PackedCapsules = {
    positions: new Float32Array(16),
    colors: new Float32Array(12),
    radius: 0,
  }
): PackedCapsules {
  into.positions.fill(0)
  into.colors.fill(0)
  for (let index = 0; index < Math.min(4, capsules.length); index += 1) {
    const capsule = capsules[index]!
    const offset = index * 4
    into.positions[offset] = capsule.ax * dpr
    into.positions[offset + 1] = capsule.ay * dpr
    into.positions[offset + 2] = capsule.bx * dpr
    into.positions[offset + 3] = capsule.by * dpr
    into.colors.set(CAPSULE_RGB[capsule.hue], index * 3)
  }
  into.radius = (capsules[0]?.r ?? 0) * dpr
  return into
}

/** `age`초 전에 CSS 픽셀 좌표의 한 점에서 일어난 무대 탭. */
export type Ripple = { x: number; y: number; age: number }

/** 충격파가 무대를 가로질러 사라지는 데 걸리는 시간(초). */
export const RIPPLE_LIFE = 1.6

/**
 * 가장 최근 물결 세 개를 기기 픽셀 단위로 `into`에 쓴다. 남는 자리는 0으로 두며, 셰이더는 이를
 * "물결 없음"으로 읽는다.
 */
export function packRipples(
  ripples: readonly Ripple[],
  dpr: number,
  into = new Float32Array(12)
): Float32Array {
  into.fill(0)
  ripples.slice(-3).forEach((ripple, index) => {
    into.set([ripple.x * dpr, ripple.y * dpr, ripple.age, 1], index * 4)
  })
  return into
}

/** 괄호를 포인터 쪽으로 기울이는 CSS 픽셀 이동량. 무대 가운데에서는 0이다. */
export function parallaxTarget(
  pointer: { x: number; y: number },
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: (pointer.x / Math.max(1, width) - 0.5) * 16 + 0,
    y: (pointer.y / Math.max(1, height) - 0.5) * 10 + 0,
  }
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`

/*
 * 망점: 칸마다 점 하나를 그리며, 반지름은 캡슐 부호 거리장(SDF), 느린 값 노이즈, 포인터 렌즈,
 * 등장 스윕으로 정한다. 결과는 premultiplied alpha라 CSS 무대 배경색이 비쳐 보인다.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_cell;
uniform vec3 u_pointer;
uniform float u_lens;
uniform vec4 u_caps[4];
uniform float u_radius;
uniform vec3 u_colors[4];
uniform float u_reveal;
uniform vec4 u_ripples[3];
uniform float u_rippleSpeed;
out vec4 outColor;

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 center = (floor(frag / u_cell) + 0.5) * u_cell;

  float nearest = 1e9;
  int hue = -1;
  for (int i = 0; i < 4; i++) {
    float d = sdCapsule(center, u_caps[i].xy, u_caps[i].zw, u_radius);
    if (d < 0.0) hue = i;
    nearest = min(nearest, d);
  }

  float n = noise(center / (u_cell * 9.0) + vec2(u_time * 0.07, u_time * -0.05));
  float lens = u_pointer.z * smoothstep(u_lens, 0.0, distance(center, u_pointer.xy));
  float sweep = clamp(
    u_reveal * 1.6 - distance(center, u_resolution * 0.5) / length(u_resolution * 0.5),
    0.0,
    1.0
  );

  // Shockwaves: a ring per tap that widens and fades over RIPPLE_LIFE.
  float ripple = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 r = u_ripples[i];
    if (r.w <= 0.0) continue;
    float band = (distance(center, r.xy) - r.z * u_rippleSpeed) / (u_cell * 3.0);
    ripple += exp(-band * band) * (1.0 - r.z / ${RIPPLE_LIFE.toFixed(1)});
  }
  ripple = clamp(ripple, 0.0, 1.0);

  vec3 color;
  float radius;
  float alpha;
  if (hue >= 0) {
    float depth = clamp(-nearest / u_radius, 0.0, 1.0);
    radius = (0.2 + 0.26 * sqrt(depth) + 0.07 * n + 0.1 * lens + 0.12 * ripple) * u_cell;
    color = mix(u_colors[hue], vec3(1.0), 0.12 * n + 0.18 * lens + 0.25 * ripple);
    alpha = 1.0;
  } else {
    float halo = smoothstep(u_radius * 1.4, 0.0, nearest);
    radius = (0.07 + 0.12 * n * n + 0.2 * lens + 0.08 * halo + 0.22 * ripple) * u_cell;
    color = vec3(0.941);
    alpha = 0.09 + 0.3 * lens + 0.12 * halo + 0.35 * ripple;
  }

  float mask = 1.0 - smoothstep(radius - 0.75, radius + 0.75, distance(frag, center));
  float a = mask * alpha * sweep;
  outColor = vec4(color * a, a);
}`

/** 한 프레임을 그리는 데 필요한 값(시간, 등장 진행도, 포인터, 캡슐, 칸 크기, 렌즈, 물결). */
export type FieldFrame = {
  time: number
  reveal: number
  pointer: readonly [number, number, number]
  capsules: readonly Capsule[]
  cell: number
  lens: number
  ripples: readonly Ripple[]
}

/** 셰이더 준비 상태. 비동기 컴파일 중이면 `pending`. */
export type FieldStatus = 'pending' | 'ready' | 'failed'

/** WebGL 필드 핸들. */
export type BracketField = {
  status(): FieldStatus
  resize(width: number, height: number, dpr: number): void
  draw(frame: FieldFrame): void
  dispose(): void
}

type Uniforms = Record<
  | 'resolution'
  | 'time'
  | 'cell'
  | 'pointer'
  | 'lens'
  | 'caps'
  | 'radius'
  | 'colors'
  | 'reveal'
  | 'ripples'
  | 'rippleSpeed',
  WebGLUniformLocation | null
>

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i

/**
 * 일부 브라우저는 성능 경고 없이 소프트웨어 GL을 내준다. 실제 렌더러 이름을 숨기는 브라우저도
 * 일반 렌더러 이름에는 소프트웨어 래스터라이저 이름을 남긴다.
 */
function isSoftwareRenderer(gl: WebGL2RenderingContext) {
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = gl.getParameter(
    info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER
  )
  return SOFTWARE_RENDERER.test(String(renderer))
}

/** GPU 없는 기기에서도 필드를 검토할 수 있게 하는 개발 전용 우회(`?gl-software`). */
function allowSoftwareRendering() {
  return (
    process.env.NODE_ENV !== 'production' &&
    typeof location !== 'undefined' &&
    new URLSearchParams(location.search).has('gl-software')
  )
}

/**
 * 캔버스에 WebGL2 필드를 만든다. WebGL2가 없거나 소프트웨어 렌더러면 null(포스터를 유지).
 *
 * @param canvas 그릴 캔버스
 */
export function createBracketField(
  canvas: HTMLCanvasElement
): BracketField | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    // 소프트웨어 래스터라이저(SwiftShader, llvmpipe)는 셰이더를 CPU에서 돌려 메인 스레드를 막는다.
    // 이런 방문자에게는 SVG 포스터를 그대로 보여 준다.
    failIfMajorPerformanceCaveat: !allowSoftwareRendering(),
  })
  if (!gl) return null
  if (isSoftwareRenderer(gl) && !allowSoftwareRendering()) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }

  const program = gl.createProgram()
  const vertex = gl.createShader(gl.VERTEX_SHADER)
  const fragment = gl.createShader(gl.FRAGMENT_SHADER)
  if (!program || !vertex || !fragment) return null

  gl.shaderSource(vertex, VERTEX_SHADER)
  gl.shaderSource(fragment, FRAGMENT_SHADER)
  gl.compileShader(vertex)
  gl.compileShader(fragment)
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)

  // 드라이버가 메인 스레드 밖에서 컴파일하게 한다. 기다리며 막는 대신 상태를 확인(polling)한다.
  const parallel = gl.getExtension('KHR_parallel_shader_compile')
  const buffer = gl.createBuffer()
  const vao = gl.createVertexArray()
  let uniforms: Uniforms | null = null
  let dpr = 1
  let failed = false
  const packed: PackedCapsules = {
    positions: new Float32Array(16),
    colors: new Float32Array(12),
    radius: 0,
  }
  const packedRipples = new Float32Array(12)

  const setup = () => {
    gl.useProgram(program)
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const location = (name: string) => gl.getUniformLocation(program, name)
    uniforms = {
      resolution: location('u_resolution'),
      time: location('u_time'),
      cell: location('u_cell'),
      pointer: location('u_pointer'),
      lens: location('u_lens'),
      caps: location('u_caps'),
      radius: location('u_radius'),
      colors: location('u_colors'),
      reveal: location('u_reveal'),
      ripples: location('u_ripples'),
      rippleSpeed: location('u_rippleSpeed'),
    }
  }

  return {
    status() {
      if (uniforms) return 'ready'
      if (failed) return 'failed'
      if (
        parallel &&
        !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)
      ) {
        return 'pending'
      }
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        failed = true
        return 'failed'
      }
      setup()
      return 'ready'
    },
    resize(width, height, nextDpr) {
      dpr = nextDpr
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    },
    draw({ time, reveal, pointer, capsules, cell, lens, ripples }) {
      if (!uniforms) return
      packCapsules(capsules, dpr, packed)
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
      gl.uniform1f(uniforms.time, time)
      gl.uniform1f(uniforms.cell, cell * dpr)
      gl.uniform1f(uniforms.lens, lens * dpr)
      gl.uniform3f(
        uniforms.pointer,
        pointer[0] * dpr,
        pointer[1] * dpr,
        pointer[2]
      )
      gl.uniform4fv(uniforms.caps, packed.positions)
      gl.uniform1f(uniforms.radius, packed.radius)
      gl.uniform3fv(uniforms.colors, packed.colors)
      gl.uniform1f(uniforms.reveal, reveal)
      gl.uniform4fv(uniforms.ripples, packRipples(ripples, dpr, packedRipples))
      // 넓은 무대도 RIPPLE_LIFE 안에 넉넉히 가로지를 만큼 빠르다.
      gl.uniform1f(uniforms.rippleSpeed, 900 * dpr)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.deleteBuffer(buffer)
      gl.deleteVertexArray(vao)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      // 화면 전체 크기의 그리기 버퍼를 반납한다. 컨텍스트 자체는 유지한다. <Activity>로 숨겨진 라우트는
      // 이 캔버스를 남겨 두었다가 다시 보일 때 필드를 다시 붙이는데, 잃어버린 컨텍스트는 돌아오지 않는다.
      canvas.width = 1
      canvas.height = 1
    },
  }
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * 필드를 히어로에 연결한다: 크기 조절, 괄호 기준점, 포인터 렌즈와 시차, 탭 충격파, 스크롤로 벌어지기,
 * 화면 표시 여부, GPU 컨텍스트 손실 처리.
 * @returns SVG 포스터로 되돌리는 정리 함수
 */
export function mountBracketField(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  create: (
    canvas: HTMLCanvasElement
  ) => BracketField | null = createBracketField
): () => void {
  const left = hero.querySelector<HTMLElement>('[data-bracket="left"]')
  const right = hero.querySelector<HTMLElement>('[data-bracket="right"]')
  const created = left && right ? create(canvas) : null
  if (!created || !left || !right) return () => {}
  // 아래로 끌어올려진 정리 함수가 null이 아닌 필드를 보도록 다시 묶는다.
  const field: BracketField = created

  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  // 개발용 소프트웨어 검토 모드에서는 아무리 느려도 필드를 유지한다.
  const reviewing = allowSoftwareRendering()
  const dprCap = coarse ? 1.5 : 2
  // 히어로 크기에서 눈이 여전히 망점으로 읽는 가장 촘촘한 점 간격.
  const cellFor = (radius: number) => Math.min(11, Math.max(5, radius / 4))
  const lens = coarse ? 150 : 190
  const pointer = { x: 0, y: 0, strength: 0, target: 0 }
  const parallax = { x: 0, y: 0 }
  // 첫 프레임을 기다리는 탭은 아직 `born` 시각이 없으므로 나이는 렌더 시계를 따른다.
  let taps: { x: number; y: number; born?: number }[] = []
  let anchors: { left: Rect; right: Rect } | null = null
  let width = 0
  let progress = scrollProgress(window.scrollY, hero.offsetHeight)
  let visible = true
  let frameHandle = 0
  let startedAt = 0
  let lastFrameAt = 0
  let slowFrames = 0
  let torn = false

  const relativeTo = (element: HTMLElement, origin: DOMRect): Rect => {
    const rect = element.getBoundingClientRect()
    return {
      left: rect.left - origin.left,
      top: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    }
  }

  const measure = () => {
    const origin = canvas.getBoundingClientRect()
    width = origin.width
    field.resize(
      origin.width,
      origin.height,
      Math.min(window.devicePixelRatio || 1, dprCap)
    )
    anchors = {
      left: relativeTo(left, origin),
      right: relativeTo(right, origin),
    }
  }

  const running = () =>
    !torn && visible && !document.hidden && progress < 1 && anchors !== null

  const frame = (now: number) => {
    frameHandle = 0
    if (!running() || !anchors) return
    // 링크에 실패한 셰이더는 매 프레임 상태를 확인하는 대신 무대를 포스터에 돌려준다.
    const status = field.status()
    if (status === 'failed') {
      teardown()
      return
    }
    frameHandle = requestAnimationFrame(frame)
    if (coarse && now - lastFrameAt < 32) return
    const delta = lastFrameAt ? now - lastFrameAt : 0
    lastFrameAt = now
    if (status === 'pending') return
    if (!startedAt) {
      startedAt = now
      hero.dataset.gl = 'on'
    }

    // 감시: 약 15fps를 유지하지 못하는 하드웨어는 정적 포스터로 되돌린다.
    slowFrames = delta > 66 && !reviewing ? slowFrames + 1 : 0
    if (slowFrames >= 6) {
      teardown()
      return
    }

    if (coarse) {
      const t = now / 1000
      pointer.x = width * (0.5 + 0.28 * Math.cos(t * 0.21))
      pointer.y = hero.offsetHeight * (0.5 + 0.22 * Math.sin(t * 0.17))
      pointer.strength = 0.6
    } else {
      pointer.strength += (pointer.target - pointer.strength) * 0.1
    }

    // 괄호가 포인터 쪽으로 살짝 기울고, 포인터가 떠나면 천천히 돌아온다.
    const lean = parallaxTarget(pointer, width, hero.offsetHeight)
    parallax.x += (lean.x * pointer.strength - parallax.x) * 0.08
    parallax.y += (lean.y * pointer.strength - parallax.y) * 0.08
    const capsules = capsulesFromBracketRects(
      anchors.left,
      anchors.right,
      partingOffset(progress, width)
    ).map((capsule) => ({
      ...capsule,
      ax: capsule.ax + parallax.x,
      bx: capsule.bx + parallax.x,
      ay: capsule.ay + parallax.y,
      by: capsule.by + parallax.y,
    }))

    for (const tap of taps) tap.born ??= now
    taps = taps.filter((tap) => now - tap.born! < RIPPLE_LIFE * 1000)
    field.draw({
      time: now / 1000,
      reveal: easeOutCubic(Math.min(1, (now - startedAt) / 1400)),
      pointer: [pointer.x, pointer.y, pointer.strength],
      capsules,
      cell: cellFor(capsules[0]?.r ?? 44),
      lens,
      ripples: taps.map(({ x, y, born }) => ({
        x,
        y,
        age: (now - born!) / 1000,
      })),
    })
  }

  const kick = () => {
    if (!frameHandle && running()) frameHandle = requestAnimationFrame(frame)
  }

  const onScroll = () => {
    progress = scrollProgress(window.scrollY, hero.offsetHeight)
    kick()
  }
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    const origin = canvas.getBoundingClientRect()
    pointer.x = event.clientX - origin.left
    pointer.y = event.clientY - origin.top
    pointer.target = 1
    kick()
  }
  const onPointerLeave = () => {
    pointer.target = 0
  }
  // 링크와 버튼의 클릭은 그대로 두고, 무대의 나머지 부분을 탭하면 망점에 충격파가 퍼진다.
  const onPointerDown = (event: PointerEvent) => {
    if ((event.target as Element | null)?.closest?.('a, button')) return
    const origin = canvas.getBoundingClientRect()
    taps = [
      ...taps.slice(-2),
      { x: event.clientX - origin.left, y: event.clientY - origin.top },
    ]
    kick()
  }
  const onContextLost = (event: Event) => {
    event.preventDefault()
    teardown()
  }

  const resizeObserver = new ResizeObserver(() => {
    measure()
    kick()
  })
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    kick()
  })

  function teardown() {
    if (torn) return
    torn = true
    cancelAnimationFrame(frameHandle)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    window.removeEventListener('scroll', onScroll)
    hero.removeEventListener('pointermove', onPointerMove)
    hero.removeEventListener('pointerleave', onPointerLeave)
    hero.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('visibilitychange', kick)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    delete hero.dataset.gl
    field.dispose()
  }

  resizeObserver.observe(canvas)
  const title = hero.querySelector('h1')
  if (title) resizeObserver.observe(title)
  intersectionObserver.observe(hero)
  window.addEventListener('scroll', onScroll, { passive: true })
  hero.addEventListener('pointermove', onPointerMove)
  hero.addEventListener('pointerleave', onPointerLeave)
  hero.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('visibilitychange', kick)
  canvas.addEventListener('webglcontextlost', onContextLost)
  void document.fonts?.ready.then(() => {
    if (torn) return
    measure()
    kick()
  })
  measure()
  kick()

  return teardown
}
