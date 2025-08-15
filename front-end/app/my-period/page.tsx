"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePeriod } from "@/contexts/period-context"
import { useServiceStatus } from "@/contexts/service-status-context"
import {
  CalendarIcon,
  TrendingUp,
  Plus,
  CalendarDays,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PeriodEntry {
  id: string
  startDate: string
  endDate: string
  flow: "light" | "medium" | "heavy"
  symptoms: string[]
  notes: string
}

const periodSymptoms = [
  "Cramps",
  "Bloating",
  "Headache",
  "Mood Swings",
  "Fatigue",
  "Back Pain",
  "Breast Tenderness",
  "Nausea",
  "Acne",
  "Food Cravings",
]

const flowColors = {
  light: "#FFCAD4",
  medium: "#FF407D",
  heavy: "#1B3C73",
}

export default function MyPeriodPage() {
  const { 
    periods, 
    predictions, 
    calendarData, 
    loading, 
    error, 
    addPeriod, 
    updatePeriod, 
    deletePeriod 
  } = usePeriod()

  const { services, checkService } = useServiceStatus()
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false)
  const [isPredictionsModalOpen, setIsPredictionsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<PeriodEntry | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Form states
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [flow, setFlow] = useState<"light" | "medium" | "heavy">("medium")
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [notes, setNotes] = useState("")

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]))
  }

  const resetForm = () => {
    setStartDate("")
    setEndDate("")
    setFlow("medium")
    setSelectedSymptoms([])
    setNotes("")
    setEditingPeriod(null)
  }

  const handleAddPeriod = async () => {
    if (!startDate || !endDate) return

    try {
      const periodData = {
        startDate,
        endDate,
        flow,
        symptoms: selectedSymptoms,
        notes,
      }

      if (editingPeriod) {
        await updatePeriod(editingPeriod.id, periodData)
      } else {
        await addPeriod(periodData)
      }

      resetForm()
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Failed to save period:', error)
    }
  }

  const handleEditPeriod = (period: PeriodEntry) => {
    setEditingPeriod(period)
    setStartDate(period.startDate)
    setEndDate(period.endDate)
    setFlow(period.flow)
    setSelectedSymptoms(period.symptoms)
    setNotes(period.notes)
    setIsAddModalOpen(true)
  }

  const handleDeletePeriod = async (id: string) => {
    try {
      await deletePeriod(id)
    } catch (error) {
      console.error('Failed to delete period:', error)
    }
  }

  // Generate calendar for current month
  const generateCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const periodData = periods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate)

      days.push({
        day,
        date: dateStr,
        periodData,
        isToday: dateStr === new Date().toISOString().split("T")[0],
      })
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // Calculate predictions using context data
  const getFormattedPredictions = () => {
    return predictions.slice(0, 3).map((pred, index) => ({
      cycle: index + 1,
      date: pred.periodStartDate,
      formattedDate: new Date(pred.periodStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      ovulationDate: pred.ovulationDate,
      fertileWindowStart: pred.fertileWindowStart,
      fertileWindowEnd: pred.fertileWindowEnd
    }))
  }

  // Chart data
  const getChartData = () => {
    const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    return sortedPeriods.map((period, index) => {
      const startDate = new Date(period.startDate)
      const endDate = new Date(period.endDate)
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      let cycleLength = 28 // default
      if (index > 0) {
        const prevStart = new Date(sortedPeriods[index - 1].startDate)
        cycleLength = Math.ceil((startDate.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        period: `Period ${index + 1}`,
        duration,
        cycleLength,
        date: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }
    })
  }

  const calendarDays = generateCalendar()
  const formattedPredictions = getFormattedPredictions()
  const chartData = getChartData()
  const recentPeriods = periods.slice(0, 3)

  // Get period service status
  const periodService = services.find(s => s.name === 'Period API')
  const isPeriodServiceOnline = periodService?.status === 'online'
  const isPeriodServiceChecking = periodService?.status === 'checking'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFCAD4]/20 to-white pt-16">
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-[#FF407D] text-lg">Processing...</div>
        </div>
      )}
      
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      )}
      
      {/* Compact Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-white mb-3"
            >
              Smart Period Tracking
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-white/90 leading-relaxed max-w-2xl mx-auto"
            >
              Track your cycle, predict future periods, and understand your patterns with AI-powered insights.
            </motion.p>
          </div>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Status Alert */}
        {!isPeriodServiceOnline && !isPeriodServiceChecking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-red-800">
                    Period Tracking Service Unavailable
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      The period tracking service is currently offline. You cannot add, edit, or generate predictions 
                      for period entries until the service is restored. Please check back later or contact support if this issue persists.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => checkService('Period API')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:border-red-300 focus:shadow-outline-red transition ease-in-out duration-150"
                    >
                      <WifiOff className="h-4 w-4 mr-1" />
                      Retry Connection
                    </button>
                    <div className="flex items-center text-sm text-red-600">
                      <WifiOff className="h-4 w-4 mr-1" />
                      Service Status: Offline
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Service Checking Status */}
        {isPeriodServiceChecking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Wifi className="h-6 w-6 text-yellow-400 animate-pulse" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Checking period tracking service connection...
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="border-0 shadow-lg bg-white rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth("prev")}
                      className="hover:bg-[#FFCAD4]/20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <CardTitle className="text-xl font-bold text-[#1B3C73] flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-[#FF407D]" />
                      {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth("next")}
                      className="hover:bg-[#FFCAD4]/20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                  <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                      <motion.div whileHover={isPeriodServiceOnline ? { scale: 1.05 } : {}} whileTap={isPeriodServiceOnline ? { scale: 0.95 } : {}}>
                        <Button
                          disabled={!isPeriodServiceOnline}
                          className={`transition-all duration-300 ${
                            isPeriodServiceOnline
                              ? "bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          onClick={resetForm}
                        >
                          {!isPeriodServiceOnline ? (
                            <>
                              <WifiOff className="w-4 h-4 mr-2" />
                              Period Service Offline
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Period
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-white rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-[#1B3C73] text-center">
                          {editingPeriod ? "Edit Period Entry" : "Add Period Entry"}
                        </DialogTitle>
                        
                        {/* Service offline warning inside dialog */}
                        {!isPeriodServiceOnline && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3"
                          >
                            <div className="flex items-center">
                              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                              <p className="text-sm text-red-700">
                                ⚠️ Period service is offline. You cannot save changes until the service is restored.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Flow Intensity</Label>
                          <Select value={flow} onValueChange={(value: "light" | "medium" | "heavy") => setFlow(value)}>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="heavy">Heavy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Symptoms</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {periodSymptoms.map((symptom) => (
                              <motion.div key={symptom} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Badge
                                  variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                                  className={`cursor-pointer transition-all ${
                                    selectedSymptoms.includes(symptom)
                                      ? "bg-[#FF407D] hover:bg-[#e63946]"
                                      : "hover:bg-[#FF407D] hover:text-white"
                                  }`}
                                  onClick={() => handleSymptomToggle(symptom)}
                                >
                                  {symptom}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes..."
                            className="bg-white"
                          />
                        </div>

                        <motion.div whileHover={isPeriodServiceOnline ? { scale: 1.02 } : {}} whileTap={isPeriodServiceOnline ? { scale: 0.98 } : {}}>
                          <Button
                            onClick={handleAddPeriod}
                            disabled={!startDate || !endDate || !isPeriodServiceOnline}
                            className={`w-full transition-all duration-300 ${
                              isPeriodServiceOnline
                                ? "bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white disabled:opacity-50"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {!isPeriodServiceOnline
                              ? "Service Offline - Cannot Save"
                              : editingPeriod ? "Update Period Entry" : "Add Period Entry"
                            }
                          </Button>
                        </motion.div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>

                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center font-semibold text-[#40679E] p-2 text-sm">
                        {day}
                      </div>
                    ))}

                    {calendarDays.map((day, index) => (
                      <motion.div
                        key={index}
                        whileHover={day ? { scale: 1.05 } : {}}
                        className={`
                          aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all duration-200 relative
                          ${day ? "hover:bg-[#FFCAD4]/30" : ""}
                          ${day?.isToday ? "bg-[#40679E] text-white font-bold ring-2 ring-[#FF407D]" : ""}
                          ${day?.periodData ? "text-white font-semibold" : ""}
                        `}
                        style={
                          day?.periodData && !day?.isToday
                            ? {
                                backgroundColor: flowColors[day.periodData.flow],
                              }
                            : {}
                        }
                      >
                        {day?.day}
                        {day?.periodData && (
                          <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-white/80"></div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-[#FFCAD4]"></div>
                      <span>Light Flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-[#FF407D]"></div>
                      <span>Medium Flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-[#1B3C73]"></div>
                      <span>Heavy Flow</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Stats and Actions */}
          <div className="space-y-4">
            {/* Next Period Prediction */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dialog open={isPredictionsModalOpen} onOpenChange={setIsPredictionsModalOpen}>
                <DialogTrigger asChild>
                  <Card className="border-0 shadow-lg cursor-pointer transition-transform duration-300 bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] text-white rounded-2xl">
                    <CardContent className="p-4 text-center">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="text-lg font-bold mb-1">Next Period</h3>
                      <p className="text-sm">
                        {predictions.length > 0 
                          ? new Date(predictions[0].periodStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })
                          : "Track more cycles"
                        }
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#1B3C73] text-center">Period Predictions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {formattedPredictions.length > 0 ? (
                      formattedPredictions.map((prediction, index) => (
                        <motion.div
                          key={prediction.cycle}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-[#FFCAD4]/20 rounded-lg"
                        >
                          <h4 className="font-semibold text-[#1B3C73]">Predicted Period #{prediction.cycle}</h4>
                          <p className="text-[#40679E]">{prediction.formattedDate}</p>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-[#40679E] text-center py-4">Track at least 2 periods to see predictions</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Cycle Trends */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dialog open={isTrendsModalOpen} onOpenChange={setIsTrendsModalOpen}>
                <DialogTrigger asChild>
                  <Card className="border-0 shadow-lg cursor-pointer transition-transform duration-300 bg-gradient-to-r from-[#40679E] to-[#1B3C73] text-white rounded-2xl">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                      <h3 className="text-lg font-bold mb-1">Cycle Trends</h3>
                      <p className="text-sm">
                        {periods.length > 0 ? `${periods.length} periods tracked` : "No data yet"}
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#1B3C73] text-center">Cycle Trends & Analysis</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {chartData.length > 0 ? (
                      <>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="cycleLength"
                                stroke="#FF407D"
                                strokeWidth={2}
                                name="Cycle Length (days)"
                              />
                              <Line
                                type="monotone"
                                dataKey="duration"
                                stroke="#40679E"
                                strokeWidth={2}
                                name="Period Duration (days)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center p-4 bg-[#FFCAD4]/20 rounded-lg"
                          >
                            <div className="text-2xl font-bold text-[#FF407D]">{periods.length}</div>
                            <div className="text-sm text-[#40679E]">Periods Tracked</div>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center p-4 bg-[#40679E]/20 rounded-lg"
                          >
                            <div className="text-2xl font-bold text-[#40679E]">
                              {chartData.length > 0
                                ? Math.round(chartData.reduce((sum, d) => sum + d.cycleLength, 0) / chartData.length)
                                : 28}
                            </div>
                            <div className="text-sm text-[#40679E]">Avg Cycle (days)</div>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center p-4 bg-[#1B3C73]/20 rounded-lg"
                          >
                            <div className="text-2xl font-bold text-[#1B3C73]">
                              {chartData.length > 0
                                ? Math.round(chartData.reduce((sum, d) => sum + d.duration, 0) / chartData.length)
                                : 5}
                            </div>
                            <div className="text-sm text-[#40679E]">Avg Duration (days)</div>
                          </motion.div>
                        </div>
                      </>
                    ) : (
                      <p className="text-[#40679E] text-center py-8">
                        Track more periods to see detailed trends and analysis
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Recent Periods */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-white rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold text-[#1B3C73]">Recent Periods</CardTitle>
                  {periods.length > 3 && (
                    <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[#FF407D] hover:text-[#e63946]">
                          <Eye className="w-4 h-4 mr-1" />
                          See All
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white rounded-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-[#1B3C73] text-center">Period History</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {periods
                            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                            .map((period, index) => (
                              <motion.div
                                key={period.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 bg-[#FFCAD4]/10 rounded-lg border border-pink-100"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-[#1B3C73]">
                                    {new Date(period.startDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Badge style={{ backgroundColor: flowColors[period.flow] }} className="text-white">
                                      {period.flow}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditPeriod(period)}
                                      disabled={!isPeriodServiceOnline}
                                      className={`h-6 w-6 p-0 ${
                                        isPeriodServiceOnline 
                                          ? "text-[#40679E] hover:text-[#FF407D]" 
                                          : "text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePeriod(period.id)}
                                      disabled={!isPeriodServiceOnline}
                                      className={`h-6 w-6 p-0 ${
                                        isPeriodServiceOnline 
                                          ? "text-[#40679E] hover:text-red-500" 
                                          : "text-gray-400 cursor-not-allowed"
                                      }`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                {period.symptoms.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {period.symptoms.slice(0, 3).map((symptom) => (
                                      <Badge key={symptom} variant="outline" className="text-xs">
                                        {symptom}
                                      </Badge>
                                    ))}
                                    {period.symptoms.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{period.symptoms.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {periods.length > 0 ? (
                    <div className="space-y-3">
                      {recentPeriods
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map((period, index) => (
                          <motion.div
                            key={period.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-[#FFCAD4]/10 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-[#1B3C73]">
                                {new Date(period.startDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge style={{ backgroundColor: flowColors[period.flow] }} className="text-white">
                                  {period.flow}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPeriod(period)}
                                  disabled={!isPeriodServiceOnline}
                                  className={`h-6 w-6 p-0 ${
                                    isPeriodServiceOnline 
                                      ? "text-[#40679E] hover:text-[#FF407D]" 
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePeriod(period.id)}
                                  disabled={!isPeriodServiceOnline}
                                  className={`h-6 w-6 p-0 ${
                                    isPeriodServiceOnline 
                                      ? "text-[#40679E] hover:text-red-500" 
                                      : "text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {period.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {period.symptoms.slice(0, 3).map((symptom) => (
                                  <Badge key={symptom} variant="outline" className="text-xs">
                                    {symptom}
                                  </Badge>
                                ))}
                                {period.symptoms.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{period.symptoms.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[#40679E] text-center py-4">
                      No periods tracked yet. Add your first period to get started!
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
