"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2, FileText, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { generateQuizAction } from "@/lib/gemini"
import { saveQuizToDB } from "@/lib/actions"

export default function CreateQuizPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("parse")

    // Parse State
    const [parseText, setParseText] = useState("")

    // Generate State
    const [topic, setTopic] = useState("")
    const [difficulty, setDifficulty] = useState("medium")
    const [count, setCount] = useState([10])

    const handleAction = async () => {
        setLoading(true)

        let textToAnalyze = "";
        let quizTitle = "";

        if (activeTab === 'parse') {
            if (!parseText) {
                toast.error("Please paste some text to analyze.");
                setLoading(false);
                return;
            }
            textToAnalyze = parseText;
            quizTitle = "Notes Analysis"; // Default title for parsed text
        } else {
            if (!topic) {
                toast.error("Please enter a topic.");
                setLoading(false);
                return;
            }
            // Synthesize a prompt 
            textToAnalyze = `Generate a ${difficulty} difficulty quiz about ${topic} with ${count[0]} questions.`;
            quizTitle = topic;
        }

        try {
            console.log("Generating quiz from:", textToAnalyze.substring(0, 50) + "...");

            const questions = await generateQuizAction(textToAnalyze);

            if (!questions || questions.length === 0) {
                throw new Error("No questions generated.");
            }

            // --- SAVE TO MONGODB ---
            const savedQuiz = await saveQuizToDB({
                title: quizTitle,
                topic: activeTab === 'generate' ? topic : 'Imported Content',
                difficulty: difficulty,
                questions: questions,
            });

            toast.success(`Success! Quiz added to your library.`);

            // Navigate to Quiz List
            router.push(`/quizzes`)

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to generate quiz. Try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
            <Card className="w-full max-w-2xl shadow-xl border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Create New Quiz
                    </CardTitle>
                    <CardDescription>
                        Use AI to master any subject. Parse notes or generate from scratch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="parse" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                            <TabsTrigger value="parse" className="text-base">
                                <FileText className="mr-2 h-4 w-4" />
                                Paste & Analyzel
                            </TabsTrigger>
                            <TabsTrigger value="generate" className="text-base">
                                <Wand2 className="mr-2 h-4 w-4" />
                                AI Generate
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="parse" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="parseText" className="text-sm font-medium">Paste Notes, Articles, or Questions</Label>
                                <Textarea
                                    id="parseText"
                                    placeholder="Paste your raw content here..."
                                    className="min-h-[300px] font-mono text-sm bg-muted/30 focus:bg-background transition-colors"
                                    value={parseText}
                                    onChange={(e) => setParseText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI will extract questions and correct answers automatically.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="generate" className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic / Subject</Label>
                                <Input
                                    id="topic"
                                    placeholder="e.g., Quantum Physics, French Revolution, React Hooks"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select value={difficulty} onValueChange={setDifficulty}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                            <SelectItem value="extreme">Extreme</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Question Count: {count[0]}</Label>
                                    </div>
                                    <Slider
                                        value={count}
                                        onValueChange={setCount}
                                        max={20}
                                        min={3}
                                        step={1}
                                        className="py-2"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20"
                        onClick={handleAction}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {activeTab === 'parse' ? 'Analyzing Content...' : 'Generating Quiz...'}
                            </>
                        ) : (
                            <>
                                {activeTab === 'parse' ? 'Generate Quiz from Text' : 'Generate Quiz'}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
