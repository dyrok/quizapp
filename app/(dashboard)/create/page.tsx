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
import { saveQuizToDB, generateQuizFromPDF } from "@/lib/actions"

export default function CreateQuizPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("parse")

    // Parse State
    const [parseText, setParseText] = useState("")
    const [file, setFile] = useState<File | null>(null)

    // Generate State
    const [topic, setTopic] = useState("")
    const [difficulty, setDifficulty] = useState("medium")
    const [count, setCount] = useState([10])

    const handleAction = async () => {
        setLoading(true)

        let textToAnalyze = "";
        let quizTitle = "";
        let generatedResult = null;

        try {
            if (activeTab === 'upload') {
                if (!file) {
                    toast.error("Please select a PDF file.");
                    setLoading(false);
                    return;
                }

                const formData = new FormData();
                formData.append("pdf", file);

                // Static import used instead of dynamic
                generatedResult = await generateQuizFromPDF(formData);

                quizTitle = file.name.replace(".pdf", "");

            } else if (activeTab === 'parse') {
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

            console.log("Generating quiz...");

            // If not PDF (already generated), use standard generation
            if (!generatedResult) {
                generatedResult = await generateQuizAction(textToAnalyze);
            }

            const { emoji, questions } = generatedResult;

            if (!questions || questions.length === 0) {
                throw new Error("No questions generated.");
            }

            // --- SAVE TO MONGODB ---
            const savedQuiz = await saveQuizToDB({
                title: quizTitle,
                topic: activeTab === 'generate' ? topic : 'Imported Content',
                emoji: emoji,
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
                        Use AI to master any subject. Parse notes, upload PDFs, or generate from scratch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
                            <TabsTrigger value="upload" className="text-base">
                                <FileText className="mr-2 h-4 w-4" />
                                Upload PDF
                            </TabsTrigger>
                            <TabsTrigger value="parse" className="text-base">
                                <FileText className="mr-2 h-4 w-4" />
                                Paste Text
                            </TabsTrigger>
                            <TabsTrigger value="generate" className="text-base">
                                <Wand2 className="mr-2 h-4 w-4" />
                                AI Generate
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors bg-muted/20">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Upload Study Material</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                                    Drag and drop a PDF here, or click to select. We'll extract questions automatically.
                                </p>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    className="max-w-xs cursor-pointer file:cursor-pointer file:text-primary file:font-semibold file:bg-primary/10 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-2 hover:file:bg-primary/20 transition-all"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                {file && (
                                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-600 bg-green-500/10 px-3 py-1 rounded-full">
                                        <Sparkles className="h-3 w-3" />
                                        {file.name} ready!
                                    </div>
                                )}
                            </div>
                        </TabsContent>

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
                                {activeTab === 'generate' ? 'Generating Quiz...' : 'Analyzing Document...'}
                            </>
                        ) : (
                            <>
                                {activeTab === 'upload' ? 'Generate from PDF' : activeTab === 'parse' ? 'Generate Quiz from Text' : 'Generate Quiz'}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
