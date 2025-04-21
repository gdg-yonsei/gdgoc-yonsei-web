import React, { memo, Suspense, useMemo } from 'react'

type LazyIconProps = {
  name: string
} & React.SVGProps<SVGSVGElement>

const LazyIcon = memo(function LazyIcon({ name, ...rest }: LazyIconProps) {
  const IconComponent = useMemo(
    () => React.lazy(() => import(`./${name}.svg?react`)),
    [name]
  )
  return (
    <Suspense
      fallback={<div className="h-full w-full animate-pulse bg-gray-100" />}
    >
      <IconComponent {...rest} />
    </Suspense>
  )
})

export default LazyIcon
