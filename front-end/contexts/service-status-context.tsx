"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface ServiceStatus {
  name: string
  url: string
  status: 'online' | 'offline' | 'checking'
  lastChecked?: Date
  responseTime?: number
}

interface ServiceStatusContextType {
  services: ServiceStatus[]
  checkAllServices: () => Promise<void>
  checkService: (serviceName: string) => Promise<void>
  isChecking: boolean
}

const ServiceStatusContext = createContext<ServiceStatusContextType | undefined>(undefined)

const SERVICES = [
  {
    name: 'Wellness API',
    url: process.env.NEXT_PUBLIC_WELLNESS_API_URL || 'http://localhost:8082/api/wellness'
  },
  {
    name: 'News API',
    url: process.env.NEXT_PUBLIC_NEWS_API_URL || 'http://localhost:8060/api/news'
  },
  {
    name: 'Period API',
    url: process.env.NEXT_PUBLIC_PERIOD_API_URL || 'http://localhost:8081/api/period'
  }
]

export function ServiceStatusProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICES.map(service => ({
      ...service,
      status: 'checking' as const
    }))
  )
  const [isChecking, setIsChecking] = useState(false)

  const checkService = async (serviceName: string): Promise<void> => {
    const service = SERVICES.find(s => s.name === serviceName)
    if (!service) return

    const startTime = performance.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      setServices(prev => prev.map(s => 
        s.name === serviceName 
          ? {
              ...s, 
              status: response.ok ? 'online' : 'offline',
              lastChecked: new Date(),
              responseTime: response.ok ? responseTime : undefined
            }
          : s
      ))
    } catch (error) {
      console.error(`Failed to check ${serviceName}:`, error)
      setServices(prev => prev.map(s => 
        s.name === serviceName 
          ? {
              ...s, 
              status: 'offline' as const,
              lastChecked: new Date(),
              responseTime: undefined
            }
          : s
      ))
    }
  }

  const checkAllServices = async (): Promise<void> => {
    setIsChecking(true)
    try {
      // Set all to checking first
      setServices(prev => prev.map(s => ({ ...s, status: 'checking' as const })))
      
      // Check all services in parallel
      await Promise.all(SERVICES.map(service => checkService(service.name)))
    } finally {
      setIsChecking(false)
    }
  }

  // Check services on mount and every 30 seconds
  useEffect(() => {
    checkAllServices()
    const interval = setInterval(checkAllServices, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <ServiceStatusContext.Provider
      value={{
        services,
        checkAllServices,
        checkService,
        isChecking,
      }}
    >
      {children}
    </ServiceStatusContext.Provider>
  )
}

export function useServiceStatus() {
  const context = useContext(ServiceStatusContext)
  if (context === undefined) {
    throw new Error("useServiceStatus must be used within a ServiceStatusProvider")
  }
  return context
}
