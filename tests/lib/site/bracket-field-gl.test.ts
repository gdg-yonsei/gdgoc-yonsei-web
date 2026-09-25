import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createBracketField,
  mountBracketField,
  packCapsules,
  packRipples,
  parallaxTarget,
  RIPPLE_LIFE,
  type BracketField,
} from '@/app/(home)/[lang]/_components/home/bracket-field-gl'
import type { Capsule } from '@/lib/site/bracket-geometry'

const capsules: Capsule[] = [
  { hue: 'red', ax: 1, ay: 2, bx: 3, by: 4, r: 5 },
  { hue: 'green', ax: 6, ay: 7, bx: 8, by: 9, r: 5 },
]

class ResizeObserverStub {
  observe = vi.fn()
  disconnect = vi.fn()
}

function heroFixture() {
  document.body.innerHTML = `
    <section data-hero>
      <canvas></canvas>
      <span data-bracket="left"></span><h1>GDGoC Yonsei</h1><span data-bracket="right"></span>
    </section>`
  return {
    hero: document.querySelector<HTMLElement>('[data-hero]')!,
    canvas: document.querySelector<HTMLCanvasElement>('canvas')!,
  }
}

function fakeField(): BracketField {
  return {
    status: () => 'ready' as const,
    resize: vi.fn(),
    draw: vi.fn(),
    dispose: vi.fn(),
  }
}

describe('packCapsules', () => {
  it('scales centres and radius to device pixels in paint order', () => {
    const packed = packCapsules(capsules, 2)
    expect(Array.from(packed.positions.slice(0, 8))).toEqual([
      2, 4, 6, 8, 12, 14, 16, 18,
    ])
    expect(packed.radius).toBe(10)
    expect(packed.colors[0]).toBeCloseTo(0.918)
    expect(packed.colors[4]).toBeCloseTo(0.659)
  })
})

describe('packCapsules buffers', () => {
  it('fills the buffers it is given instead of allocating per frame', () => {
    const into = {
      positions: new Float32Array(16),
      colors: new Float32Array(12),
      radius: 0,
    }
    expect(packCapsules(capsules, 2, into)).toBe(into)
    expect(into.positions[4]).toBe(12)
    expect(into.radius).toBe(10)
  })
})

describe('packRipples', () => {
  it('packs the three newest ripples in device pixels, empty slots zeroed', () => {
    const packed = packRipples(
      [
        { x: 1, y: 1, age: 0.9 },
        { x: 10, y: 20, age: 0.5 },
        { x: 30, y: 40, age: 0.25 },
        { x: 50, y: 60, age: 0 },
      ],
      2
    )
    expect(Array.from(packed)).toEqual([
      20, 40, 0.5, 1, 60, 80, 0.25, 1, 100, 120, 0, 1,
    ])
    expect(Array.from(packRipples([], 2)).every((value) => value === 0)).toBe(
      true
    )
  })
})

describe('parallaxTarget', () => {
  it('leans the brackets toward the pointer from the centre of the stage', () => {
    expect(parallaxTarget({ x: 500, y: 300 }, 1000, 600)).toEqual({
      x: 0,
      y: 0,
    })
    const corner = parallaxTarget({ x: 1000, y: 600 }, 1000, 600)
    expect(corner.x).toBeGreaterThan(0)
    expect(corner.y).toBeGreaterThan(0)
  })
})

/** Just enough of WebGL2 for createBracketField to build and dispose a field. */
function fakeGl(renderer: string) {
  const loseContext = vi.fn()
  const gl = {
    RENDERER: 0x1f01,
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    getExtension: (name: string) =>
      name === 'WEBGL_lose_context' ? { loseContext } : null,
    getParameter: (parameter: number) =>
      parameter === 0x1f01 ? renderer : null,
    createProgram: () => ({}),
    createShader: () => ({}),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    createBuffer: () => ({}),
    createVertexArray: () => ({}),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
  }
  return { gl: gl as unknown as WebGL2RenderingContext, loseContext }
}

describe('createBracketField', () => {
  it('refuses software rasterisers so the CPU never runs the shader', () => {
    const canvas = document.createElement('canvas')
    const getContext = vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    createBracketField(canvas)
    expect(getContext).toHaveBeenCalledWith(
      'webgl2',
      expect.objectContaining({ failIfMajorPerformanceCaveat: true })
    )
  })

  it('declines software renderers that still hand out a context', () => {
    const canvas = document.createElement('canvas')
    const loseContext = vi.fn()
    const fakeGl = {
      getExtension: (name: string) =>
        name === 'WEBGL_debug_renderer_info'
          ? { UNMASKED_RENDERER_WEBGL: 0x9246 }
          : name === 'WEBGL_lose_context'
            ? { loseContext }
            : null,
      getParameter: () => 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))',
    }
    vi.spyOn(canvas, 'getContext').mockReturnValue(
      fakeGl as unknown as WebGL2RenderingContext
    )
    expect(createBracketField(canvas)).toBeNull()
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it('falls back to gl.RENDERER when the debug extension is missing', () => {
    const canvas = document.createElement('canvas')
    const { gl, loseContext } = fakeGl('llvmpipe (LLVM 17.0.0, 256 bits)')
    vi.spyOn(canvas, 'getContext').mockReturnValue(gl)
    expect(createBracketField(canvas)).toBeNull()
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it('hands the drawing buffer back on dispose but keeps the context', () => {
    // A hidden route (React <Activity>) keeps its canvas and mounts the
    // field again on return; a lost context would never come back.
    const canvas = document.createElement('canvas')
    canvas.width = 2560
    canvas.height = 1600
    const { gl, loseContext } = fakeGl('ANGLE (Apple, Apple M2, OpenGL 4.1)')
    vi.spyOn(canvas, 'getContext').mockReturnValue(gl)
    const field = createBracketField(canvas)

    field?.dispose()

    expect(field).not.toBeNull()
    expect([canvas.width, canvas.height]).toEqual([1, 1])
    expect(loseContext).not.toHaveBeenCalled()
  })

  it('returns null when WebGL2 is unavailable', () => {
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    expect(createBracketField(canvas)).toBeNull()
  })
})

describe('mountBracketField', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('leaves the poster alone when no field can be created', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    const teardown = mountBracketField(canvas, hero, () => null)
    expect(hero.dataset.gl).toBeUndefined()
    teardown()
  })

  it('gives the stage back to the poster when frames keep running slow', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => frames.push(callback))
    )
    const field = fakeField()
    mountBracketField(canvas, hero, () => field)

    // ~10 fps: each frame lands 100 ms after the previous one.
    for (let frame = 1; frame <= 20 && frames.length > 0; frame += 1) {
      frames.shift()!(frame * 100)
    }

    expect(hero.dataset.gl).toBeUndefined()
    expect(field.dispose).toHaveBeenCalledTimes(1)
  })

  it('keeps a slow field for review under the dev-only ?gl-software flag', () => {
    window.history.replaceState({}, '', '/en?gl-software')
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => frames.push(callback))
    )
    const field = fakeField()
    mountBracketField(canvas, hero, () => field)

    for (let frame = 1; frame <= 20 && frames.length > 0; frame += 1) {
      frames.shift()!(frame * 100)
    }

    expect(hero.dataset.gl).toBe('on')
    expect(field.dispose).not.toHaveBeenCalled()
    window.history.replaceState({}, '', '/')
  })

  it('gives up and restores the poster when the shader fails to link', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => frames.push(callback))
    )
    const field = { ...fakeField(), status: () => 'failed' as const }
    mountBracketField(canvas, hero, () => field)

    frames.shift()!(16)

    expect(field.dispose).toHaveBeenCalledTimes(1)
    expect(frames).toHaveLength(0)
  })

  it('restores the poster when the GPU context is lost', () => {
    const { hero, canvas } = heroFixture()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1)
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const field = fakeField()
    mountBracketField(canvas, hero, () => field)
    hero.dataset.gl = 'on'

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))

    expect(hero.dataset.gl).toBeUndefined()
    expect(field.dispose).toHaveBeenCalledTimes(1)
  })

  describe('shockwaves', () => {
    function mountWithFrames() {
      const { hero, canvas } = heroFixture()
      vi.stubGlobal('ResizeObserver', ResizeObserverStub)
      vi.stubGlobal('cancelAnimationFrame', vi.fn())
      const frames: FrameRequestCallback[] = []
      vi.stubGlobal(
        'requestAnimationFrame',
        vi.fn((callback: FrameRequestCallback) => frames.push(callback))
      )
      const field = fakeField()
      mountBracketField(canvas, hero, () => field)
      frames.shift()!(16)
      const lastRipples = () =>
        vi.mocked(field.draw).mock.calls.at(-1)?.[0].ripples ?? []
      return { hero, frames, lastRipples }
    }

    it('ripple out from where the stage is tapped, then fade', () => {
      const { hero, frames, lastRipples } = mountWithFrames()

      hero.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 40, clientY: 30, bubbles: true })
      )
      frames.shift()!(32)
      frames.shift()!(48)
      expect(lastRipples()).toEqual([
        { x: 40, y: 30, age: expect.closeTo(0.016, 3) },
      ])

      frames.shift()!(48 + RIPPLE_LIFE * 1000)
      expect(lastRipples()).toEqual([])
    })

    it('leave taps on links and buttons alone', () => {
      const { hero, frames, lastRipples } = mountWithFrames()
      const link = document.createElement('a')
      hero.append(link)

      link.dispatchEvent(
        new MouseEvent('pointerdown', { clientX: 5, clientY: 5, bubbles: true })
      )
      frames.shift()!(32)
      expect(lastRipples()).toEqual([])
    })
  })
})
