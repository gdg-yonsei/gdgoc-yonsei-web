import { z } from 'zod'
import { defineTool, idOf } from '@/lib/mcp/registry'
import {
  generationArg,
  imageUrl,
  listArgs,
  listPage,
  patchWith,
} from '@/lib/mcp/tools/common'
import {
  createProject,
  deleteProject,
  getProjectDetail,
  listProjects,
  projectToInput,
  updateProject,
} from '@/lib/server/services/admin/projects'

const projectId = z.string().uuid().describe('Project id.')

const projectFields = {
  name: z.string().describe('Project name in English.'),
  nameKo: z.string().describe('Project name in Korean.'),
  description: z.string().describe('One-line description in English.'),
  descriptionKo: z.string().describe('One-line description in Korean.'),
  content: z.string().describe('Body in English (Markdown).'),
  contentKo: z.string().describe('Body in Korean (Markdown).'),
  mainImage: imageUrl,
  contentImages: z.array(imageUrl).min(1),
  participantIds: z
    .array(z.string())
    .min(1)
    .describe('User ids of the project members.'),
  repoUrl: z.string().url().nullable(),
  demoUrl: z.string().url().nullable(),
  tags: z.array(z.string()).describe('Tech tags, e.g. ["Next.js"].'),
}

export const projectTools = [
  defineTool({
    name: 'list_projects',
    title: 'List projects',
    description: 'Lists projects, most recently updated first.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'projectsPage' }],
    input: z.object(listArgs),
    run: (actor, input) =>
      listPage(
        listProjects(actor, {
          generation: generationArg(actor, input.generationId),
        }),
        input.limit,
        input.cursor
      ),
  }),
  defineTool({
    name: 'get_project',
    title: 'Get project',
    description: 'Returns a project with its members and tags.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'projectsPage' }],
    input: z.object({ projectId }),
    run: (actor, input) => getProjectDetail(actor, input.projectId),
  }),
  defineTool({
    name: 'create_project',
    title: 'Create project',
    description: 'Creates a project in a generation you belong to.',
    scope: 'gyms:write',
    gate: [{ action: 'post', resource: 'projects' }],
    input: z.object({
      generationId: z.number().int().positive(),
      ...projectFields,
      repoUrl: projectFields.repoUrl.default(null),
      demoUrl: projectFields.demoUrl.default(null),
      tags: projectFields.tags.default([]),
    }),
    run: (actor, { generationId, participantIds, ...fields }) =>
      createProject(actor, {
        ...fields,
        generationId: String(generationId),
        participants: participantIds,
      }),
    targetId: idOf,
  }),
  defineTool({
    name: 'update_project',
    title: 'Update project',
    description:
      'Updates a project you wrote (or any project in your generation for CORE/LEAD). Send only the fields to change; list fields replace the current lists when given.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'projects' }],
    input: z.object({
      projectId,
      name: projectFields.name.optional(),
      nameKo: projectFields.nameKo.optional(),
      description: projectFields.description.optional(),
      descriptionKo: projectFields.descriptionKo.optional(),
      content: projectFields.content.optional(),
      contentKo: projectFields.contentKo.optional(),
      mainImage: projectFields.mainImage.optional(),
      contentImages: projectFields.contentImages.optional(),
      participantIds: projectFields.participantIds.optional(),
      repoUrl: projectFields.repoUrl.optional(),
      demoUrl: projectFields.demoUrl.optional(),
      tags: projectFields.tags.optional(),
    }),
    run: (actor, { projectId: id, participantIds, ...patch }) =>
      patchWith(
        getProjectDetail(actor, id),
        projectToInput,
        { ...patch, participants: participantIds },
        (input) => updateProject(actor, id, input)
      ),
    targetId: idOf,
  }),
  defineTool({
    name: 'delete_project',
    title: 'Delete project',
    description:
      'Deletes a project and its images (CORE/LEAD). This cannot be undone.',
    scope: 'gyms:admin',
    gate: [{ action: 'delete', resource: 'projects' }],
    input: z.object({ projectId }),
    run: (actor, input) => deleteProject(actor, input.projectId),
    targetId: idOf,
  }),
]
