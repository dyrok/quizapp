"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Flag, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, LayoutGrid, List, Zap, ZapOff, Flame, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Question } from "@/lib/gemini"
import { getQuizFromDB, saveQuizResultToDB } from "@/lib/actions"
import ReactMarkdown from 'react-markdown'
import { Switch } from "@/components/ui/switch"

export default function QuizPlayPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()

    // State
    const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null)
    const [loading, setLoading] = useState(true)

    const [currentQIndex, setCurrentQIndex] = useState(0)

    // Core Quiz State
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [flagged, setFlagged] = useState<number[]>([])
    const [visited, setVisited] = useState<number[]>([1]) // Track visited questions, start with first

    // Interactive Mode State
    const [interactiveMode, setInteractiveMode] = useState(false)
    const [flashcardQueue, setFlashcardQueue] = useState<any[]>([])
    const [instantFeedback, setInstantFeedback] = useState<{ isCorrect: boolean, correctAnswer?: string } | null>(null)
    const [streak, setStreak] = useState(0)
    const [showGhost, setShowGhost] = useState(false)

    // Metadata
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes default

    // UI State
    const [showGrid, setShowGrid] = useState(false)

    // Load Quiz Data
    useEffect(() => {
        const loadQuiz = async () => {
            const quizId = unwrappedParams.id;
            try {
                // Try fetching from MongoDB actions
                const quiz = await getQuizFromDB(quizId);

                if (quiz) {
                    setQuizQuestions(quiz.questions);
                    setLoading(false);
                    return;
                }

                // Fallback for immediate 'currentQuiz' if direct navigation (legacy support)
                const currentStored = localStorage.getItem("currentQuiz");
                if (currentStored && quizId === 'custom') {
                    setQuizQuestions(JSON.parse(currentStored));
                    setLoading(false);
                    return;
                }

                // Not found
                console.warn("Quiz not found:", quizId);
                setQuizQuestions([]);
                setLoading(false);

            } catch (e) {
                console.error("Failed to load quiz", e);
                setQuizQuestions([]);
                setLoading(false);
            }
        };
        loadQuiz();
    }, [unwrappedParams.id]);


    // Timer
    useEffect(() => {
        if (!quizQuestions || quizQuestions.length === 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [quizQuestions])

    // Add current question to visited list whenever index changes
    useEffect(() => {
        if (quizQuestions && quizQuestions[currentQIndex]) {
            const currentId = quizQuestions[currentQIndex].id;
            if (!visited.includes(currentId)) {
                setVisited(prev => [...prev, currentId]);
            }
            // Reset instant feedback on new question
            setInstantFeedback(null);
        }
    }, [currentQIndex, quizQuestions, visited]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    const handleOptionSelect = (value: string) => {
        if (!quizQuestions) return;

        // If interactive mode is on and already answered correctly, prevent changing? 
        // Or if handled, just let them change. 
        // For simple interactive mode: ONE try.
        if (interactiveMode && instantFeedback) return; // Prevent changing after feedback

        const currentQ = quizQuestions[currentQIndex];
        const selectedIdx = parseInt(value);
        setAnswers(prev => ({ ...prev, [currentQ.id]: selectedIdx }))

        if (interactiveMode) {
            const selectedOption = currentQ.options[selectedIdx];
            const isCorrect = selectedOption === currentQ.answer;

            setInstantFeedback({
                isCorrect,
                correctAnswer: isCorrect ? undefined : currentQ.answer
            });

            if (isCorrect) {
                setStreak(prev => prev + 1);
                toast.success("Correct!", { duration: 1500 });
            } else {
                setStreak(0);
                // Trigger Ghost Box
                setShowGhost(true);
                setTimeout(() => setShowGhost(false), 2500);

                // Auto-add to flashcard queue
                if (!flashcardQueue.some(fc => fc.front === currentQ.question)) {
                    setFlashcardQueue(prev => [...prev, {
                        front: currentQ.question,
                        back: currentQ.answer,
                        topic: "Incorrect Answer"
                    }])
                }
            }
        }
    }

    const handleNext = () => {
        if (!quizQuestions) return;
        if (currentQIndex < quizQuestions.length - 1) {
            setCurrentQIndex(prev => prev + 1)
        } else {
            finishQuiz();
        }
    }

    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1)
        }
    }

    const jumpToQuestion = (index: number) => {
        setCurrentQIndex(index);
        setShowGrid(false); // Close grid on selection mobile
    }

    const finishQuiz = async () => {
        // Calculate score
        let score = 0;
        const wrongAnswers: any[] = [];

        if (quizQuestions) {
            quizQuestions.forEach((q) => {
                const userAnsIndex = answers[q.id];
                const userAnsText = q.options && userAnsIndex !== undefined ? q.options[userAnsIndex] : "Skipped";

                if (userAnsText === q.answer) {
                    score++;
                } else {
                    wrongAnswers.push({
                        question: q.question,
                        correctAnswer: q.answer,
                        userAnswer: userAnsText
                    });
                }
            });

            // Save Result to DB
            try {
                const quizId = unwrappedParams.id;
                if (quizId !== 'custom') {
                    await saveQuizResultToDB({
                        quizId: quizId,
                        topic: "General", // Placeholder
                        score: score,
                        totalQuestions: quizQuestions.length,
                        wrongAnswers: wrongAnswers
                    });
                    toast.success("Quiz Submitted & Saved!");
                } else {
                    toast.success("Quiz Submitted!");
                }

            } catch (error) {
                console.error("Failed to save results", error);
            }
        }

        // Save flashcard queue to local storage so Results page can pick it up or Flashcards page
        if (flashcardQueue.length > 0) {
            localStorage.setItem("flashcard_queue", JSON.stringify(flashcardQueue));
        }

        // Save answers to local storage (legacy path for results page)
        localStorage.setItem("quizResults_answers", JSON.stringify(answers));
        localStorage.setItem("quizResults_questions", JSON.stringify(quizQuestions));
        router.push(`/quizzes/results/${unwrappedParams.id}`)
    }

    const toggleFlag = () => {
        if (!quizQuestions) return;
        const currentQ = quizQuestions[currentQIndex];

        if (flagged.includes(currentQ.id)) {
            setFlagged(prev => prev.filter(id => id !== currentQ.id))
        } else {
            setFlagged(prev => [...prev, currentQ.id])
        }
    }

    // --- Render Logic ---

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

    if (!quizQuestions || quizQuestions.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <h2 className="text-xl font-semibold">Quiz Not Found</h2>
                <div className="text-muted-foreground text-center">
                    This quiz may have been deleted or does not exist.
                </div>
                <Button onClick={() => router.push('/dashboard')}>Return Home</Button>
            </div>
        )
    }

    const currentQ = quizQuestions[currentQIndex];
    const isLastQuestion = currentQIndex === quizQuestions.length - 1;

    // Status Logic for Grid
    const getQuestionStatus = (qId: number, index: number) => {
        if (currentQIndex === index) return "current";
        if (flagged.includes(qId)) return "flagged";
        if (answers[qId] !== undefined) return "answered";
        if (visited.includes(qId)) return "visited";
        return "unvisited";
    }

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6">

            {/* Top Bar: Progress & Timer */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quiz Session</h1>
                    <p className="text-sm text-muted-foreground">Focus and do your best.</p>
                </div>

                {/* Interactive Mode Toggle */}
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
                    <Switch
                        checked={interactiveMode}
                        onCheckedChange={setInteractiveMode}
                        id="interactive-mode"
                    />
                    <Label htmlFor="interactive-mode" className="cursor-pointer flex items-center gap-2 text-sm font-medium">
                        {interactiveMode ? <Zap className="h-4 w-4 text-yellow-500 fill-current" /> : <ZapOff className="h-4 w-4 text-muted-foreground" />}
                        Interactive Mode
                    </Label>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Streak Counter */}
                    {interactiveMode && streak > 1 && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-500/20 animate-in fade-in slide-in-from-top-1">
                            <Flame className="h-4 w-4 fill-current" />
                            <span className="font-bold text-sm">{streak} Streak!</span>
                        </div>
                    )}

                    <Card className="flex-1 md:w-48 flex items-center justify-center py-2 px-4 shadow-sm border-primary/20">
                        <div className={`flex items-center text-xl font-bold font-mono transition-colors ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-primary"}`}>
                            <Clock className="mr-2 h-5 w-5" />
                            {formatTime(timeLeft)}
                        </div>
                    </Card>
                    <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setShowGrid(!showGrid)}
                    >
                        {showGrid ? <List className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Main Content Area (Questions) */}
                <div className="lg:col-span-9 space-y-6">
                    <Card className="min-h-[500px] flex flex-col justify-between shadow-lg border-t-4 border-t-primary">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="space-y-1">
                                <Badge variant="secondary" className="mb-2">
                                    Question {currentQIndex + 1} of {quizQuestions.length}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="icon" onClick={toggleFlag} className={flagged.includes(currentQ.id) ? "text-yellow-500 bg-yellow-500/10" : "text-muted-foreground hover:bg-muted"}>
                                <Flag className={flagged.includes(currentQ.id) ? "fill-current h-5 w-5 dark:text-yellow-400" : "h-5 w-5"} />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Question Text with Markdown Support */}
                            <div className="prose dark:prose-invert prose-lg max-w-none text-foreground/90 leading-relaxed font-serif">
                                <ReactMarkdown
                                    components={{
                                        code({ node, className, children, ...props }) {
                                            return (
                                                <code className={`${className} bg-muted-foreground/10 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-primary font-semibold`} {...props}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        pre({ node, children, ...props }) {
                                            return (
                                                <pre className="bg-zinc-950 dark:bg-zinc-900 px-4 py-3 rounded-lg overflow-x-auto border border-zinc-200 dark:border-zinc-800 my-4 shadow-sm text-sm font-mono whitespace-pre-wrap" {...props}>
                                                    {children}
                                                </pre>
                                            )
                                        }
                                    }}
                                >
                                    {currentQ.question}
                                </ReactMarkdown>
                            </div>

                            <Separator />

                            {/* Options */}
                            <RadioGroup
                                value={answers[currentQ.id]?.toString()}
                                onValueChange={handleOptionSelect}
                                className="space-y-3 pt-2"
                                disabled={interactiveMode && !!instantFeedback}
                            >
                                {currentQ.options && currentQ.options.map((option, idx) => {
                                    const isSelected = answers[currentQ.id] === idx;

                                    // Feedback Styles
                                    let feedbackClass = "";
                                    if (interactiveMode && isSelected && instantFeedback) {
                                        if (instantFeedback.isCorrect) feedbackClass = "border-green-500 bg-green-500/10";
                                        else feedbackClass = "border-red-500 bg-red-500/10";
                                    }
                                    // Highlight correct answer if wrong
                                    if (interactiveMode && instantFeedback && !instantFeedback.isCorrect && option === instantFeedback.correctAnswer) {
                                        feedbackClass = "border-green-500 bg-green-500/10 ring-2 ring-green-500/30";
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => !((interactiveMode && !!instantFeedback)) && handleOptionSelect(idx.toString())}
                                            className={`
                                            flex items-center space-x-3 rounded-xl border-2 p-4 transition-all cursor-pointer group
                                            ${isSelected && !feedbackClass
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : feedbackClass || "border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20"}
                                        `}
                                        >
                                            <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                            <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-medium text-base leading-snug group-hover:text-foreground/80">
                                                {option}
                                            </Label>

                                            {/* Status Icons */}
                                            {interactiveMode && isSelected && instantFeedback && instantFeedback.isCorrect && (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            )}
                                            {interactiveMode && isSelected && instantFeedback && !instantFeedback.isCorrect && (
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                    )
                                })}
                            </RadioGroup>

                            {/* Explanation if Wrong in Interactive Mode */}
                            {interactiveMode && instantFeedback && !instantFeedback.isCorrect && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-lg border text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                                        <p className="font-semibold text-foreground mb-1">Incorrect</p>
                                        <p className="mb-2">This question has been automatically added to your flashcards.</p>
                                    </div>
                                </div>
                            )}

                            {/* Ghost Box Animation for Flashcard Creation */}
                            <AnimatePresence>
                                {showGhost && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                        className="fixed bottom-8 right-8 z-50 bg-background border border-border shadow-2xl p-4 rounded-xl flex items-center gap-4 w-80 pointer-events-none"
                                    >
                                        <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                            <Zap className="h-6 w-6 text-primary animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Creating Flashcard...</p>
                                            <p className="text-xs text-muted-foreground">Adding specific mistake to deck</p>
                                        </div>
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-ping ml-auto" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </CardContent>
                        <CardFooter className="flex justify-between border-t mt-4 bg-muted/5 py-4">
                            <Button variant="ghost" onClick={handlePrev} disabled={currentQIndex === 0} className="hover:bg-muted/80">
                                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <Button onClick={handleNext} className="shadow-lg shadow-primary/20 px-8">
                                {isLastQuestion ? "Submit Quiz" : "Next Question"}
                                {isLastQuestion ? <CheckCircle className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Navigation Grid (Sidebar) */}
                <div className={`
                    lg:col-span-3 space-y-6 lg:block
                    ${showGrid ? "block fixed inset-0 z-50 bg-background/95 p-6 overflow-y-auto" : "hidden"} 
                    lg:relative lg:bg-transparent lg:p-0 lg:z-auto
                `}>
                    {/* Mobile Close Button */}
                    {showGrid && (
                        <div className="flex justify-end lg:hidden mb-4">
                            <Button variant="ghost" onClick={() => setShowGrid(false)}>Close</Button>
                        </div>
                    )}

                    <Card className="shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Question Navigator</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-5 gap-2">
                                {quizQuestions.map((q, idx) => {
                                    const status = getQuestionStatus(q.id, idx);
                                    let baseClass = "h-10 w-10 text-sm font-medium transition-all hover:scale-105 shadow-sm";
                                    let colorClass = "bg-muted text-muted-foreground hover:bg-muted/80"; // Unvisited

                                    if (status === "current") colorClass = "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary z-10 scale-110";
                                    else if (status === "flagged") colorClass = "bg-yellow-500 text-white hover:bg-yellow-600";
                                    else if (status === "answered") colorClass = "bg-green-500 text-white hover:bg-green-600";
                                    else if (status === "visited") colorClass = "bg-muted-foreground/30 text-foreground hover:bg-muted-foreground/40"; // Visited but not answered

                                    return (
                                        <Button
                                            key={q.id}
                                            variant="ghost"
                                            className={`${baseClass} ${colorClass}`}
                                            onClick={() => jumpToQuestion(idx)}
                                        >
                                            {status === "flagged" ? <Flag className="h-3 w-3 fill-current" /> : idx + 1}
                                        </Button>
                                    )
                                })}
                            </div>

                            <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-primary" /> Current
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500" /> Answered
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" /> Flagged
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-muted" /> Not Visited
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10">
                        <CardContent className="p-4 flex flex-col gap-2">
                            <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={finishQuiz}>
                                End & Submit Quiz
                            </Button>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div >
    )
}
