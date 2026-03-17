import { ComponentProps } from 'react'
import { Text as NativeText, Platform, Linking, TextStyle } from 'react-native'
import { cssInterop } from 'nativewind'
import { TextLink as SolitoTextLink } from 'solito/link'
import React from 'react'

// Configure NativeWind for Text component
cssInterop(NativeText, { className: 'style' })

export const Text = NativeText

/**
 * You can use this pattern to create components with default styles
 */
export const P = (props: ComponentProps<typeof NativeText>) => (
  <NativeText
    style={{ fontSize: 16, color: 'black', marginVertical: 16 }}
    {...props}
  />
)

/**
 * Components can have defaultProps and styles
 */
export const H1 = (props: ComponentProps<typeof NativeText>) => (
  <NativeText
    style={{ fontSize: 30, fontWeight: '800', marginVertical: 16 }}
    {...props}
  />
)
H1.defaultProps = {
  // accessibilityLevel: 1,
  accessibilityRole: 'header',
}

/**
 * This is a more advanced component with custom styles and per-platform functionality
 */
export interface AProps extends ComponentProps<typeof Text> {
  href?: string
  target?: '_blank'
}

export const A = ({ href, target, ...props }: AProps) => {
  const nativeAProps = Platform.select<Partial<AProps>>({
    web: {
      href,
      target,
    },
    default: {
      onPress: (event) => {
        props.onPress && props.onPress(event)
        if (Platform.OS !== 'web' && href !== undefined) {
          Linking.openURL(href)
        }
      },
    },
  })

  return (
    <Text
      role="link"
      style={[{ color: '#3b82f6' }, props.style] as any}
      {...props}
      {...nativeAProps}
    />
  )
}

A.displayName = 'A'

/**
 * Solito's TextLink with inline styles
 */
export const TextLink = ({
  style,
  ...props
}: ComponentProps<typeof SolitoTextLink> & { style?: TextStyle }) => {
  return (
    <SolitoTextLink
      style={
        [{ fontSize: 16, fontWeight: 'bold', color: '#3b82f6' }, style] as any
      }
      {...props}
    />
  )
}
