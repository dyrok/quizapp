

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, BookOpen, Search, Play, MoreVertical, Edit } from "lucide-react"
import Link from "next/link"

// Imports already handled above
import { getQuizzesFromDB } from "@/lib/actions"
import { EvervaultCard, Icon } from "@/components/ui/evervault-card"

export default async function QuizzesPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    // Fetch quizzes directly from DB (Server Component)
    const allQuizzes = await getQuizzesFromDB();

    // Filter logic
    const topicParam = typeof searchParams.topic === 'string' ? searchParams.topic : undefined;
    const searchParam = typeof searchParams.search === 'string' ? searchParams.search : undefined;

    const quizzes = allQuizzes.filter(quiz => {
        const matchesTopic = topicParam ? quiz.topic === topicParam : true;
        const matchesSearch = searchParam ? quiz.title.toLowerCase().includes(searchParam.toLowerCase()) : true;
        return matchesTopic && matchesSearch;
    });

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
                    {topicParam && <Badge className="text-lg py-1 px-3">{topicParam}</Badge>}
                </div>
                <p className="text-muted-foreground">{topicParam ? `Showing quizzes for ${topicParam}` : "Browse your generated quizzes."}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search quizzes..." />
                </div>
                <Button asChild>
                    <Link href="/create">Create New Quiz</Link>
                </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All Quizzes</TabsTrigger>
                    {/* Future: Add dynamic tabs based on topics */}
                </TabsList>
                <TabsContent value="all" className="mt-6">
                    {quizzes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {topicParam ? "No quizzes found for this topic." : "No quizzes found. Create one to get started!"}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {quizzes.map((quiz) => (
                                <div key={quiz.id} className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start p-4 relative hover:shadow-lg transition-shadow bg-card rounded-xl overflow-hidden">
                                    <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
                                    <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
                                    <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
                                    <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

                                    <div className="w-full flex justify-center items-center h-full min-h-[250px] mb-4 relative z-0">
                                        <EvervaultCard text={quiz.emoji || quiz.title.charAt(0) || "Q"} className="h-full w-full" />
                                    </div>

                                    <div className="relative z-10 w-full mt-2">
                                        <h2 className="dark:text-white text-black text-xl font-bold line-clamp-1">
                                            {quiz.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                            <Badge variant="outline">{quiz.topic}</Badge>
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" /> {quiz.questions.length}
                                            </span>
                                            <span className="text-xs">
                                                {new Date(quiz.date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 mt-4 w-full">
                                            <Button className="flex-1 rounded-full dark:bg-white dark:text-black" asChild>
                                                <Link href={`/quizzes/play/${quiz.id}`}>
                                                    Start Quiz
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="icon" className="rounded-full" asChild>
                                                <Link href={`/quizzes/edit/${quiz.id}`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

