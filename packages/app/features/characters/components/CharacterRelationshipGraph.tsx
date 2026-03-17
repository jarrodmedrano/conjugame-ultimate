'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

export interface GraphCharacter {
  id: number
  name: string
  primaryImageUrl?: string | null
  slug?: string | null
}

export interface GraphRelationship {
  id: number
  relationshipId: number
  name: string
  primaryImageUrl: string | null
  relationshipLabel: string
  isFamily: boolean
  slug: string | null
}

interface CharacterRelationshipGraphProps {
  character: GraphCharacter
  relationships: GraphRelationship[]
  userId: string
  theme?: string
}

const CENTER_X = 450
const CENTER_Y = 300
const RADIUS = 220

function computeNodePositions(count: number) {
  if (count === 0) return []
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      x: CENTER_X + RADIUS * Math.cos(angle),
      y: CENTER_Y + RADIUS * Math.sin(angle),
    }
  })
}

export function CharacterRelationshipGraph({
  character,
  relationships,
  userId,
  theme,
}: CharacterRelationshipGraphProps) {
  const router = useRouter()
  const isDark = theme === 'dark'

  const nodeStyle = useMemo(
    () => ({
      background: isDark ? '#1f2937' : '#ffffff',
      border: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '10px 16px',
      color: isDark ? '#f9fafb' : '#111827',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      minWidth: '100px',
      textAlign: 'center' as const,
    }),
    [isDark],
  )

  const centerNodeStyle = useMemo(
    () => ({
      ...nodeStyle,
      background: isDark ? '#1d4ed8' : '#3b82f6',
      border: `2px solid ${isDark ? '#2563eb' : '#2563eb'}`,
      color: '#ffffff',
      fontWeight: 700,
      fontSize: '14px',
      padding: '12px 20px',
    }),
    [nodeStyle, isDark],
  )

  const positions = useMemo(
    () => computeNodePositions(relationships.length),
    [relationships.length],
  )

  const nodes: Node[] = useMemo(() => {
    const centerNode: Node = {
      id: `char-${character.id}`,
      position: { x: CENTER_X, y: CENTER_Y },
      data: { label: character.name },
      style: centerNodeStyle,
      draggable: false,
    }

    const relatedNodes: Node[] = relationships.map((rel, i) => ({
      id: `rel-${rel.id}`,
      position: positions[i] ?? { x: 0, y: 0 },
      data: { label: rel.name, characterId: rel.id, slug: rel.slug },
      style: nodeStyle,
      draggable: true,
    }))

    return [centerNode, ...relatedNodes]
  }, [character, relationships, positions, centerNodeStyle, nodeStyle])

  const edges: Edge[] = useMemo(
    () =>
      relationships.map((rel) => ({
        id: `edge-${rel.relationshipId}`,
        source: `char-${character.id}`,
        target: `rel-${rel.id}`,
        label: rel.relationshipLabel,
        labelStyle: {
          fontSize: 11,
          fill: isDark ? '#9ca3af' : '#6b7280',
          fontWeight: 400,
        },
        labelBgStyle: {
          fill: isDark ? '#111827' : '#f9fafb',
          fillOpacity: 0.9,
        },
        style: {
          stroke: rel.isFamily
            ? isDark
              ? '#60a5fa'
              : '#3b82f6'
            : isDark
            ? '#6b7280'
            : '#9ca3af',
          strokeWidth: rel.isFamily ? 2 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: rel.isFamily
            ? isDark
              ? '#60a5fa'
              : '#3b82f6'
            : isDark
            ? '#6b7280'
            : '#9ca3af',
        },
        animated: rel.isFamily,
      })),
    [relationships, character.id, isDark],
  )

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const slug = node.data.slug as string | null
      const characterId = node.data.characterId as number | undefined
      if (!characterId) return
      const path = slug ?? characterId.toString()
      router.push(`/${userId}/characters/${path}`)
    },
    [router, userId],
  )

  const bgColor = isDark ? '#0f172a' : '#f8fafc'

  return (
    <div
      style={{
        width: '100%',
        height: '600px',
        background: bgColor,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-right"
        colorMode={isDark ? 'dark' : 'light'}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={isDark ? '#374151' : '#e5e7eb'}
        />
        <Controls />
      </ReactFlow>
    </div>
  )
}
