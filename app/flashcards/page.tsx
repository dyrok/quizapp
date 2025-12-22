"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, RotateCw, Star, ThumbsDown, Check, Layers, Play } from "lucide-react"
import { getFlashcardSetsFromDB } from "@/lib/actions"
import { toast } from "sonner"

import { useSearchParams } from "next/navigation"

import ReactMarkdown from "react-markdown"

export default function FlashcardsPage() {
    const searchParams = useSearchParams()
    const topicParam = searchParams.get("topic")

    const [sets, setSets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSet, setActiveSet] = useState<any>(null)

    // Review State
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    // Load Sets
    useEffect(() => {
        const loadSets = async () => {
            try {
                const data = await getFlashcardSetsFromDB();
                if (topicParam) {
                    setSets(data.filter((s: any) => s.topic === topicParam));
                } else {
                    setSets(data);
                }
            } catch (e) {
                console.error("Failed to load flashcards", e);
                toast.error("Failed to load flashcards");
            } finally {
                setLoading(false);
            }
        }
        loadSets();
    }, [topicParam])

    const startReview = (set: any) => {
        setActiveSet(set)
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    const exitReview = () => {
        setActiveSet(null)
    }

    // --- Review Logic ---
    const handleNext = () => {
        setIsFlipped(false)
        if (activeSet && currentIndex < activeSet.cards.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setCurrentIndex(0) // Loop back for now
            toast.success("Deck completed! Starting over.")
        }
    }

    const handlePrev = () => {
        setIsFlipped(false)
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading flashcards...</div>

    // LIST VIEW
    if (!activeSet) {
        return (
            <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
                    <p className="text-muted-foreground">Review your saved knowledge decks.</p>
                </div>

                {sets.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No Flashcard Decks</h3>
                        <p className="text-muted-foreground">Complete a quiz and save the results to create flashcards.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sets.map((set) => (
                            <Card key={set.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => startReview(set)}>
                                <CardHeader>
                                    <CardTitle>{set.topic}</CardTitle>
                                    <CardDescription>{new Date(set.date).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Layers className="h-4 w-4" />
                                        {set.cards.length} Cards
                                    </div>
                                    <Button className="w-full mt-4" variant="secondary">
                                        Review Deck <Play className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // REVIEW VIEW
    const currentCard = activeSet.cards[currentIndex]

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 space-y-8 animate-in fade-in zoom-in-95">
            <div className="flex gap-4 w-full max-w-xl justify-between items-center">
                <Button variant="ghost" onClick={exitReview} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Decks
                </Button>
                <div className="font-semibold">{activeSet.topic}</div>
            </div>

            <div className="w-full max-w-xl flex items-center justify-between text-muted-foreground">
                <span>Card {currentIndex + 1} / {activeSet.cards.length}</span>
                <Progress value={((currentIndex + 1) / activeSet.cards.length) * 100} className="w-[100px]" />
            </div>

            <div className="group w-full max-w-xl h-[400px] perspective-1000">
                <div
                    className={`relative w-full h-full transition-all duration-500 transform preserve-3d cursor-pointer ${isFlipped ? "rotate-y-180" : ""}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front */}
                    <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 text-center border-2 hover:border-primary/50 transition-colors shadow-xl">
                        <CardContent className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Question</h3>
                            <div className="prose dark:prose-invert prose-lg max-w-none text-foreground/90 font-serif leading-relaxed">
                                <ReactMarkdown>{currentCard.front}</ReactMarkdown>
                            </div>
                        </CardContent>
                        <div className="absolute bottom-4 text-xs text-muted-foreground animate-pulse">
                            Click to reveal answer
                        </div>
                    </Card>

                    {/* Back */}
                    <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-muted/30 flex flex-col items-center justify-center p-8 text-center border-dashed border-2 shadow-inner">
                        <CardContent className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Answer</h3>
                            <p className="text-xl leading-relaxed">{currentCard.back}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <Button
                    className="w-40 gap-2 shadow-lg shadow-primary/20"
                    onClick={handleNext}
                >
                    Next Card <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
