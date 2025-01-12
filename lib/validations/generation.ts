import { z } from 'zod'

export const generationValidation = z.object({
  name: z.string({ message: 'Name is required' }).nonempty('Name is required'),
  startDate: z.string().date('Invalid Start Date Format'),
  endDate: z.string().date('Invalid End Date Format').nullable(),
})
