/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug (e.g., title or name)
 * @param suffix - Optional suffix to append for uniqueness
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string, suffix?: string | number): string {
  // Convert to lowercase
  let slug = text.toLowerCase()

  // Replace special characters with empty string
  slug = slug.replace(/[^a-z0-9\s-]/g, '')

  // Replace whitespace with hyphens
  slug = slug.replace(/\s+/g, '-')

  // Remove multiple consecutive hyphens
  slug = slug.replace(/-+/g, '-')

  // Remove leading and trailing hyphens
  slug = slug.replace(/^-|-$/g, '')

  // Truncate to reasonable length (max 50 chars for the text part)
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-$/, '')
  }

  // Append suffix for uniqueness if provided
  if (suffix !== undefined) {
    slug = `${slug}-${suffix}`
  }

  return slug || 'untitled'
}

/**
 * Generate a unique slug by checking the database for existing slugs
 * @param text - The text to convert to a slug
 * @param checkExists - Async function that returns true if slug already exists
 * @returns A unique URL-friendly slug
 */
export async function generateUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(text)

  // Check if base slug is available
  const exists = await checkExists(baseSlug)
  if (!exists) {
    return baseSlug
  }

  // If base slug exists, try with incrementing numbers
  let counter = 2
  while (counter <= 100) {
    const candidateSlug = `${baseSlug}-${counter}`
    const candidateExists = await checkExists(candidateSlug)
    if (!candidateExists) {
      return candidateSlug
    }
    counter++
  }

  // Fallback: use timestamp if we somehow have 100+ duplicates
  const timestamp = Date.now().toString(36)
  return `${baseSlug}-${timestamp}`
}
