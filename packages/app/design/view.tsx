import { View as ReactNativeView } from 'react-native'
import { cssInterop } from 'nativewind'

// Configure NativeWind for View component
cssInterop(ReactNativeView, { className: 'style' })

export const View = ReactNativeView
