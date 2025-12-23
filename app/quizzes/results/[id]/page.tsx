"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Brain, Sparkles, Wand2, Loader2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { analyzeQuizResultAction, QuizAnalysis, Question } from "@/lib/gemini"
import { toast } from "sonner"
import { motion } from "framer-motion"
import ReactMarkdown from 'react-markdown'

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [analysisLoading, setAnalysisLoading] = useState(true)

    const [questions, setQuestions] = useState<Question[]>([])
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [analysis, setAnalysis] = useState<QuizAnalysis | null>(null)
    const [interactiveFlashcards, setInteractiveFlashcards] = useState<any[]>([])

    // Load Data
    useEffect(() => {
        const loadResults = async () => {
            try {
                const qStr = localStorage.getItem("quizResults_questions");
                const aStr = localStorage.getItem("quizResults_answers");
                const fcStr = localStorage.getItem("flashcard_queue");

                if (!qStr || !aStr) {
                    toast.error("No results found. Redirecting...");
                    router.push("/dashboard");
                    return;
                }

                const qs: Question[] = JSON.parse(qStr);
                const as: Record<number, number> = JSON.parse(aStr);
                const ifc = fcStr ? JSON.parse(fcStr) : [];

                setQuestions(qs);
                setAnswers(as);
                setInteractiveFlashcards(ifc);
                setLoading(false);

                // Trigger AI Analysis
                analyzeResults(qs, as, ifc);

            } catch (e) {
                console.error("Failed to load results", e);
                router.push("/dashboard");
            }
        };
        loadResults();
    }, []);

    const analyzeResults = async (qs: Question[], as: Record<number, number>, interactiveCards: any[]) => {
        try {
            // Convert index answers to string answers for AI context
            const userAnswersContext: Record<number, string> = {};
            qs.forEach(q => {
                if (as[q.id] !== undefined) {
                    userAnswersContext[q.id] = q.options[as[q.id]];
                }
            });

            const result = await analyzeQuizResultAction(qs, userAnswersContext);

            // Merge interactive flashcards with AI flashcards
            // Avoid duplicates based on Front text
            const combinedFlashcards = [...interactiveCards];
            result.flashcards.forEach(aiCard => {
                if (!combinedFlashcards.some(existing => existing.front === aiCard.front)) {
                    combinedFlashcards.push(aiCard);
                }
            });

            setAnalysis({ ...result, flashcards: combinedFlashcards });
        } catch (error) {
            console.error(error);
            toast.error("AI Analysis failed.");
            // Fallback: show interactive cards if AI fails
            if (interactiveCards.length > 0) {
                setAnalysis({
                    score: 0, // Should be calculated locally if AI fails, but for now 0
                    total: qs.length,
                    feedback: "AI Analysis unavailable. Review your interactive flashcards below.",
                    flashcards: interactiveCards
                } as any)
            }
        } finally {
            setAnalysisLoading(false);
        }
    };

    // ... rest of component ...

    // Update Question Review Map to use ReactMarkdown
    /*
        Inside rendering:
        <ReactMarkdown>{q.question}</ReactMarkdown>
    */

    const handleSaveFlashcards = async () => {
        if (!analysis || analysis.flashcards.length === 0) return;

        const toastId = toast.loading("Saving flashcards...");
        try {
            // Import save function dynamically or strictly
            const { saveFlashcardsToDB } = await import("@/lib/actions");
            await saveFlashcardsToDB({
                topic: (analysis.flashcards[0] as any)?.topic || "Quiz Review", // Use topic from first card or default
                cards: analysis.flashcards
            });
            toast.success("Flashcards saved deck!", { id: toastId });
            router.push("/flashcards");

            // Clear queue
            localStorage.removeItem("flashcard_queue");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save flashcards", { id: toastId });
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    const scorePercentage = analysis ? Math.round((analysis.score / analysis.total) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* ... Header and Score Cards ... */}
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring" }}
                    className="inline-block p-4 rounded-full bg-primary/10 mb-4"
                >
                    <Brain className="h-12 w-12 text-primary" />
                </motion.div>
                <h1 className="text-4xl font-bold tracking-tight">Quiz Complete!</h1>
                <p className="text-muted-foreground text-lg">Here is how you performed.</p>
            </div>

            {/* Score & Feedback Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Score Card */}
                <Card className="flex flex-col items-center justify-center p-8 border-primary/20 shadow-lg bg-card relative overflow-hidden group hover:shadow-xl transition-all">
                    {/* ... Same Score Card Content ... */}
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-muted-foreground uppercase text-sm font-bold tracking-wider">Your Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center relative z-10 space-y-4">
                        {analysis ? (
                            <>
                                <div className="text-7xl font-black text-primary tracking-tighter">
                                    {Math.round((analysis.score / analysis.total) * 100)}%
                                </div>
                                <div className="inline-flex items-center px-4 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                    {analysis.score} out of {analysis.total} Correct
                                </div>
                            </>
                        ) : (
                            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                        )}
                    </CardContent>
                </Card>

                {/* AI Feedback Card */}
                <Card className="flex flex-col justify-center border-l-4 border-l-yellow-500 shadow-md bg-card">
                    {/* ... Same Feedback Content ... */}
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            AI Evaluation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analysisLoading ? (
                            <div className="flex flex-col gap-3 text-muted-foreground py-4">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="animate-pulse">Analyzing Correct & Incorrect answers...</span>
                                </div>
                                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                                    <div className="h-full bg-primary/50 animate-progress origin-left" style={{ width: '50%' }} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-lg leading-relaxed italic text-foreground/80 font-serif border-l-2 pl-4 border-muted">
                                    "{analysis?.feedback}"
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Questions Review */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    Review
                    <span className="text-sm font-normal text-muted-foreground ml-2">({questions.length} questions)</span>
                </h2>
                <div className="grid gap-4">
                    {questions.map((q, i) => {
                        const userAnsIdx = answers[q.id];
                        const isCorrect = q.options[userAnsIdx] === q.answer;

                        return (
                            <Card key={q.id} className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                                        <div className="space-y-2 flex-1">
                                            <div className="font-medium prose dark:prose-invert max-w-none">
                                                <ReactMarkdown>{q.question}</ReactMarkdown>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                                                <div className="bg-muted/50 p-2 rounded border">
                                                    <span className="text-xs text-muted-foreground block mb-1">Your Answer</span>
                                                    <span className={isCorrect ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                                        {q.options[userAnsIdx] || "Skipped"}
                                                    </span>
                                                </div>
                                                <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                                                    <span className="text-xs text-muted-foreground block mb-1">Correct Answer</span>
                                                    <span className="text-green-700 dark:text-green-400 font-medium">{q.answer}</span>
                                                </div>
                                            </div>
                                            {!isCorrect && q.explanation && (
                                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded mt-2">
                                                    <span className="font-bold mr-1">Why:</span> {q.explanation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Flashcards Recommendation */}
            {analysis && analysis.flashcards.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Separator className="my-8" />
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-6">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                            <Wand2 className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Turn Mistakes into Mastery</h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            We have identified {analysis.flashcards.length} key concepts to review.
                            {interactiveFlashcards.length > 0 && ` (${interactiveFlashcards.length} from interactive mode)`}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-6">
                            {analysis.flashcards.slice(0, 2).map((fc, i) => (
                                <div key={i} className="bg-background border rounded-lg p-3 text-sm shadow-sm opacity-80">
                                    <span className="font-semibold block mb-1 text-xs uppercase tracking-wide text-primary">Front</span>
                                    <ReactMarkdown>{fc.front}</ReactMarkdown>
                                </div>
                            ))}
                            {analysis.flashcards.length > 2 && (
                                <div className="flex items-center justify-center text-sm text-muted-foreground italic">
                                    + {analysis.flashcards.length - 2} more...
                                </div>
                            )}
                        </div>

                        <Button size="lg" onClick={handleSaveFlashcards} disabled={analysisLoading} className="rounded-full shadow-lg shadow-primary/20">
                            {analysisLoading ? <Loader2 className="animate-spin mr-2" /> : "Save Flashcards"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>
            )}

            <div className="flex justify-center pt-8 pb-20">
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
            </div>
        </div>
    )
}
