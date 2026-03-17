export interface CanUserViewEntityArgs {
  viewerId?: string
  ownerId: string
  privacy: 'public' | 'private'
}

export default function canUserViewEntity({
  viewerId,
  ownerId,
  privacy,
}: CanUserViewEntityArgs): boolean {
  if (viewerId === ownerId) {
    return true
  }

  if (privacy === 'public') {
    return true
  }

  return false
}
