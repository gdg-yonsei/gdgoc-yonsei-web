import { NextRequest, NextResponse } from 'next/server'
import db from '@/db'
import { performanceMetrics } from '@/db/schema/performance-metrics'
import { sql, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // 날짜 범위 계산
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Date를 ISO 문자열로 변환
    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()

    // 기본 통계 쿼리
    const summaryResult = await db
      .select({
        avgLcp: sql<number>`AVG(${performanceMetrics.lcp})`.as('avg_lcp'),
        avgInp: sql<number>`AVG(${performanceMetrics.inp})`.as('avg_inp'),
        avgCls: sql<number>`AVG(${performanceMetrics.cls})`.as('avg_cls'),
        avgFcp: sql<number>`AVG(${performanceMetrics.fcp})`.as('avg_fcp'),
        avgTtfb: sql<number>`AVG(${performanceMetrics.ttfb})`.as('avg_ttfb'),
        avgLoadTime: sql<number>`AVG(${performanceMetrics.loadTime})`.as(
          'avg_load_time'
        ),
        sampleCount: sql<number>`COUNT(*)`.as('sample_count'),
      })
      .from(performanceMetrics)
      .where(sql`${performanceMetrics.createdAt} >= ${startDateStr}`)

    // 디바이스별 분석
    const deviceStats = await db
      .select({
        deviceType: performanceMetrics.deviceType,
        avgLcp: sql<number>`AVG(${performanceMetrics.lcp})`.as('avg_lcp'),
        avgFcp: sql<number>`AVG(${performanceMetrics.fcp})`.as('avg_fcp'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(performanceMetrics)
      .where(sql`${performanceMetrics.createdAt} >= ${startDateStr}`)
      .groupBy(performanceMetrics.deviceType)

    // 브라우저별 분석
    const browserStats = await db
      .select({
        browserName: performanceMetrics.browserName,
        avgLcp: sql<number>`AVG(${performanceMetrics.lcp})`.as('avg_lcp'),
        avgFcp: sql<number>`AVG(${performanceMetrics.fcp})`.as('avg_fcp'),
        count: sql<number>`COUNT(*)`.as('count'),
      })
      .from(performanceMetrics)
      .where(sql`${performanceMetrics.createdAt} >= ${startDateStr}`)
      .groupBy(performanceMetrics.browserName)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5)

    // 최근 성능 데이터 (최신 50개)
    const recentMetrics = await db
      .select()
      .from(performanceMetrics)
      .orderBy(desc(performanceMetrics.createdAt))
      .limit(50)

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryResult[0] || null,
        deviceStats,
        browserStats,
        recentMetrics,
        dateRange: {
          startDate: startDateStr,
          endDate: endDateStr,
          days,
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch performance summary:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch performance summary',
      },
      { status: 500 }
    )
  }
}
