



import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowRight, Zap, RefreshCw } from "lucide-react"
import { getWeakAreasFromDB } from "@/lib/actions"
import Link from "next/link"

export default async function WeakAreasPage() {
    const weakAreas = await getWeakAreasFromDB();

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Weak Areas</h1>
                <p className="text-muted-foreground">Focus your energy where it matters most. AI-detected struggle points.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {weakAreas.map((area, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{area.topic}</CardTitle>
                                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                    {area.accuracy}% Acc.
                                </Badge>
                            </div>
                            <CardDescription>Last error: {area.lastMistake}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Proficiency</span>
                                    <span>Target: 80%</span>
                                </div>
                                <Progress value={area.accuracy} className="h-2 bg-red-100" indicatorClassName="bg-red-500" />
                            </div>
                            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2">
                                <Zap className="h-4 w-4 mt-0.5" />
                                <span>Rec: Review incorrect answers in Flashcards</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex md:flex-row flex-col gap-2">
                            <Button className="w-full md:w-1/2" variant="outline" size="sm" asChild>
                                <Link href={area.lastQuizId ? `/quizzes/results/${area.lastQuizId}` : '/quizzes'}>
                                    View Last Result
                                </Link>
                            </Button>
                            <Button className="w-full md:w-1/2" size="sm" asChild>
                                <Link href={`/flashcards?topic=${encodeURIComponent(area.topic)}`}>
                                    Train Flashcards <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {/* Empty State */}
                {weakAreas.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl">
                        <RefreshCw className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-xl font-semibold">All Clear!</h3>
                        <p className="text-muted-foreground">You don't have enough data or you're doing great!</p>
                        <Button className="mt-4" variant="outline" asChild>
                            <Link href="/create">Take a Quiz</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
