import { NextRequest, NextResponse } from 'next/server'
import db from '@/db'
import { performanceMetrics } from '@/db/schema/performance-metrics'
import { eq, gte, lte, desc } from 'drizzle-orm'
import { z } from 'zod'

// 성능 데이터 검증 스키마
const performanceDataSchema = z.object({
  url: z.string().url(),
  pageTitle: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),

  // Core Web Vitals
  lcp: z.number().positive().optional(),
  inp: z.number().positive().optional(),
  cls: z.number().min(0).optional(),
  fcp: z.number().positive().optional(),
  ttfb: z.number().positive().optional(),
  tti: z.number().positive().optional(),

  // 추가 성능 지표
  domContentLoadedTime: z.number().min(0).optional(),
  loadTime: z.number().min(0).optional(),
  firstPaintTime: z.number().min(0).optional(),

  // 네트워크 정보
  connectionType: z.string().optional(),
  effectiveType: z.string().optional(),

  // 디바이스 및 브라우저 정보
  userAgent: z.string(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']),
  screenResolution: z.string(),
  viewport: z.string(),
  browserName: z.string(),
  browserVersion: z.string(),

  // 지리적 정보
  country: z.string().length(2).optional(),
  region: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 더 안전한 JSON 파싱
    let body: any
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Empty request body' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    // 데이터 검증
    const validatedData = performanceDataSchema.parse(body)

    // IP 기반 지리적 정보 추가 (선택적)
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // 데이터베이스에 저장
    const result = await db
      .insert(performanceMetrics)
      .values({
        url: validatedData.url,
        pageTitle: validatedData.pageTitle,
        userId: validatedData.userId,
        sessionId: validatedData.sessionId,
        lcp: validatedData.lcp,
        inp: validatedData.inp,
        cls: validatedData.cls,
        fcp: validatedData.fcp,
        ttfb: validatedData.ttfb,
        tti: validatedData.tti,
        domContentLoadedTime: validatedData.domContentLoadedTime,
        loadTime: validatedData.loadTime,
        firstPaintTime: validatedData.firstPaintTime,
        connectionType: validatedData.connectionType,
        effectiveType: validatedData.effectiveType,
        userAgent: validatedData.userAgent,
        deviceType: validatedData.deviceType,
        screenResolution: validatedData.screenResolution,
        viewport: validatedData.viewport,
        browserName: validatedData.browserName,
        browserVersion: validatedData.browserVersion,
        ip: clientIP,
        country: validatedData.country,
        region: validatedData.region,
      })
      .returning({ id: performanceMetrics.id })

    return NextResponse.json({
      success: true,
      id: result[0].id,
      message: 'Performance data saved successfully',
    })
  } catch (error) {
    console.error('Failed to save performance data:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data format',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// 성능 데이터 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 기본 쿼리
    const results = await db
      .select()
      .from(performanceMetrics)
      .orderBy(desc(performanceMetrics.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        limit,
        offset,
        count: results.length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch performance data:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch performance data',
      },
      { status: 500 }
    )
  }
}
