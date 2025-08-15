"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useWellness } from "@/contexts/wellness-context"
import { useServiceStatus } from "@/contexts/service-status-context"
import {
  Heart,
  Activity,
  Moon,
  Plus,
  Calendar,
  TrendingUp,
  Eye,
  BarChart3,
  Brain,
  ChevronRight,
  Droplets,
  Edit,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const moodEmojis = [
  { emoji: "😢", label: "Very Sad", value: 1, color: "#ef4444" },
  { emoji: "😕", label: "Sad", value: 2, color: "#f97316" },
  { emoji: "😐", label: "Neutral", value: 3, color: "#eab308" },
  { emoji: "😊", label: "Happy", value: 4, color: "#22c55e" },
  { emoji: "😄", label: "Very Happy", value: 5, color: "#10b981" },
]

const energyEmojis = [
  { emoji: "🔋", label: "Very Low", value: 1, color: "#ef4444" },
  { emoji: "⚡", label: "Low", value: 2, color: "#f97316" },
  { emoji: "🌟", label: "Moderate", value: 3, color: "#eab308" },
  { emoji: "💫", label: "High", value: 4, color: "#22c55e" },
  { emoji: "🚀", label: "Very High", value: 5, color: "#10b981" },
]

const sleepQualityEmojis = [
  { emoji: "😵", label: "Terrible", value: 1, color: "#ef4444" },
  { emoji: "😴", label: "Poor", value: 2, color: "#f97316" },
  { emoji: "😐", label: "Okay", value: 3, color: "#eab308" },
  { emoji: "😊", label: "Good", value: 4, color: "#22c55e" },
  { emoji: "🤩", label: "Excellent", value: 5, color: "#10b981" },
]

const stressEmojis = [
  { emoji: "😌", label: "Very Calm", value: 1, color: "#10b981" },
  { emoji: "🙂", label: "Calm", value: 2, color: "#22c55e" },
  { emoji: "😐", label: "Neutral", value: 3, color: "#eab308" },
  { emoji: "😰", label: "Stressed", value: 4, color: "#f97316" },
  { emoji: "😫", label: "Very Stressed", value: 5, color: "#ef4444" },
]

const commonSymptoms = [
  "Headache",
  "Cramps",
  "Bloating",
  "Mood Swings",
  "Fatigue",
  "Back Pain",
  "Breast Tenderness",
  "Nausea",
  "Acne",
  "Cravings",
]

export default function WellnessPage() {
  const { addWellnessEntry, getWellnessHistory, getWellnessForDate, updateWellnessEntry, isLoading } = useWellness()
  const { services, checkService } = useServiceStatus()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false)
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState("mood")
  const [tabProgress, setTabProgress] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly")
  const [autoProgressTimer, setAutoProgressTimer] = useState<NodeJS.Timeout | null>(null)

  const [currentEntry, setCurrentEntry] = useState({
    mood: 3,
    energy: 3,
    sleep: 8,
    sleepQuality: 3,
    stress: 3,
    water: 8,
    exercise: "",
    symptoms: [] as string[],
    notes: "",
  })

  const history = getWellnessHistory()
  const today = new Date().toISOString().split("T")[0]
  const todayEntry = getWellnessForDate(today)
  const recentEntries = history.slice(0, 3)

  // Get wellness service status
  const wellnessService = services.find(s => s.name === 'Wellness API')
  const isWellnessServiceOnline = wellnessService?.status === 'online'
  const isWellnessServiceChecking = wellnessService?.status === 'checking'

  const tabs = ["mood", "energy", "sleep", "physical", "symptoms", "notes"]

  useEffect(() => {
    const currentIndex = tabs.indexOf(currentTab)
    setTabProgress((currentIndex / (tabs.length - 1)) * 100)
  }, [currentTab])

  useEffect(() => {
    if (todayEntry) {
      setCurrentEntry({
        mood: todayEntry.mood,
        energy: todayEntry.energy,
        sleep: todayEntry.sleep,
        sleepQuality: todayEntry.sleepQuality || 3,
        stress: todayEntry.stress || 3,
        water: todayEntry.water,
        exercise: todayEntry.exercise || "",
        symptoms: todayEntry.symptoms || [],
        notes: todayEntry.notes || "",
      })
    }
  }, [todayEntry])

  // Auto-progress logic
  useEffect(() => {
    if (autoProgressTimer) {
      clearTimeout(autoProgressTimer)
    }

    const currentIndex = tabs.indexOf(currentTab)
    if (currentIndex < tabs.length - 1) {
      let shouldProgress = false

      // Check if current tab is "complete" based on user interaction
      switch (currentTab) {
        case "mood":
          shouldProgress = currentEntry.mood !== 3 // User changed from default
          break
        case "energy":
          shouldProgress = currentEntry.energy !== 3 // User changed from default
          break
        case "sleep":
          shouldProgress = currentEntry.sleep !== 8 || currentEntry.sleepQuality !== 3 // User changed sleep hours or quality
          break
        case "physical":
          shouldProgress = currentEntry.stress !== 3 || currentEntry.water !== 8 || currentEntry.exercise !== "" // User changed any physical metric
          break
        case "symptoms":
          shouldProgress = currentEntry.symptoms.length > 0 // User selected symptoms (or can progress after 3 seconds regardless)
          break
        case "notes":
          shouldProgress = false // Don't auto-progress from notes
          break
      }

      if (shouldProgress) {
        const timer = setTimeout(() => {
          const nextTab = tabs[currentIndex + 1]
          setCurrentTab(nextTab)
        }, 2000) // 2 second delay after interaction

        setAutoProgressTimer(timer)
      } else if (currentTab === "symptoms") {
        // For symptoms, auto-progress after 4 seconds even if no symptoms selected
        const timer = setTimeout(() => {
          const nextTab = tabs[currentIndex + 1]
          setCurrentTab(nextTab)
        }, 4000)

        setAutoProgressTimer(timer)
      }
    }

    return () => {
      if (autoProgressTimer) {
        clearTimeout(autoProgressTimer)
      }
    }
  }, [currentEntry, currentTab])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault() // Prevent any form submission
    
    try {
      if (todayEntry) {
        await updateWellnessEntry(today, currentEntry)
      } else {
        await addWellnessEntry({
          ...currentEntry,
          date: today,
        })
      }

      setCurrentEntry({
        mood: 3,
        energy: 3,
        sleep: 8,
        sleepQuality: 3,
        stress: 3,
        water: 8,
        exercise: "",
        symptoms: [],
        notes: "",
      })
      setIsDialogOpen(false)
      setCurrentTab("mood")
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save wellness entry:', error)
      // You could add a toast notification here
    }
  }

  const toggleSymptom = (symptom: string) => {
    setCurrentEntry((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getWeeklyAverage = (field: 'mood' | 'energy' | 'sleep' | 'sleepQuality' | 'stress' | 'water') => {
    if (history.length === 0) return 0
    const weekData = history.slice(0, 7)
    const sum = weekData.reduce((acc, entry) => {
      return acc + (entry[field] || 0)
    }, 0)
    return Math.round(sum / weekData.length)
  }

  const calculateWellnessScore = () => {
    if (history.length === 0) return 0
    const recent = history.slice(0, viewMode === "weekly" ? 7 : 30)
    const avgMood = recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length
    const avgEnergy = recent.reduce((sum, entry) => sum + entry.energy, 0) / recent.length
    const avgSleep = recent.reduce((sum, entry) => sum + (entry.sleepQuality || 3), 0) / recent.length
    const avgStress = recent.reduce((sum, entry) => sum + (6 - (entry.stress || 3)), 0) / recent.length

    return Math.round(((avgMood + avgEnergy + avgSleep + avgStress) / 4) * 20)
  }

  const handleTabChange = (tab: string) => {
    // Clear any existing auto-progress timer when user manually changes tabs
    if (autoProgressTimer) {
      clearTimeout(autoProgressTimer)
      setAutoProgressTimer(null)
    }
    setCurrentTab(tab)
  }

  const EmojiSelector = ({
    emojis,
    value,
    onChange,
    title,
    showScore = true,
  }: {
    emojis: typeof moodEmojis
    value: number
    onChange: (value: number) => void
    title: string
    showScore?: boolean
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Label className="text-xl font-bold text-[#1B3C73] block text-center">{title}</Label>
      <div className="flex justify-between items-center px-2">
        {emojis.map((item) => (
          <motion.button
            key={item.value}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(item.value)}
            className={`text-5xl p-4 rounded-full transition-all duration-300 ${
              value === item.value
                ? "bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] shadow-xl scale-110"
                : "hover:bg-gray-100 hover:scale-105"
            }`}
            style={{
              boxShadow: value === item.value ? `0 0 20px ${item.color}40` : "none",
            }}
          >
            {item.emoji}
          </motion.button>
        ))}
      </div>
      {showScore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center bg-gradient-to-r from-[#FF407D]/10 to-[#FFCAD4]/10 rounded-lg p-3"
        >
          <span className="text-lg font-bold text-[#1B3C73]">{emojis.find((e) => e.value === value)?.label}</span>
          <div className="text-2xl font-bold text-[#FF407D] mt-1">Score: {value}/5</div>
        </motion.div>
      )}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pt-16">
      {/* Compact Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-r from-[#40679E] to-[#1B3C73] py-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-white mb-2"
            >
              Wellness Insights
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-[#FFCAD4] leading-relaxed max-w-2xl mx-auto"
            >
              Track your daily wellness and monitor your progress with personalized AI insights.
            </motion.p>
          </div>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Status Alert */}
        {!isWellnessServiceOnline && !isWellnessServiceChecking && (
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
                    Wellness Service Unavailable
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      The wellness tracking service is currently offline. You cannot add or edit wellness entries 
                      until the service is restored. Please check back later or contact support if this issue persists.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => checkService('Wellness API')}
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
        {isWellnessServiceChecking && (
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
                    Checking wellness service connection...
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add/Edit Entry Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={isWellnessServiceOnline ? { scale: 1.02 } : {}}
              whileTap={isWellnessServiceOnline ? { scale: 0.98 } : {}}
            >
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={!isWellnessServiceOnline}
                    className={`w-full py-6 text-lg shadow-lg transition-all duration-300 ${
                      isWellnessServiceOnline
                        ? "bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={() => setIsEditing(!!todayEntry)}
                  >
                    {!isWellnessServiceOnline ? (
                      <>
                        <WifiOff className="h-5 w-5 mr-2" />
                        Wellness Service Offline - Cannot Add/Edit Entries
                      </>
                    ) : todayEntry ? (
                      <>
                        <Edit className="h-5 w-5 mr-2" />
                        Edit Today's Wellness Entry
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Log Today's Wellness
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#1B3C73] text-center">
                      {isEditing ? "Edit Today's Wellness" : "Daily Wellness Check-in"}
                    </DialogTitle>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <motion.div
                        className="bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${tabProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    {/* Service offline warning inside dialog */}
                    {!isWellnessServiceOnline && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          <p className="text-sm text-red-700">
                            ⚠️ Wellness service is offline. You cannot save changes until the service is restored.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </DialogHeader>

                  <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-6 mb-6">
                      <TabsTrigger value="mood" className="text-xs">
                        Mood
                      </TabsTrigger>
                      <TabsTrigger value="energy" className="text-xs">
                        Energy
                      </TabsTrigger>
                      <TabsTrigger value="sleep" className="text-xs">
                        Sleep
                      </TabsTrigger>
                      <TabsTrigger value="physical" className="text-xs">
                        Physical
                      </TabsTrigger>
                      <TabsTrigger value="symptoms" className="text-xs">
                        Symptoms
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="text-xs">
                        Notes
                      </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                      <TabsContent value="mood" className="space-y-6 py-4">
                        <EmojiSelector
                          emojis={moodEmojis}
                          value={currentEntry.mood}
                          onChange={(value) => setCurrentEntry((prev) => ({ ...prev, mood: value }))}
                          title="How are you feeling today?"
                        />
                      </TabsContent>

                      <TabsContent value="energy" className="space-y-6 py-4">
                        <EmojiSelector
                          emojis={energyEmojis}
                          value={currentEntry.energy}
                          onChange={(value) => setCurrentEntry((prev) => ({ ...prev, energy: value }))}
                          title="What's your energy level?"
                        />
                      </TabsContent>

                      <TabsContent value="sleep" className="space-y-6 py-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-6"
                        >
                          <div className="space-y-4">
                            <Label className="text-xl font-bold text-[#1B3C73] block text-center">
                              Sleep Hours: {currentEntry.sleep}h
                            </Label>
                            <div className="px-4">
                              <Slider
                                value={[currentEntry.sleep]}
                                onValueChange={(value) => setCurrentEntry((prev) => ({ ...prev, sleep: value[0] }))}
                                max={12}
                                min={4}
                                step={0.5}
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-gray-500 mt-2">
                                <span>4h</span>
                                <span>8h</span>
                                <span>12h</span>
                              </div>
                            </div>
                          </div>

                          <EmojiSelector
                            emojis={sleepQualityEmojis}
                            value={currentEntry.sleepQuality}
                            onChange={(value) => setCurrentEntry((prev) => ({ ...prev, sleepQuality: value }))}
                            title="How was your sleep quality?"
                          />
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="physical" className="space-y-6 py-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-8"
                        >
                          <EmojiSelector
                            emojis={stressEmojis}
                            value={currentEntry.stress}
                            onChange={(value) => setCurrentEntry((prev) => ({ ...prev, stress: value }))}
                            title="What's your stress level?"
                          />

                          <div className="space-y-4">
                            <Label className="text-xl font-bold text-[#1B3C73] block text-center">
                              <Droplets className="inline w-6 h-6 mr-2" />
                              Water Intake: {currentEntry.water} glasses
                            </Label>
                            <div className="px-4">
                              <Slider
                                value={[currentEntry.water]}
                                onValueChange={(value) => setCurrentEntry((prev) => ({ ...prev, water: value[0] }))}
                                max={15}
                                min={0}
                                step={1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-gray-500 mt-2">
                                <span>0</span>
                                <span>8 (recommended)</span>
                                <span>15</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-xl font-bold text-[#1B3C73] block text-center">
                              Exercise/Activity
                            </Label>
                            <Select
                              value={currentEntry.exercise}
                              onValueChange={(value) => setCurrentEntry((prev) => ({ ...prev, exercise: value }))}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select your activity level" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="none">No Exercise</SelectItem>
                                <SelectItem value="light">Light Activity (Walking)</SelectItem>
                                <SelectItem value="moderate">Moderate Exercise (Yoga, Swimming)</SelectItem>
                                <SelectItem value="intense">Intense Workout (Running, HIIT)</SelectItem>
                                <SelectItem value="strength">Strength Training</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="symptoms" className="space-y-6 py-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-6"
                        >
                          <Label className="text-xl font-bold text-[#1B3C73] block text-center">
                            Any symptoms today?
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            {commonSymptoms.map((symptom) => (
                              <motion.button
                                key={symptom}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleSymptom(symptom)}
                                className={`p-4 text-sm font-medium rounded-xl border-2 transition-all duration-300 ${
                                  currentEntry.symptoms.includes(symptom)
                                    ? "bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] border-[#FF407D] text-white shadow-lg"
                                    : "bg-white border-gray-200 hover:border-[#FF407D] text-[#1B3C73] hover:shadow-md"
                                }`}
                              >
                                {symptom}
                              </motion.button>
                            ))}
                          </div>
                          {currentEntry.symptoms.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-center bg-gradient-to-r from-[#FF407D]/10 to-[#FFCAD4]/10 rounded-lg p-3"
                            >
                              <span className="text-lg font-bold text-[#1B3C73]">
                                {currentEntry.symptoms.length} symptom{currentEntry.symptoms.length > 1 ? "s" : ""}{" "}
                                selected
                              </span>
                            </motion.div>
                          )}
                          <div className="text-center text-sm text-[#40679E]">
                            {currentEntry.symptoms.length === 0 && "No symptoms? Great! Moving to notes..."}
                          </div>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="notes" className="space-y-6 py-4">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-4"
                        >
                          <Label className="text-xl font-bold text-[#1B3C73] block text-center">Additional Notes</Label>
                          <Textarea
                            placeholder="How was your day? Any additional thoughts or observations..."
                            value={currentEntry.notes}
                            onChange={(e) => setCurrentEntry((prev) => ({ ...prev, notes: e.target.value }))}
                            className="min-h-[120px] bg-white"
                            rows={6}
                          />
                        </motion.div>
                      </TabsContent>
                    </AnimatePresence>
                  </Tabs>

                  <motion.div whileHover={isWellnessServiceOnline ? { scale: 1.02 } : {}} whileTap={isWellnessServiceOnline ? { scale: 0.98 } : {}}>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || !isWellnessServiceOnline}
                      className={`w-full py-4 text-lg mt-6 shadow-lg transition-all duration-300 ${
                        isWellnessServiceOnline
                          ? "bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white disabled:opacity-50"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {!isWellnessServiceOnline
                        ? "Service Offline - Cannot Save"
                        : isLoading 
                          ? "Saving..." 
                          : isEditing ? "Update Wellness Entry" : "Save Wellness Entry"
                      }
                    </Button>
                  </motion.div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Weekly Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[#1B3C73]">
                    <TrendingUp className="h-5 w-5 text-[#FF407D]" />
                    {viewMode === "weekly" ? "Weekly" : "Monthly"} Progress
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "weekly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("weekly")}
                      className={viewMode === "weekly" ? "bg-[#FF407D] text-white" : ""}
                    >
                      Weekly
                    </Button>
                    <Button
                      variant={viewMode === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("monthly")}
                      className={viewMode === "monthly" ? "bg-[#FF407D] text-white" : ""}
                    >
                      Monthly
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Mood", value: getWeeklyAverage("mood"), max: 5, icon: "😊" },
                    { label: "Energy", value: getWeeklyAverage("energy"), max: 5, icon: "⚡" },
                    { label: "Sleep Quality", value: getWeeklyAverage("sleepQuality"), max: 5, icon: "😴" },
                    { label: "Hydration", value: getWeeklyAverage("water"), max: 8, icon: "💧" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          {item.label}
                        </span>
                        <span className="font-bold">
                          {item.value}/{item.max}
                        </span>
                      </div>
                      <Progress value={(item.value / item.max) * 100} className="h-3" />
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Wellness Score Tile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
                <DialogTrigger asChild>
                  <Card className="bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] text-white border-0 shadow-lg cursor-pointer transition-transform duration-300 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <Heart className="w-10 h-10 mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">Wellness Score</h3>
                      <p className="text-3xl font-bold mb-1">{calculateWellnessScore()}%</p>
                      <p className="text-sm opacity-90 flex items-center justify-center gap-1">
                        Click for details <ChevronRight className="w-4 h-4" />
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#1B3C73] text-center">Wellness Score Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-[#FF407D] mb-3">{calculateWellnessScore()}%</div>
                      <p className="text-[#40679E]">Your overall wellness score based on recent entries</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Mood Average", value: `${getWeeklyAverage("mood")}/5`, emoji: "😊" },
                        { label: "Energy Average", value: `${getWeeklyAverage("energy")}/5`, emoji: "⚡" },
                        { label: "Sleep Average", value: `${getWeeklyAverage("sleep")}h`, emoji: "😴" },
                        { label: "Total Entries", value: history.length.toString(), emoji: "📊" },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex justify-between items-center p-3 bg-gradient-to-r from-[#FF407D]/10 to-[#FFCAD4]/10 rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span>{item.emoji}</span>
                            {item.label}
                          </span>
                          <span className="font-bold text-[#FF407D]">{item.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Trends Tile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dialog open={isTrendsModalOpen} onOpenChange={setIsTrendsModalOpen}>
                <DialogTrigger asChild>
                  <Card className="bg-gradient-to-r from-[#40679E] to-[#1B3C73] text-white border-0 shadow-lg cursor-pointer transition-transform duration-300 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-10 h-10 mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">Wellness Trends</h3>
                      <p className="text-sm opacity-90 flex items-center justify-center gap-1">
                        View progress over time <ChevronRight className="w-4 h-4" />
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#1B3C73] text-center">Wellness Trends</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 mx-auto text-[#FF407D] mb-4" />
                      <h3 className="text-xl font-semibold text-[#1B3C73] mb-2">Coming Soon!</h3>
                      <p className="text-[#40679E]">
                        Detailed trend analysis is coming soon! Keep logging your wellness data to see patterns and
                        insights.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* AI Recommendations Tile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Dialog open={isRecommendationsModalOpen} onOpenChange={setIsRecommendationsModalOpen}>
                <DialogTrigger asChild>
                  <Card className="bg-gradient-to-r from-[#1B3C73] to-[#40679E] text-white border-0 shadow-lg cursor-pointer transition-transform duration-300 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <Brain className="w-10 h-10 mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">AI Recommendations</h3>
                      <p className="text-sm opacity-90 flex items-center justify-center gap-1">
                        Personalized insights <ChevronRight className="w-4 h-4" />
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-lg bg-white rounded-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#1B3C73] text-center">AI Health Recommendations</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Stress Management",
                        recommendation:
                          "Based on your recent stress levels, try 10 minutes of deep breathing exercises daily. Consider meditation apps or gentle yoga.",
                        icon: <Heart className="w-6 h-6 text-[#FF407D]" />,
                        priority: "high",
                      },
                      {
                        title: "Sleep Optimization",
                        recommendation:
                          "Your sleep quality could improve. Consider a consistent bedtime routine and limiting screen time before bed.",
                        icon: <Moon className="w-6 h-6 text-[#40679E]" />,
                        priority: "medium",
                      },
                      {
                        title: "Energy Boost",
                        recommendation:
                          "Light exercise or a 15-minute walk can help boost your energy levels naturally. Try morning stretches!",
                        icon: <Activity className="w-6 h-6 text-[#1B3C73]" />,
                        priority: "low",
                      },
                      {
                        title: "Hydration Goal",
                        recommendation:
                          "You're doing great with hydration! Keep up the good work and try adding lemon or cucumber for variety.",
                        icon: <Droplets className="w-6 h-6 text-[#22c55e]" />,
                        priority: "low",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={`border-l-4 ${
                            item.priority === "high"
                              ? "border-l-red-400 bg-red-50"
                              : item.priority === "medium"
                                ? "border-l-yellow-400 bg-yellow-50"
                                : "border-l-green-400 bg-green-50"
                          }`}
                        >
                          <CardContent className="p-4 flex gap-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[#1B3C73] mb-2 flex items-center gap-2">
                                {item.title}
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    item.priority === "high"
                                      ? "border-red-400 text-red-600"
                                      : item.priority === "medium"
                                        ? "border-yellow-400 text-yellow-600"
                                        : "border-green-400 text-green-600"
                                  }`}
                                >
                                  {item.priority}
                                </Badge>
                              </h4>
                              <p className="text-sm text-[#40679E] leading-relaxed">{item.recommendation}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Recent Entries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[#1B3C73]">
                    <Calendar className="h-5 w-5 text-[#FF407D]" />
                    Recent Entries
                  </CardTitle>
                  {history.length > 3 && (
                    <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[#FF407D] hover:text-[#e63946]">
                          <Eye className="w-4 h-4 mr-1" />
                          See More
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white rounded-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-[#1B3C73] text-center">Wellness History</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {history.map((entry, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-[#1B3C73]">{formatDate(entry.date)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">
                                    {moodEmojis.find((m) => m.value === entry.mood)?.emoji}
                                  </span>
                                  <span className="text-xl">
                                    {energyEmojis.find((e) => e.value === entry.energy)?.emoji}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-[#40679E] space-y-1">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>Sleep: {entry.sleep}h</div>
                                  <div>Water: {entry.water} glasses</div>
                                </div>
                                {(entry.symptoms?.length ?? 0) > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {entry.symptoms?.slice(0, 3).map((symptom, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs text-white bg-[#FF407D]">
                                        {symptom}
                                      </Badge>
                                    ))}
                                    {(entry.symptoms?.length ?? 0) > 3 && (
                                      <Badge variant="secondary" className="text-xs text-white bg-[#40679E]">
                                        +{(entry.symptoms?.length ?? 0) - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  {recentEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 mx-auto text-[#FF407D] mb-3 opacity-50" />
                      <p className="text-[#40679E]">No entries yet. Start tracking your wellness!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentEntries.slice(0, 3).map((entry, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-[#1B3C73]">{formatDate(entry.date)}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{moodEmojis.find((m) => m.value === entry.mood)?.emoji}</span>
                              <span className="text-lg">
                                {energyEmojis.find((e) => e.value === entry.energy)?.emoji}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-[#40679E] space-y-1">
                            <div>
                              Sleep: {entry.sleep}h | Water: {entry.water} glasses
                            </div>
                            {(entry.symptoms?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.symptoms?.slice(0, 3).map((symptom, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs text-white bg-[#FF407D]">
                                    {symptom}
                                  </Badge>
                                ))}
                                {(entry.symptoms?.length ?? 0) > 3 && (
                                  <Badge variant="secondary" className="text-xs text-white bg-[#40679E]">
                                    +{(entry.symptoms?.length ?? 0) - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
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
