"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface WellnessEntry {
  userId: string
  date: string
  mood: number
  energy: number
  sleep: number
  sleepQuality?: number
  stress?: number
  water: number
  exercise?: string
  symptoms?: string[]
  notes?: string
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_WELLNESS_API_URL || 'http://localhost:8082/api/wellness'
const CURRENT_USER_ID = 'user123' // In a real app, this would come from auth context

console.log('Wellness Context initialized with API_BASE_URL:', API_BASE_URL)

interface WellnessContextType {
  addWellnessEntry: (entry: Omit<WellnessEntry, 'userId'>) => Promise<void>
  getWellnessHistory: () => WellnessEntry[]
  getWellnessForDate: (date: string) => WellnessEntry | null
  updateWellnessEntry: (date: string, entry: Partial<WellnessEntry>) => Promise<void>
  isLoading: boolean
  isServiceAvailable: boolean
  serviceError: string | null
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined)

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const [wellnessEntries, setWellnessEntries] = useState<WellnessEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isServiceAvailable, setIsServiceAvailable] = useState(true)
  const [serviceError, setServiceError] = useState<string | null>(null)

  // Load entries from API on mount
  useEffect(() => {
    loadWellnessEntries()
  }, [])

  const loadWellnessEntries = async () => {
    console.log('Loading wellness entries from API...')
    try {
      setIsLoading(true)
      setServiceError(null)
      
      const response = await fetch(`${API_BASE_URL}/users/${CURRENT_USER_ID}/entries`)
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Wellness API returned ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API response data:', data)
      
      if (data.success) {
        console.log('Setting wellness entries:', data.data?.length || 0, 'entries')
        setWellnessEntries(data.data || [])
        setIsServiceAvailable(true)
      }
    } catch (error) {
      console.error('Failed to load wellness entries - Ballerina Wellness Service required:', error)
      setWellnessEntries([]) // Clear entries - no JavaScript fallback
      setIsServiceAvailable(false)
      setServiceError(error instanceof Error ? error.message : 'Service unavailable')
    } finally {
      setIsLoading(false)
    }
  }

  const addWellnessEntry = async (entry: Omit<WellnessEntry, 'userId'>) => {
    console.log('Adding wellness entry:', entry)
    try {
      setIsLoading(true)
      setServiceError(null)
      
      const fullEntry: WellnessEntry = {
        ...entry,
        userId: CURRENT_USER_ID
      }

      const response = await fetch(`${API_BASE_URL}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEntry),
      })

      const data = await response.json()
      console.log('API response:', data)
      
      if (data.success) {
        // Update local state
        setWellnessEntries((prev) => {
          console.log('Updating wellness entries, previous:', prev.length)
          const filtered = prev.filter((e) => e.date !== entry.date)
          const updated = [fullEntry, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          console.log('Updated wellness entries, new:', updated.length)
          return updated
        })
        setIsServiceAvailable(true)
      } else {
        throw new Error(data.message || 'Ballerina Wellness Service failed to add entry')
      }
    } catch (error) {
      console.error('Failed to add wellness entry - Ballerina service required:', error)
      setIsServiceAvailable(false)
      setServiceError(error instanceof Error ? error.message : 'Service unavailable')
      throw error // Propagate error - no JavaScript fallback
    } finally {
      setIsLoading(false)
    }
  }

  const getWellnessHistory = () => {
    return wellnessEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getWellnessForDate = (date: string) => {
    return wellnessEntries.find((entry) => entry.date === date) || null
  }

  const updateWellnessEntry = async (date: string, updatedEntry: Partial<WellnessEntry>) => {
    try {
      setIsLoading(true)
      setServiceError(null)
      
      // Find the existing entry
      const existingEntry = wellnessEntries.find(entry => entry.date === date)
      if (!existingEntry) {
        throw new Error('Entry not found')
      }

      const fullEntry: WellnessEntry = {
        ...existingEntry,
        ...updatedEntry,
        userId: CURRENT_USER_ID,
        date // Ensure date doesn't change
      }

      // Update via API
      const response = await fetch(`${API_BASE_URL}/entries`, {
        method: 'POST', // Using POST since we don't have PUT endpoint
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullEntry),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setWellnessEntries((prev) => {
          const updated = prev.map((entry) => 
            entry.date === date ? fullEntry : entry
          )
          return updated
        })
        setIsServiceAvailable(true)
      } else {
        throw new Error(data.message || 'Ballerina Wellness Service failed to update entry')
      }
    } catch (error) {
      console.error('Failed to update wellness entry - Ballerina service required:', error)
      setIsServiceAvailable(false)
      setServiceError(error instanceof Error ? error.message : 'Service unavailable')
      throw error // Propagate error - no JavaScript fallback
    } finally {
      setIsLoading(false)
    }
  }

    return (
    <WellnessContext.Provider
      value={{
        addWellnessEntry,
        getWellnessHistory,
        getWellnessForDate,
        updateWellnessEntry,
        isLoading,
        isServiceAvailable,
        serviceError,
      }}
    >
      {children}
    </WellnessContext.Provider>
  )
}

export function useWellness() {
  const context = useContext(WellnessContext)
  if (context === undefined) {
    throw new Error("useWellness must be used within a WellnessProvider")
  }
  return context
}
