/**
 * 성능 측정·즉시 이동 검증에서 쓸 대표 공개 경로를 찾는다.
 */

/** 기수 허브에서 상세 페이지가 있는 첫 기수를 찾는다. 빈 기수는 건너뛴다. */
export async function firstGenerationWithDetail(page, baseURL, indexPath) {
  await page.goto(new URL(indexPath, baseURL).href, {
    waitUntil: 'domcontentloaded',
  })
  const generationLinks = await page
    .locator(`a[href^="${indexPath}/"]`)
    .evaluateAll((links) => [
      ...new Set(
        links.map((link) => link.getAttribute('href')).filter(Boolean)
      ),
    ])

  for (const generation of generationLinks) {
    await page.goto(new URL(generation, baseURL).href, {
      waitUntil: 'domcontentloaded',
    })
    const detailLink = page.locator(`a[href^="${generation}/"]`).first()
    if ((await detailLink.count()) > 0) {
      return {
        detail: await detailLink.getAttribute('href'),
        generation,
      }
    }
  }

  throw new Error(`No detail route is available below ${indexPath}`)
}
