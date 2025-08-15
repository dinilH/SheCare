import { useServiceStatus } from '@/contexts/service-status-context'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function NavbarStatusIndicator() {
  const { services } = useServiceStatus()

  const onlineCount = services.filter(s => s.status === 'online').length
  const totalCount = services.length
  const hasOffline = services.some(s => s.status === 'offline')
  const isChecking = services.some(s => s.status === 'checking')

  if (isChecking) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
        <AlertCircle className="w-3 h-3" />
        Checking...
      </Badge>
    )
  }

  if (onlineCount === totalCount) {
    return (
      <Badge variant="default" className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700">
        <Wifi className="w-3 h-3" />
        Services: {onlineCount}/{totalCount}
      </Badge>
    )
  }

  if (hasOffline) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
        <WifiOff className="w-3 h-3" />
        Services: {onlineCount}/{totalCount}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
      <AlertCircle className="w-3 h-3" />
      Services: {onlineCount}/{totalCount}
    </Badge>
  )
}
