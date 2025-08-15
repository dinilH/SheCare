import { useServiceStatus } from '@/contexts/service-status-context'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wifi, WifiOff, Loader } from 'lucide-react'

export function ServiceStatusIndicator() {
  const { services, checkAllServices, isChecking } = useServiceStatus()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'checking': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-3 h-3" />
      case 'offline': return <WifiOff className="w-3 h-3" />
      case 'checking': return <Loader className="w-3 h-3 animate-spin" />
      default: return <WifiOff className="w-3 h-3" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'offline': return 'Offline'
      case 'checking': return 'Checking...'
      default: return 'Unknown'
    }
  }

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Ballerina Services Status</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={checkAllServices}
          disabled={isChecking}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
              <span className="font-medium text-sm">{service.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={service.status === 'online' ? 'default' : 'secondary'}
                className="flex items-center gap-1 text-xs"
              >
                {getStatusIcon(service.status)}
                {getStatusText(service.status)}
              </Badge>
              
              {service.responseTime && (
                <span className="text-xs text-muted-foreground">
                  {service.responseTime}ms
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {services.some(s => s.status === 'offline') && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            ⚠️ Some Ballerina services are offline. Please ensure all backend services are running:
          </p>
          <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
            <li>Wellness API: <code>cd back-end/wellness-api && bal run --offline</code></li>
            <li>News API: <code>cd back-end/news_service && bal run --offline</code></li>
            <li>Period API: <code>cd back-end/period_service && bal run --offline</code></li>
          </ul>
        </div>
      )}
      
      {services.every(s => s.status === 'online') && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ All Ballerina services are running properly!
          </p>
        </div>
      )}
    </Card>
  )
}
