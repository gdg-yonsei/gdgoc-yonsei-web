import { revalidateTag } from 'next/cache'

export type TagType =
  | 'sessions'
  | 'projects'
  | 'members'
  | 'generations'
  | 'parts'

export function revalidateCache(tagList: TagType[] | TagType) {
  if (typeof tagList === 'string') {
    return revalidateTag(tagList)
  }
  for (const tag of tagList) {
    revalidateTag(tag)
  }
  return
}
