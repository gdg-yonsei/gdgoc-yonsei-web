'use client'

import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

/**
 * `ImageSliderGallery` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`images`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default function ImageSliderGallery({ images }: { images: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])

  // Intersection Observer 설정
  useEffect(() => {
    const observerOptions = {
      root: scrollRef.current,
      threshold: 0.5, // 이미지의 50% 이상이 보일 때 활성화
      rootMargin: '0px',
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const targetIndex = imageRefs.current.findIndex(
            (ref) => ref === entry.target
          )
          if (targetIndex !== -1) {
            setCurrentImageIndex(targetIndex)
          }
        }
      })
    }, observerOptions)

    // 각 이미지 관찰 시작
    imageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => {
      observer.disconnect()
    }
  }, [images])

  /**
   * `handlePreviewImageClick` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`previewIndex`, `number`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  function handlePreviewImageClick(previewIndex: number) {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount =
        scrollRef.current.clientWidth * (currentImageIndex - previewIndex) // 이동 거리 (픽셀 단위)
      setCurrentImageIndex(previewIndex)

      current.scrollTo({
        left: current.scrollLeft - scrollAmount,
        behavior: 'smooth', // 스크롤 애니메이션 추가
      })
    }
  }

  /**
   * `scrollByDirection` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`direction`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
  const scrollByDirection = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = scrollRef.current.clientWidth // 이동 거리 (픽셀 단위)

      if (direction === 'left') {
        if (currentImageIndex !== 0) {
          setCurrentImageIndex((prev) => prev - 1)
        }
      } else {
        if (currentImageIndex !== images.length - 1) {
          setCurrentImageIndex((prev) => prev + 1)
        }
      }

      current.scrollTo({
        left:
          direction === 'left'
            ? current.scrollLeft - scrollAmount
            : current.scrollLeft + scrollAmount,
        behavior: 'smooth', // 스크롤 애니메이션 추가
      })
    }
  }

  return (
    <div
      className={
        'flex w-full flex-col items-center md:flex-row md:items-start md:justify-center'
      }
      ref={boxRef}
    >
      {/*Images*/}
      <div
        className="flex w-full max-w-xl min-w-0 snap-x snap-mandatory overflow-x-scroll bg-neutral-100 whitespace-nowrap transition-all"
        ref={scrollRef}
      >
        {images.map((image, i) => (
          <div
            key={i}
            ref={(el) => {
              imageRefs.current[i] = el
            }}
            className="relative w-full flex-shrink-0 snap-center"
            style={{ paddingTop: '100%' }}
          >
            <Image
              src={image}
              alt=""
              fill
              className="absolute top-0 left-0 h-full w-full object-contain"
            />
          </div>
        ))}
      </div>
      <div className={'w-full max-w-xl md:w-24'}>
        {/*Image Control Button Group*/}
        <div className={'flex w-full items-center justify-between p-2 md:w-28'}>
          <button
            type={'button'}
            onClick={() => scrollByDirection('left')}
            className={
              'rounded-full p-1 transition-colors hover:bg-neutral-100'
            }
          >
            <ChevronLeftIcon className={'size-8'} />
          </button>
          <button
            type={'button'}
            onClick={() => scrollByDirection('right')}
            className={
              'rounded-full p-1 transition-colors hover:bg-neutral-100'
            }
          >
            <ChevronRightIcon className={'size-8'} />
          </button>
        </div>
        {/*Image Preview*/}
        <div
          className={
            'flex gap-2 overflow-x-scroll p-2 whitespace-nowrap md:h-[528px] md:w-28 md:flex-col md:overflow-y-scroll'
          }
        >
          {images.map((image, i) => (
            <Image
              key={i}
              src={image}
              alt={'Preview'}
              width={100}
              height={100}
              className={`aspect-square size-24 rounded-lg object-cover transition-all ${currentImageIndex === i && 'brightness-50 grayscale'}`}
              onClick={() => handlePreviewImageClick(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
