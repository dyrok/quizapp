

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, BookOpen, Search, Play, MoreVertical } from "lucide-react"
import Link from "next/link"

// Imports already handled above
import { getQuizzesFromDB } from "@/lib/actions"

// Define props for Server Component
interface QuizzesPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function QuizzesPage({ searchParams }: QuizzesPageProps) {
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
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {quizzes.map((quiz) => (
                                <Card key={quiz.id} className="flex flex-col hover:border-primary/50 transition-colors">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant="secondary">
                                                {quiz.topic}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {new Date(quiz.date).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-2 line-clamp-2 leading-tight">{quiz.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{quiz.questions.length} Questions</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" asChild>
                                            <Link href={`/quizzes/play/${quiz.id}`}>
                                                Start Quiz
                                                <Play className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

