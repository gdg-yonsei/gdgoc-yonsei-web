/** next/image 런타임의 중복 전송을 피하려고 getImageProps의 내부 모듈을 직접 쓴다.
 * static-image 테스트로 출력 일치를 확인하며, Next 업그레이드 때 내부 import 경로를 점검한다. */
import {
  getImgProps,
  type ImageProps,
} from 'next/dist/shared/lib/get-img-props'
import defaultLoader from 'next/dist/shared/lib/image-loader'

export default function StaticImage(props: ImageProps) {
  const { props: imgProps } = getImgProps(props, {
    defaultLoader,
    // next/image와 마찬가지로 빌드 시 `images` 설정 값으로 치환된다.
    imgConf: process.env.__NEXT_IMAGE_OPTS as never,
  })
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt는 getImgProps가 넣는다
  return <img {...imgProps} />
}
