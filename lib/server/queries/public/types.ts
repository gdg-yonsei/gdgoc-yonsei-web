import type { InferSelectModel } from 'drizzle-orm'
import type { generations } from '@/db/schema/generations'
import type { projects } from '@/db/schema/projects'
import type { sessions } from '@/db/schema/sessions'
import type { users } from '@/db/schema/users'

/** Lightweight generation summary used in index/list views */
export type GenerationSummaryDTO = Pick<
  InferSelectModel<typeof generations>,
  'id' | 'name' | 'startDate' | 'endDate'
>

/** Full generation record */
export type GenerationDTO = InferSelectModel<typeof generations>

/** Project with its generation relation */
export type ProjectListItemDTO = InferSelectModel<typeof projects> & {
  generation: GenerationDTO
}

/** Project detail with participants */
export type ProjectDetailDTO = InferSelectModel<typeof projects> & {
  generation: GenerationDTO
  usersToProjects: {
    user: InferSelectModel<typeof users>
  }[]
}

/** Published session row from the select query */
export type SessionListItemDTO = Pick<
  InferSelectModel<typeof sessions>,
  | 'id'
  | 'name'
  | 'nameKo'
  | 'description'
  | 'descriptionKo'
  | 'mainImage'
  | 'images'
  | 'internalOpen'
  | 'publicOpen'
  | 'maxCapacity'
  | 'location'
  | 'locationKo'
  | 'type'
  | 'displayOnWebsite'
  | 'startAt'
  | 'endAt'
  | 'createdAt'
  | 'updatedAt'
>

/** Full session detail */
export type SessionDetailDTO = InferSelectModel<typeof sessions>

/** User (member) record */
export type MemberDTO = InferSelectModel<typeof users>
