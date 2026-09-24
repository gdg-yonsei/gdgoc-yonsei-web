// The two modules `next/image`'s getImageProps is built from. Importing
// `next/image` itself references its client component, and the hubs are
// prefetched from the header on every page, so that shipped a second copy of
// the image runtime site-wide (tests/components/static-image.test.tsx pins
// that the output matches getImageProps).
import {
  getImgProps,
  type ImageProps,
} from 'next/dist/shared/lib/get-img-props'
import defaultLoader from 'next/dist/shared/lib/image-loader'

/**
 * An optimized `<img>` rendered on the server, for plain non-interactive
 * images in server components.
 */
export default function StaticImage(props: ImageProps) {
  const { props: imgProps } = getImgProps(props, {
    defaultLoader,
    // Replaced at build time with the `images` config, as in next/image.
    imgConf: process.env.__NEXT_IMAGE_OPTS as never,
  })
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt comes from getImgProps
  return <img {...imgProps} />
}
