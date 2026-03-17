'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export interface UpgradePromptProps {
  entityType: string
  count: number
  limit: number
  upgradeHref?: string
}

/**
 * Inline banner shown when a preview user has reached an entity limit.
 * Prompts them to upgrade to a paid subscription.
 */
export function UpgradePrompt({
  entityType,
  count,
  limit,
  upgradeHref = '/about/pricing',
}: UpgradePromptProps) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <Zap
        className="h-4 w-4 flex-shrink-0 text-amber-400"
        aria-hidden="true"
      />
      <span className="text-amber-200">
        Preview limit reached: {count}/{limit} {entityType}.{' '}
        <Link
          href={upgradeHref}
          className="font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300"
        >
          Upgrade to Pro
        </Link>{' '}
        to create unlimited {entityType}.
      </span>
    </div>
  )
}
