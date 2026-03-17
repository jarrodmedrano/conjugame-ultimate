import withDashboard from '../../ui/components/dashboard/with-dashboard'
import { ScreenProps } from '../common/interfaces'
import { View } from '../design/view'
import { ReactNode } from 'react'
const DashboardLayout = ({
  children,
  ...props
}: {
  children: ReactNode
  props: ScreenProps
}) => {
  return <View {...props}>{children}</View>
}

export default withDashboard(DashboardLayout)
