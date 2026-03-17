import Image from 'next/image'
import type { CharacterAttribute } from '@repo/database'
import {
  PREDEFINED_ATTRIBUTES,
  getLabelForKey,
} from '../constants/characterAttributes'

function sortAttributes(
  attributes: CharacterAttribute[],
): CharacterAttribute[] {
  const predefinedOrder = PREDEFINED_ATTRIBUTES.map((a) => a.key)
  return [...attributes].sort((a, b) => {
    const aIdx = predefinedOrder.indexOf(a.key)
    const bIdx = predefinedOrder.indexOf(b.key)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  })
}

interface CharacterInfoboxProps {
  characterName: string
  primaryImageUrl?: string
  attributes: CharacterAttribute[]
  theme?: string
}

export function CharacterInfobox({
  characterName,
  primaryImageUrl,
  attributes,
  theme,
}: CharacterInfoboxProps) {
  const isDark = theme === 'dark'

  if (!primaryImageUrl && attributes.length === 0) return null

  const sortedAttributes = sortAttributes(attributes)

  return (
    <aside
      data-testid="character-infobox"
      className={`float-right mb-4 ml-6 w-64 rounded-sm border text-sm ${
        isDark
          ? 'border-gray-600 bg-gray-800 text-gray-100'
          : 'border-gray-300 bg-gray-50 text-gray-900'
      } `}
    >
      {/* Infobox title */}
      <div
        className={`border-b px-3 py-2 text-center text-sm font-semibold ${
          isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-200'
        } `}
      >
        {characterName}
      </div>

      {/* Portrait */}
      {primaryImageUrl && (
        <div
          className={`flex justify-center border-b p-2 ${
            isDark ? 'border-gray-600' : 'border-gray-300'
          }`}
        >
          <div className="relative aspect-[3/4] max-h-64 w-full">
            <Image
              src={primaryImageUrl}
              alt={`${characterName} portrait`}
              fill
              className="object-cover"
              sizes="256px"
            />
          </div>
        </div>
      )}

      {/* Attributes table */}
      {sortedAttributes.length > 0 && (
        <table className="w-full text-xs">
          <tbody>
            {sortedAttributes.map((attr) => (
              <tr
                key={attr.id}
                className={`border-b last:border-b-0 ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <th
                  className={`w-[45%] px-2 py-1.5 text-left align-top font-semibold ${
                    isDark ? 'text-gray-300' : 'bg-gray-100 text-gray-700'
                  } `}
                >
                  {getLabelForKey(attr.key)}
                </th>
                <td className="break-words px-2 py-1.5 align-top">
                  {attr.value || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </aside>
  )
}
