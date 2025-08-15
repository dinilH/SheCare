"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Calendar, TrendingUp, MessageCircle, Newspaper, Shield, Users, Brain } from "lucide-react"
import { ServiceStatusIndicator } from "@/components/service-status-indicator"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-light via-white to-primary-light py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-secondary-dark mb-6">
                Your Wellness.{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Our Mission.
                </span>
              </h1>
              <p className="text-xl text-secondary mb-8 leading-relaxed">
                Empowering women with AI-powered health insights, period tracking, wellness monitoring, and personalized
                care recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/wellness">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 text-lg bg-transparent"
                  >
                    Explore Features
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card p-8 rounded-3xl">
                <Image
                  src="/lady_doctor.jpg?height=500&width=600&text=SheCare+Dashboard"
                  alt="SheCare Dashboard"
                  width={600}
                  height={500}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section - Tile Layout */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Service Status Indicator */}
          <ServiceStatusIndicator />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-dark mb-4">Comprehensive Women's Health</h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Everything you need for your health journey in one intelligent platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Awareness & Education",
                description: "Evidence-based health information and educational resources",
                gradient: "from-primary to-primary-light",
              },
              {
                icon: Users,
                title: "Emotional Support",
                description: "Community support and peer connections for mental wellness",
                gradient: "from-secondary to-primary",
              },
              {
                icon: Brain,
                title: "AI Health Assistant",
                description: "Personalized recommendations powered by advanced AI",
                gradient: "from-primary to-secondary",
              },
              {
                icon: Heart,
                title: "Holistic Care",
                description: "Complete wellness tracking for mind, body, and spirit",
                gradient: "from-secondary-dark to-secondary",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="glass-card h-full hover:scale-105 transition-all duration-300 border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-dark mb-2">{item.title}</h3>
                    <p className="text-secondary text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Wellness Preview Section */}
      <section className="py-20 bg-gradient-to-br from-primary-light/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-dark mb-6">Track Your Wellness Journey</h2>
              <p className="text-xl text-secondary mb-8 leading-relaxed">
                Monitor your emotional and physical well-being with our intuitive wellness tracking system. Get
                personalized insights and AI-powered recommendations.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Mood and emotion tracking with smart analytics",
                  "Physical wellness monitoring and trends",
                  "Personalized AI recommendations for better health",
                  "Beautiful visualizations of your wellness journey",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
              <Link href="/wellness">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                  Start Tracking Wellness
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="glass-card p-8 rounded-3xl">
                <Image
                  src="/three_woman_2.jpg?height=400&width=500&text=Wellness+Dashboard"
                  alt="Wellness Dashboard Preview"
                  width={500}
                  height={400}
                  className="rounded-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-dark mb-4">
              Powerful Features for Your Health
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              Discover all the tools you need to take control of your health and wellness
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Smart Period Tracking",
                description: "AI-powered predictions and cycle analysis",
                href: "/my-period",
                color: "primary",
              },
              {
                icon: TrendingUp,
                title: "Wellness Analytics",
                description: "Track mood, energy, and physical wellness",
                href: "/wellness",
                color: "secondary",
              },
              {
                icon: MessageCircle,
                title: "AI Health Assistant",
                description: "24/7 support for health questions and concerns",
                href: "/chat-with-bot",
                color: "primary",
              },
              {
                icon: Newspaper,
                title: "Personalized News",
                description: "Curated health news and educational content",
                href: "/news",
                color: "secondary-dark",
              },
              {
                icon: Heart,
                title: "Community Support",
                description: "Connect with others on similar health journeys",
                href: "/contact-us",
                color: "primary",
              },
              {
                icon: Shield,
                title: "Privacy First",
                description: "Your health data is secure and private",
                href: "/profile",
                color: "secondary",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={feature.href}>
                  <Card className="glass-card h-full hover:scale-105 transition-all duration-300 border-0 shadow-lg cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-secondary-dark mb-3">{feature.title}</h3>
                      <p className="text-secondary leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Health Journey?</h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join thousands of women who trust SheCare for their wellness and health tracking needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary px-8 py-3 text-lg bg-transparent"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
