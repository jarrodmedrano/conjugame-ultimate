'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { Label } from '@repo/ui/components/ui/label'
import { Button } from '@repo/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { GenerateEntityForm } from '../shared/components/GenerateEntityForm'
import type { GenerateEntityResponse } from '../../../../apps/next/lib/ai/types'
import { ImageUpload } from '../../components/ImageUpload'
import type { EntityImage } from '../../types/entity-image'

interface Story {
  id: number
  title: string
}

interface CreateScreenProps {
  listEntitiesForUser?: unknown
  params?: { slug?: string }
  stories?: Story[]
  userId?: string
  username?: string
  hasApiKey?: boolean
}

type EntityType = 'stories' | 'characters' | 'locations' | 'timelines'

interface StoryFormData {
  title: string
  content: string
}

interface EntityFormData {
  name: string
  description: string
  storyId?: string
}

const entityConfig: Record<
  EntityType,
  {
    title: string
    description: string
    apiEndpoint: string
    fields: 'story' | 'entity'
  }
> = {
  stories: {
    title: 'Create a New Story',
    description: 'Add a new story to your collection',
    apiEndpoint: '/api/story',
    fields: 'story',
  },
  characters: {
    title: 'Create a New Character',
    description: 'Add a new character to your story bible',
    apiEndpoint: '/api/character',
    fields: 'entity',
  },
  locations: {
    title: 'Create a New Location',
    description: 'Add a new location to your world',
    apiEndpoint: '/api/location',
    fields: 'entity',
  },
  timelines: {
    title: 'Create a New Timeline',
    description: 'Add a new timeline to track events',
    apiEndpoint: '/api/timeline',
    fields: 'entity',
  },
}

const entityTypeSingular: Record<
  EntityType,
  'story' | 'character' | 'location' | 'timeline'
> = {
  stories: 'story',
  characters: 'character',
  locations: 'location',
  timelines: 'timeline',
}

function StoryForm({
  onSubmit,
  isSubmitting,
  stories,
  hasApiKey,
  userId,
}: {
  onSubmit: (data: StoryFormData) => void
  isSubmitting: boolean
  stories?: Story[]
  hasApiKey: boolean
  userId?: string
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StoryFormData>()

  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [mentionedCharacters, setMentionedCharacters] = useState<string[]>([])

  const handleGenerated = (result: GenerateEntityResponse) => {
    setValue('title', result.name)
    setValue('content', result.description)
    setMentionedCharacters(result.mentionedCharacters)
    setIsGenerateMode(false)
  }

  if (isGenerateMode) {
    return (
      <GenerateEntityForm
        entityType="story"
        stories={stories}
        hasApiKey={hasApiKey}
        userId={userId}
        onGenerated={handleGenerated}
        onCancel={() => setIsGenerateMode(false)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsGenerateMode(true)}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          Generate with AI
        </Button>
      </div>

      {mentionedCharacters.length > 0 && (
        <div className="bg-muted rounded-md p-3 text-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            AI mentioned existing characters:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mentionedCharacters.map((name) => (
              <span
                key={name}
                className="bg-background border-border rounded border px-2 py-0.5 text-xs"
                title={name}
              >
                {name.length > 20 ? `${name.slice(0, 20)}…` : name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter story title"
          {...register('title', { required: 'Title is required' })}
          aria-invalid={errors.title ? 'true' : 'false'}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          placeholder="Write your story content..."
          rows={8}
          {...register('content', { required: 'Content is required' })}
          aria-invalid={errors.content ? 'true' : 'false'}
        />
        {errors.content && (
          <p className="text-destructive text-sm">{errors.content.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Story'}
      </Button>
    </form>
  )
}

function EntityForm({
  entityType,
  onSubmit,
  isSubmitting,
  stories = [],
  hasApiKey,
  userId,
}: {
  entityType: string
  onSubmit: (data: EntityFormData) => void
  isSubmitting: boolean
  stories?: Story[]
  hasApiKey: boolean
  userId?: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EntityFormData>()

  const [isGenerateMode, setIsGenerateMode] = useState(false)
  const [mentionedCharacters, setMentionedCharacters] = useState<string[]>([])

  const singularName = entityType.slice(0, -1)
  const selectedStoryId = watch('storyId')
  const aiEntityType = singularName as 'character' | 'location' | 'timeline'

  const handleGenerated = (result: GenerateEntityResponse) => {
    setValue('name', result.name)
    setValue('description', result.description)
    setMentionedCharacters(result.mentionedCharacters)
    setIsGenerateMode(false)
  }

  if (isGenerateMode) {
    return (
      <GenerateEntityForm
        entityType={aiEntityType}
        stories={stories}
        defaultStoryId={selectedStoryId ? Number(selectedStoryId) : undefined}
        hasApiKey={hasApiKey}
        userId={userId}
        onGenerated={handleGenerated}
        onCancel={() => setIsGenerateMode(false)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsGenerateMode(true)}
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          Generate with AI
        </Button>
      </div>

      {mentionedCharacters.length > 0 && (
        <div className="bg-muted rounded-md p-3 text-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            AI referenced existing characters:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mentionedCharacters.map((name) => (
              <span
                key={name}
                className="bg-background border-border rounded border px-2 py-0.5 text-xs"
                title={name}
              >
                {name.length > 20 ? `${name.slice(0, 20)}…` : name}
              </span>
            ))}
          </div>
        </div>
      )}

      {stories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="storyId">Associate with Story (optional)</Label>
          <Select
            value={selectedStoryId || ''}
            onValueChange={(value) => setValue('storyId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a story..." />
            </SelectTrigger>
            <SelectContent>
              {stories.map((story) => (
                <SelectItem key={story.id} value={String(story.id)}>
                  {story.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">
            Link this {singularName} to an existing story
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder={`Enter ${singularName} name`}
          {...register('name', { required: 'Name is required' })}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder={`Describe this ${singularName}...`}
          rows={6}
          {...register('description')}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : `Create ${singularName}`}
      </Button>
    </form>
  )
}

const CreateScreen = function (props: CreateScreenProps) {
  const router = useRouter()
  const { params, stories = [], userId, username, hasApiKey = false } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  const [createdEntity, setCreatedEntity] = useState<{
    id: number
    slug: string
    name: string
    description: string
    entityType: EntityType
  } | null>(null)
  const [createdEntityImages, setCreatedEntityImages] = useState<EntityImage[]>(
    [],
  )

  const entityType = (params?.slug as EntityType) || 'stories'
  const config = entityConfig[entityType] || entityConfig.stories

  const handleStorySubmit = async (data: StoryFormData) => {
    setIsSubmitting(true)
    setError(null)
    setUpgradeRequired(false)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.upgradeRequired) setUpgradeRequired(true)
        throw new Error(errorData.error || 'Failed to create')
      }

      const createdStory = await response.json()
      router.refresh()
      setCreatedEntity({
        id: createdStory.id,
        slug: createdStory.slug || String(createdStory.id),
        name: createdStory.title,
        description: createdStory.content ?? '',
        entityType: 'stories',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEntitySubmit = async (data: EntityFormData) => {
    setIsSubmitting(true)
    setError(null)
    setUpgradeRequired(false)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.upgradeRequired) setUpgradeRequired(true)
        throw new Error(errorData.error || 'Failed to create')
      }

      const created = await response.json()
      router.refresh()
      setCreatedEntity({
        id: created.id,
        slug: created.slug || String(created.id),
        name: created.name,
        description: created.description ?? '',
        entityType: entityType,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (file: File, isPrimary: boolean) => {
    if (!createdEntity) return
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append(
      'entityType',
      entityTypeSingular[createdEntity.entityType],
    )
    uploadFormData.append('entityId', String(createdEntity.id))
    uploadFormData.append('isPrimary', String(isPrimary))
    uploadFormData.append(
      'displayOrder',
      String(createdEntityImages.filter((i) => !i.isPrimary).length),
    )

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: uploadFormData,
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Upload failed')
    }
    const data = await response.json()
    setCreatedEntityImages((prev) => [...prev, data.image])
  }

  const handleImageDelete = async (imageId: number) => {
    if (!createdEntity) return
    await fetch(`/api/delete/image?id=${imageId}`, {
      method: 'DELETE',
    })
    setCreatedEntityImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleSetPrimary = async (imageId: number) => {
    if (!createdEntity) return
    await fetch('/api/upload/image/set-primary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId,
        entityType: entityTypeSingular[createdEntity.entityType],
        entityId: createdEntity.id,
      }),
    })
    setCreatedEntityImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === imageId })),
    )
  }

  const handleImageGenerated = (image: EntityImage) => {
    setCreatedEntityImages((prev) => [...prev, image])
  }

  const handleContinue = () => {
    if (!createdEntity || !username) return
    router.push(
      `/${username}/${createdEntity.entityType}/${createdEntity.slug}`,
    )
  }

  return (
    <main className="py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
                {upgradeRequired ? (
                  <>
                    {error}{' '}
                    <Link
                      href="/about/pricing"
                      className="font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      Subscribe to create more.
                    </Link>
                  </>
                ) : (
                  error
                )}
              </div>
            )}

            {createdEntity ? (
              <div className="space-y-6">
                <div className="rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {createdEntity.name} created! Add images below or continue.
                </div>
                <ImageUpload
                  existingImages={createdEntityImages}
                  onUpload={handleImageUpload}
                  onDelete={handleImageDelete}
                  onSetPrimary={handleSetPrimary}
                  entityType={entityTypeSingular[createdEntity.entityType]}
                  entityId={createdEntity.id}
                  entityName={createdEntity.name}
                  entityDescription={createdEntity.description}
                  userId={userId}
                  onImageGenerated={handleImageGenerated}
                />
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue to {createdEntity.name}
                </Button>
              </div>
            ) : config.fields === 'story' ? (
              <StoryForm
                onSubmit={handleStorySubmit}
                isSubmitting={isSubmitting}
                stories={stories}
                hasApiKey={hasApiKey}
                userId={userId}
              />
            ) : (
              <EntityForm
                entityType={entityType}
                onSubmit={handleEntitySubmit}
                isSubmitting={isSubmitting}
                stories={stories}
                hasApiKey={hasApiKey}
                userId={userId}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default CreateScreen
