import { z } from 'zod';

export const projectSchema = z.object({
    name: z.string().trim().min(1, 'Project name is required').max(50, 'Project name is too long'),
    description: z.string().trim().optional(),
    status: z.enum(['planning', 'active', 'completed', 'on-hold']).default('planning'),
    startDate: z.string().or(z.date()).optional().nullable(),
    endDate: z.string().or(z.date()).optional().nullable(),
});
