import { z } from 'zod';

export const taskSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
    description: z.string().trim().optional(),
    status: z.enum(['todo', 'in-progress', 'done', 'blocked']).default('todo'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    due_date: z.string().or(z.date()).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
});
