import { z } from 'zod'

export const LinkCharacterToCharacterSchema = z.object({
  characterId: z.number().int().positive(),
  targetCharacterId: z.number().int().positive(),
  relationshipType: z
    .enum([
      'parent',
      'child',
      'sibling',
      'spouse',
      'grandparent',
      'grandchild',
      'aunt_uncle',
      'niece_nephew',
      'cousin',
      'custom',
    ])
    .default('custom'),
  customLabel: z.string().max(100).trim().optional().nullable(),
})

export type LinkCharacterToCharacterInput = z.infer<
  typeof LinkCharacterToCharacterSchema
>
