# Entity Image Upload Feature Design

**Date:** 2026-02-06
**Status:** Approved
**Author:** Design Session

## Overview

Add picture upload functionality to all entity types (stories, timelines, characters, locations). Each entity can have:

- One optional primary image
- Up to 6 optional gallery images
- Images stored in Cloudinary
- Display: primary as thumbnail, gallery in sidebar grid

## Requirements

- **Storage:** Cloudinary
- **Image Limits:**
  - Max file size: 2MB
  - Max dimensions: 1200x1200px
  - Formats: JPG, PNG only
  - Gallery limit: 6 images
- **UI Pattern:** Tailwind dropzone with button
- **Form Placement:** Bottom of creation/edit forms
- **Detail Display:** Primary thumbnail inline, gallery in sidebar
- **Theme Support:** Light/dark mode compatible

---

## 1. Database Schema

Add new `entity_images` table for all entity types:

```sql
CREATE TABLE entity_images (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('story', 'character', 'location', 'timeline')),
    entity_id INTEGER NOT NULL,
    cloudinary_public_id TEXT NOT NULL,
    cloudinary_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    file_name VARCHAR(255),
    file_size INTEGER, -- in bytes
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entity_images_lookup ON entity_images(entity_type, entity_id);
CREATE INDEX idx_entity_images_primary ON entity_images(entity_type, entity_id, is_primary);

-- Constraint: Only one primary image per entity
CREATE UNIQUE INDEX idx_entity_images_one_primary
    ON entity_images(entity_type, entity_id)
    WHERE is_primary = TRUE;
```

**Rationale:**

- Single table for all entities (DRY principle)
- `cloudinary_public_id` needed for deletion operations
- `display_order` allows reordering gallery images
- Unique index ensures only one primary image per entity
- No foreign key constraints since entity_id references different tables

---

## 2. Backend API & Cloudinary Integration

### Dependencies

```bash
npm install cloudinary next-cloudinary
```

### Environment Variables

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### API Endpoint: `/api/upload/image`

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Validation constants
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_DIMENSIONS = 1200
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png']
const MAX_GALLERY_SIZE = 6
```

### Database Queries (sqlc)

```sql
-- queries/entity_images.sql

-- name: GetEntityImages :many
SELECT * FROM entity_images
WHERE entity_type = $1 AND entity_id = $2
ORDER BY is_primary DESC, display_order ASC;

-- name: CreateEntityImage :one
INSERT INTO entity_images (
  entity_type, entity_id, cloudinary_public_id,
  cloudinary_url, is_primary, display_order,
  file_name, file_size, width, height
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: DeleteEntityImage :exec
DELETE FROM entity_images WHERE id = $1;

-- name: SetPrimaryImage :exec
UPDATE entity_images
SET is_primary = (id = $2)
WHERE entity_type = $1 AND entity_id = $3;

-- name: UpdateImageOrder :exec
UPDATE entity_images
SET display_order = $2
WHERE id = $1;
```

### Upload Flow

1. Frontend validates file (size, format, dimensions)
2. POST to `/api/upload/image` with file + metadata
3. Server validates again, uploads to Cloudinary
4. Server stores metadata in `entity_images` table
5. Return image data to frontend

---

## 3. Frontend Upload Component

### Component Interface

```typescript
// components/ImageUpload/ImageUpload.tsx

interface EntityImage {
  id: number
  cloudinary_url: string
  cloudinary_public_id: string
  is_primary: boolean
  display_order: number
  file_name: string
  file_size: number
  width: number
  height: number
}

interface ImageUploadProps {
  existingImages: EntityImage[]
  onUpload: (file: File, isPrimary: boolean) => Promise<void>
  onDelete: (imageId: number) => Promise<void>
  onSetPrimary: (imageId: number) => Promise<void>
  maxImages: number // 7 total (1 primary + 6 gallery)
  disabled?: boolean
  theme?: string
}
```

### Primary Image Dropzone

```jsx
{
  !primaryImage ? (
    <div className="flex w-full items-center justify-center">
      <div className="bg-neutral-secondary-medium dark:bg-neutral-secondary-dark border-default-strong dark:border-default-medium rounded-base flex h-64 w-full flex-col items-center justify-center border border-dashed">
        <div className="text-body flex flex-col items-center justify-center pb-6 pt-5">
          <svg
            className="mb-4 h-8 w-8"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 5v9m-5 0H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2M8 9l4-5 4 5m1 8h.01"
            />
          </svg>
          <p className="text-default dark:text-default-dark mb-2 text-sm">
            Drop primary image or click below
          </p>
          <p className="text-muted dark:text-muted-dark mb-4 text-xs">
            Max Size: <span className="font-semibold">2MB</span> (PNG, JPG only)
          </p>
          <button
            type="button"
            onClick={() => primaryInputRef.current?.click()}
            className="bg-brand hover:bg-brand-strong focus:ring-brand-medium shadow-xs rounded-base inline-flex items-center border border-transparent px-3 py-2 text-sm font-medium leading-5 text-white focus:outline-none focus:ring-4"
          >
            Browse file
          </button>
        </div>
      </div>
      <input
        ref={primaryInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png"
        onChange={handlePrimaryUpload}
      />
    </div>
  ) : (
    <div className="border-default rounded-base flex items-center gap-4 border p-4">
      <img
        src={primaryImage.cloudinary_url}
        alt="Primary"
        className="h-24 w-24 rounded object-cover"
      />
      <div className="flex gap-2">
        <button onClick={() => primaryInputRef.current?.click()}>Change</button>
        <button onClick={() => onDelete(primaryImage.id)}>Remove</button>
      </div>
    </div>
  )
}
```

### Gallery Dropzone

Similar pattern but:

- Smaller height (h-48)
- `multiple` attribute on input
- Text: "Add gallery images (up to 6)"
- Grid display of existing thumbnails above dropzone

### Client-side Validation

```typescript
const validateImage = async (
  file: File,
): Promise<{ valid: boolean; error?: string }> => {
  // 1. Check file type
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    return { valid: false, error: 'Only JPG and PNG files are allowed' }
  }

  // 2. Check file size
  if (file.size > 2 * 1024 * 1024) {
    return { valid: false, error: 'File size must be under 2MB' }
  }

  // 3. Check dimensions
  const dimensions = await getImageDimensions(file)
  if (dimensions.width > 1200 || dimensions.height > 1200) {
    return {
      valid: false,
      error: 'Image dimensions must be 1200x1200px or smaller',
    }
  }

  // 4. Check gallery limit
  if (!isPrimary && galleryImages.length >= 6) {
    return { valid: false, error: 'Maximum 6 gallery images allowed' }
  }

  return { valid: true }
}

const getImageDimensions = (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
```

---

## 4. Form Integration & Detail Screen Display

### Form Integration

Add `ImageUpload` component at bottom of edit modals:

- `EditStoryModal.tsx`
- `EditCharacterModal.tsx`
- `EditLocationModal.tsx`
- `EditTimelineModal.tsx`

```jsx
// Inside FormWrapper, after content field:

<FormField>
  <Label $theme={theme}>Images (Optional)</Label>
  <ImageUpload
    existingImages={formData.images}
    onUpload={handleImageUpload}
    onDelete={handleImageDelete}
    onSetPrimary={handleSetPrimary}
    maxImages={7}
    theme={theme}
  />
</FormField>
```

### Detail Screen Display

Update entity detail components:

```jsx
<div className="flex gap-6">
  {/* Main content area */}
  <div className="flex-1">
    <h1 className="text-2xl font-bold">{entity.title}</h1>

    {/* Primary image thumbnail - inline with content */}
    {primaryImage && (
      <img
        src={primaryImage.cloudinary_url}
        alt={entity.title}
        className="mt-4 h-24 w-24 cursor-pointer rounded-lg object-cover hover:opacity-80"
        onClick={() => openLightbox(primaryImage)}
      />
    )}

    <div className="prose dark:prose-invert mt-4">{entity.content}</div>
  </div>

  {/* Sidebar gallery */}
  {galleryImages.length > 0 && (
    <aside className="w-64">
      <h3 className="text-default dark:text-default-dark mb-3 text-sm font-semibold">
        Gallery
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {galleryImages.map((img) => (
          <img
            key={img.id}
            src={img.cloudinary_url}
            alt={`Gallery image ${img.display_order}`}
            className="aspect-square w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
            onClick={() => openLightbox(img)}
          />
        ))}
      </div>
    </aside>
  )}
</div>
```

### Lightbox (Optional Enhancement)

Consider adding a lightbox modal for full-size image viewing:

- Click any image to open
- Arrow keys to navigate gallery
- ESC to close
- Shows image metadata (filename, dimensions)

---

## 5. Error Handling & Validation

### Server-side Validation

```typescript
// API endpoint validation
async function validateUpload(file: File) {
  // Re-validate all client checks
  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error('Invalid file format')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }

  // Check dimensions after upload to Cloudinary
  // Cloudinary returns width/height in response
}
```

### Error States & User Feedback

- **Upload failed:** Toast notification with specific error
- **Network error:** Retry button on failed uploads
- **Validation error:** Show error below dropzone, red border
- **Cloudinary error:** Generic "Upload service unavailable" message

### Edge Cases

1. **User uploads new primary when one exists:**

   - Old primary becomes gallery image
   - New image becomes primary

2. **User deletes primary when gallery exists:**

   - Show modal: "Set a gallery image as primary?" with gallery thumbnails
   - User selects one or chooses "No primary image"

3. **Upload fails:**

   - Don't block form submission
   - Images are optional
   - Show error state but allow retry

4. **User navigates away during upload:**

   - Cancel in-flight uploads
   - Show warning: "Upload in progress will be cancelled"

5. **Gallery full (6 images):**
   - Disable "Add gallery images" dropzone
   - Show message: "Gallery full (6/6)"

---

## 6. Testing Strategy

### Unit Tests

```typescript
// ImageUpload.test.tsx
describe('ImageUpload Component', () => {
  it('validates file type correctly', async () => {
    const gifFile = new File([''], 'test.gif', { type: 'image/gif' })
    const result = await validateImage(gifFile)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('JPG and PNG')
  })

  it('validates file size limit', async () => {
    const largeFile = new File(
      [new ArrayBuffer(3 * 1024 * 1024)],
      'large.jpg',
      { type: 'image/jpeg' },
    )
    const result = await validateImage(largeFile)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('2MB')
  })

  it('validates image dimensions', async () => {
    // Create mock image with dimensions > 1200x1200
    // Expect validation failure
  })

  it('enforces gallery limit of 6 images', () => {
    const existingImages = Array(6)
      .fill({})
      .map((_, i) => ({
        id: i,
        is_primary: false,
        display_order: i,
      }))
    // Try to add 7th image
    // Expect error
  })

  it('allows only one primary image', async () => {
    // Upload primary image
    // Upload another as primary
    // Verify first becomes gallery image
  })
})
```

### Integration Tests

```typescript
// API endpoint tests
describe('POST /api/upload/image', () => {
  it('uploads valid image to Cloudinary', async () => {
    const mockUpload = jest.spyOn(cloudinary.uploader, 'upload')
    mockUpload.mockResolvedValue({
      public_id: 'test-id',
      secure_url: 'https://cloudinary.com/test.jpg',
      width: 800,
      height: 600,
    })

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(true)
    expect(mockUpload).toHaveBeenCalled()
  })

  it('rejects oversized files', async () => {
    // Test with 3MB file
    // Expect 400 error
  })

  it('handles Cloudinary failures gracefully', async () => {
    const mockUpload = jest.spyOn(cloudinary.uploader, 'upload')
    mockUpload.mockRejectedValue(new Error('Cloudinary error'))

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })

    expect(response.status).toBe(500)
  })
})
```

### E2E Tests (Playwright)

```typescript
test('user can upload primary image to story', async ({ page }) => {
  await page.goto('/user-id/stories/story-id?edit=true')

  // Click edit button
  await page.click('[data-testid="edit-button"]')

  // Upload primary image
  await page.setInputFiles(
    '#primary-image-input',
    'test-fixtures/test-image.jpg',
  )

  // Wait for upload
  await page.waitForSelector('[data-testid="primary-thumbnail"]')

  // Save form
  await page.click('[data-testid="save-button"]')

  // Verify image appears on detail screen
  await expect(page.locator('[data-testid="primary-thumbnail"]')).toBeVisible()
})

test('user can upload gallery images', async ({ page }) => {
  await page.goto('/user-id/stories/story-id?edit=true')

  // Upload multiple gallery images
  await page.setInputFiles('#gallery-images-input', [
    'test-fixtures/gallery-1.jpg',
    'test-fixtures/gallery-2.jpg',
    'test-fixtures/gallery-3.jpg',
  ])

  // Wait for all uploads
  await page.waitForSelector('[data-testid="gallery-thumbnail-0"]')
  await page.waitForSelector('[data-testid="gallery-thumbnail-1"]')
  await page.waitForSelector('[data-testid="gallery-thumbnail-2"]')

  await page.click('[data-testid="save-button"]')

  // Verify gallery appears on detail screen
  await expect(page.locator('[data-testid="gallery-grid"]')).toBeVisible()
  await expect(page.locator('[data-testid="gallery-thumbnail"]')).toHaveCount(3)
})

test('user can set gallery image as primary', async ({ page }) => {
  await page.goto('/user-id/stories/story-id?edit=true')

  // Upload primary + gallery images
  await page.setInputFiles('#primary-image-input', 'test-fixtures/primary.jpg')
  await page.setInputFiles('#gallery-images-input', [
    'test-fixtures/gallery-1.jpg',
  ])

  // Click "Set as Primary" on gallery image
  await page.hover('[data-testid="gallery-thumbnail-0"]')
  await page.click('[data-testid="set-as-primary-0"]')

  // Verify images swapped
  const newPrimary = await page
    .locator('[data-testid="primary-thumbnail"]')
    .getAttribute('src')
  expect(newPrimary).toContain('gallery-1.jpg')
})

test('respects gallery limit of 6 images', async ({ page }) => {
  await page.goto('/user-id/stories/story-id?edit=true')

  // Upload 6 gallery images
  await page.setInputFiles('#gallery-images-input', [
    'test-fixtures/gallery-1.jpg',
    'test-fixtures/gallery-2.jpg',
    'test-fixtures/gallery-3.jpg',
    'test-fixtures/gallery-4.jpg',
    'test-fixtures/gallery-5.jpg',
    'test-fixtures/gallery-6.jpg',
  ])

  // Verify dropzone is disabled
  await expect(page.locator('[data-testid="gallery-dropzone"]')).toBeDisabled()
  await expect(page.locator('text=Gallery full (6/6)')).toBeVisible()
})
```

### Manual Testing Checklist

- [ ] Upload works in both light/dark mode
- [ ] Drag-and-drop works on Chrome, Firefox, Safari
- [ ] Image thumbnails display correctly
- [ ] Delete action removes image from UI and database
- [ ] Set primary action moves images correctly
- [ ] Form submission includes image data
- [ ] Detail screen shows primary thumbnail inline
- [ ] Detail screen shows gallery in sidebar grid
- [ ] Responsive layout works on mobile (gallery stacks below)
- [ ] Lightbox opens and navigates correctly
- [ ] Error messages are clear and helpful
- [ ] Loading states show during upload
- [ ] Retry works after failed upload

---

## Implementation Phases

### Phase 1: Database & API (Backend)

1. Create `entity_images` table migration
2. Add sqlc queries for image CRUD
3. Set up Cloudinary configuration
4. Create `/api/upload/image` endpoint with validation
5. Create `/api/delete/image` endpoint
6. Write unit tests for API endpoints

### Phase 2: Upload Component (Frontend)

1. Create `ImageUpload` component with dropzone UI
2. Implement client-side validation
3. Add drag-and-drop handlers
4. Implement upload progress indicators
5. Add error state displays
6. Write component unit tests

### Phase 3: Form Integration

1. Update form data types to include images
2. Add `ImageUpload` to all edit modals (stories, characters, locations, timelines)
3. Wire up upload/delete/set-primary handlers
4. Test form submission with images

### Phase 4: Detail Screen Display

1. Update detail screen queries to fetch images
2. Add primary thumbnail display
3. Add gallery sidebar grid
4. Implement lightbox modal (optional)
5. Test responsive layouts

### Phase 5: E2E Testing & Polish

1. Write Playwright E2E tests
2. Manual testing across browsers/devices
3. Performance optimization (lazy loading, thumbnails)
4. Accessibility audit (alt text, keyboard navigation)
5. Dark/light mode verification

---

## Future Enhancements (Not in Scope)

- Image reordering via drag-and-drop
- Bulk upload (select multiple files at once)
- Image editing/cropping before upload
- AI-generated alt text
- Image search/filter in gallery
- Share individual images
- Image metadata display (EXIF data, upload date)
- Cloudinary transformations (filters, effects)
