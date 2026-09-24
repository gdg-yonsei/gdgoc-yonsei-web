import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createBracketField,
  mountBracketField,
  packCapsules,
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
    isReady: () => true,
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
})
