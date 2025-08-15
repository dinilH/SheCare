"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface PeriodRequest {
  lastPeriodStartDate: string
  periodLength: number
  averageCycleLength: number
}

interface CalendarDay {
  date: string
  dayType: "period" | "ovulation" | "fertile" | "regular"
  cycleDay: number
  phase: "menstrual" | "follicular" | "ovulation" | "luteal"
  isPredicted: boolean
}

interface PeriodPrediction {
  periodNumber: number
  periodStartDate: string
  periodEndDate: string
  ovulationDate: string
  fertileWindowStart: string
  fertileWindowEnd: string
  cycleDay: number
  monthInfo: {
    month: string
    year: number
    daysInMonth: number
    isLeapYear: boolean
  }
}

interface PeriodResponse {
  success: boolean
  message: string
  predictions?: PeriodPrediction[]
  calendarData?: CalendarDay[]
  nextPeriodDate?: string
  nextOvulationDate?: string
  timestamp?: string
}

interface PeriodEntry {
  id: string
  startDate: string
  endDate: string
  flow: "light" | "medium" | "heavy"
  symptoms: string[]
  notes: string
}

// API configuration - Connect to Ballerina Period Service
const API_BASE_URL = process.env.NEXT_PUBLIC_PERIOD_API_URL || 'http://localhost:8081/api/period'

interface PeriodContextType {
  periods: PeriodEntry[]
  predictions: PeriodPrediction[]
  calendarData: CalendarDay[]
  loading: boolean
  error: string | null
  isServiceAvailable: boolean
  serviceError: string | null
  addPeriod: (period: Omit<PeriodEntry, 'id'>) => Promise<void>
  updatePeriod: (id: string, period: Partial<PeriodEntry>) => Promise<void>
  deletePeriod: (id: string) => Promise<void>
  generatePredictions: (request: PeriodRequest) => Promise<void>
  getCalendarData: (year: string, month: string) => Promise<void>
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined)

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [periods, setPeriods] = useState<PeriodEntry[]>([])
  const [predictions, setPredictions] = useState<PeriodPrediction[]>([])
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isServiceAvailable, setIsServiceAvailable] = useState(true)
  const [serviceError, setServiceError] = useState<string | null>(null)

  // Load periods from localStorage on mount (fallback)
  useEffect(() => {
    const savedPeriods = localStorage.getItem("periods")
    if (savedPeriods) {
      setPeriods(JSON.parse(savedPeriods))
    }
  }, [])

  // Save periods to localStorage (backup)
  const savePeriodsToStorage = (newPeriods: PeriodEntry[]) => {
    setPeriods(newPeriods)
    localStorage.setItem("periods", JSON.stringify(newPeriods))
  }

  const addPeriod = async (periodData: Omit<PeriodEntry, 'id'>) => {
    try {
      setLoading(true)
      setError(null)

      const newPeriod: PeriodEntry = {
        ...periodData,
        id: Date.now().toString()
      }

      // For now, save locally since Ballerina service doesn't have period storage endpoints
      // In a full implementation, you would call the Ballerina service here
      const updatedPeriods = [...periods, newPeriod]
      savePeriodsToStorage(updatedPeriods)

      // Generate new predictions after adding a period
      if (updatedPeriods.length >= 2) {
        await generatePredictionsFromPeriods(updatedPeriods)
      }
    } catch (err) {
      console.error('Failed to add period:', err)
      setError('Failed to add period entry')
    } finally {
      setLoading(false)
    }
  }

  const updatePeriod = async (id: string, periodData: Partial<PeriodEntry>) => {
    try {
      setLoading(true)
      setError(null)

      const updatedPeriods = periods.map(p => 
        p.id === id ? { ...p, ...periodData } : p
      )
      savePeriodsToStorage(updatedPeriods)

      // Regenerate predictions
      if (updatedPeriods.length >= 2) {
        await generatePredictionsFromPeriods(updatedPeriods)
      }
    } catch (err) {
      console.error('Failed to update period:', err)
      setError('Failed to update period entry')
    } finally {
      setLoading(false)
    }
  }

  const deletePeriod = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const updatedPeriods = periods.filter(p => p.id !== id)
      savePeriodsToStorage(updatedPeriods)

      // Regenerate predictions
      if (updatedPeriods.length >= 2) {
        await generatePredictionsFromPeriods(updatedPeriods)
      } else {
        setPredictions([])
        setCalendarData([])
      }
    } catch (err) {
      console.error('Failed to delete period:', err)
      setError('Failed to delete period entry')
    } finally {
      setLoading(false)
    }
  }

  const generatePredictionsFromPeriods = async (periodEntries: PeriodEntry[]) => {
    if (periodEntries.length < 1) return

    // Use the most recent period only - let Ballerina service handle all calculations
    const sortedPeriods = [...periodEntries].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )

    const lastPeriod = sortedPeriods[0]

    // Use standard values - let Ballerina do all the intelligent calculations
    const request: PeriodRequest = {
      lastPeriodStartDate: lastPeriod.startDate,
      periodLength: 5, // Standard period length - Ballerina will adjust based on patterns
      averageCycleLength: 28 // Standard cycle length - Ballerina will adjust based on patterns
    }

    await generatePredictions(request)
  }

  const generatePredictions = async (request: PeriodRequest) => {
    try {
      setLoading(true)
      setError(null)
      setServiceError(null)

      console.log('Generating predictions with request:', request)

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data: PeriodResponse = await response.json()
      console.log('Prediction response:', data)

      if (data.success) {
        setPredictions(data.predictions || [])
        setCalendarData(data.calendarData || [])
        setIsServiceAvailable(true)
      } else {
        setError(data.message || 'Failed to generate predictions - Ballerina service required')
        setIsServiceAvailable(false)
        setServiceError(data.message || 'Service returned error')
        console.error('Ballerina period service returned error:', data.message)
      }
    } catch (err) {
      console.error('Failed to connect to Ballerina period service:', err)
      setError('Cannot connect to Ballerina period service - Pure Ballerina implementation required')
      setIsServiceAvailable(false)
      setServiceError(err instanceof Error ? err.message : 'Service unavailable')
      setPredictions([])
      setCalendarData([])
    } finally {
      setLoading(false)
    }
  }

  // Removed JavaScript fallback - Pure Ballerina only

  const getCalendarData = async (year: string, month: string) => {
    try {
      setLoading(true)
      setError(null)
      setServiceError(null)

      const response = await fetch(`${API_BASE_URL}/calendar/${year}/${month}`)
      const data: PeriodResponse = await response.json()

      if (data.success) {
        setCalendarData(data.calendarData || [])
        setIsServiceAvailable(true)
      } else {
        setError(data.message || 'Failed to get calendar data')
        setIsServiceAvailable(false)
        setServiceError(data.message || 'Service returned error')
      }
    } catch (err) {
      console.error('Failed to get calendar data:', err)
      setError('Failed to connect to period service')
      setIsServiceAvailable(false)
      setServiceError(err instanceof Error ? err.message : 'Service unavailable')
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate predictions when periods change - Pure Ballerina dependency
  useEffect(() => {
    if (periods.length >= 1) {
      generatePredictionsFromPeriods(periods)
    } else {
      // Clear predictions if no periods - require Ballerina service
      setPredictions([])
      setCalendarData([])
    }
  }, [])

  return (
    <PeriodContext.Provider
      value={{
        periods,
        predictions,
        calendarData,
        loading,
        error,
        isServiceAvailable,
        serviceError,
        addPeriod,
        updatePeriod,
        deletePeriod,
        generatePredictions,
        getCalendarData,
      }}
    >
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const context = useContext(PeriodContext)
  if (context === undefined) {
    throw new Error("usePeriod must be used within a PeriodProvider")
  }
  return context
}
