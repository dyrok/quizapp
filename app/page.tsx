"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Brain, Zap, Target } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between z-10 glass-nav border-b bg-background/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">QuizMaster AI</span>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">Log In</Button>
          </Link>
          <Link href="/create">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 sm:mt-0 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border mb-8 shadow-sm backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-muted-foreground">Powered by Gemini 2.0 Flash</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl"
        >
          Master Any Subject with <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">AI-Powered</span> Learning
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          Turn your notes into interactive quizzes, get instant feedback, and create smart flashcards automatically. The smartest way to study.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/create">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-primary/25 transition-all">
              Create a Quiz <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2">
              View Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-yellow-500" />}
            title="Instant Generation"
            desc="Paste any text or notes. Our AI generates a comprehensive quiz in seconds."
            delay={0.4}
          />
          <FeatureCard
            icon={<Target className="h-6 w-6 text-red-500" />}
            title="Smart Analysis"
            desc="Get detailed feedback on what you got wrong and why. Identify weak spots instantly."
            delay={0.5}
          />
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-blue-500" />}
            title="Auto Flashcards"
            desc="Automatically turn your mistakes into spaced-repetition flashcards."
            delay={0.6}
          />
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t mt-20 bg-muted/20">
        <p>© 2024 QuizMaster AI. Built for smart learners.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center border mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </motion.div>
  )
}
