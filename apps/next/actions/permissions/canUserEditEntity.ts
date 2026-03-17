export interface CanUserEditEntityArgs {
  userId?: string
  ownerId: string
}

export default function canUserEditEntity({
  userId,
  ownerId,
}: CanUserEditEntityArgs): boolean {
  return userId === ownerId
}
