"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.userName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions")
      return
    }

    console.log("Signup attempt:", formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Image Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src="/woman_with_her_phone.jpg?height=400&width=400&text=Join+SheCare"
              alt="Woman smiling"
              fill
              className="object-cover"
            />
          </div>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] bg-clip-text text-transparent mb-2">
                  Join SheCare
                </h1>
                <p className="text-[#40679E]">Start your wellness journey today</p>
              </div>

              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="userName" className="text-[#1B3C73] font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="userName"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="mt-1 bg-white/80 border-[#FFCAD4]/30 focus:border-[#FF407D] rounded-xl h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-[#1B3C73] font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="mt-1 bg-white/80 border-[#FFCAD4]/30 focus:border-[#FF407D] rounded-xl h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-[#1B3C73] font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    className="mt-1 bg-white/80 border-[#FFCAD4]/30 focus:border-[#FF407D] rounded-xl h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-[#1B3C73] font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="mt-1 bg-white/80 border-[#FFCAD4]/30 focus:border-[#FF407D] rounded-xl h-10"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))
                    }
                    className="border-[#FF407D] data-[state=checked]:bg-[#FF407D]"
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm text-[#40679E]">
                    I agree to the Terms and Conditions
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FF407D] to-[#FFCAD4] hover:from-[#FFCAD4] hover:to-[#FF407D] text-white h-10 rounded-xl font-semibold"
                >
                  Create Account
                </Button>

                <div className="text-center">
                  <span className="text-[#40679E]">Already have an account? </span>
                  <Link href="/login" className="text-[#FF407D] font-semibold hover:text-[#e63946] transition-colors">
                    Sign In
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
