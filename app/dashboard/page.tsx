"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Clock, Trophy, ArrowRight, Sparkles, History, PlayCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getQuizzesFromDB, deleteQuizFromDB } from "@/lib/actions"

// ... inside component ...



const stats = [
    {
        title: "Quizzes Taken",
        value: "0",
        description: "Start your first quiz",
        icon: Target,
    },
    {
        title: "Avg. Score",
        value: "--",
        description: "Complete a quiz to see",
        icon: Trophy,
    },
    {
        title: "Learning Streak",
        value: "0 days",
        description: "Consistency is key",
        icon: Clock,
    },
]

export default function DashboardPage() {
    const [savedQuizzes, setSavedQuizzes] = useState<any[]>([])

    useEffect(() => {
        const loadQuizzes = async () => {
            // Fetch from MongoDB
            const quizzes = await getQuizzesFromDB();
            setSavedQuizzes(quizzes);
        };
        loadQuizzes();
    }, []);

    const deleteQuiz = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await deleteQuizFromDB(id);
            const updated = savedQuizzes.filter(q => q.id !== id);
            setSavedQuizzes(updated);
            toast.success("Quiz removed from database");
        } catch (error) {
            toast.error("Failed to delete quiz");
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Your personal AI learning hub.</p>
                </div>
                <Button asChild className="shadow-lg shadow-primary/20">
                    <Link href="/create">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create New Quiz
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Quizzes List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent Quizzes
                </h2>

                {savedQuizzes.length === 0 ? (
                    <Card className="bg-primary/5 border-primary/20 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">No activity yet</h3>
                            <p className="text-muted-foreground max-w-md">
                                It looks like you haven't taken any quizzes yet.
                                Generate a quiz from your notes or any topic to get started!
                            </p>
                            <Button size="lg" asChild className="mt-4">
                                <Link href="/create">Get Started Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {savedQuizzes.map((quiz) => (
                            <Link href={`/quizzes/play/${quiz.id}`} key={quiz.id}>
                                <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="leading-snug line-clamp-2">{quiz.title || quiz.topic}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {new Date(quiz.date).toLocaleDateString()} • {quiz.questions.length} Questions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="text-xs bg-muted px-2 py-1 rounded-md uppercase font-medium text-muted-foreground">
                                                {quiz.topic}
                                            </span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex justify-between items-center text-primary text-sm font-medium">
                                        <span className="flex items-center group-hover:underline">
                                            <PlayCircle className="mr-2 h-4 w-4" /> Play Now
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => deleteQuiz(quiz.id, e)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
