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
import { Sparkles, Loader2, FileText, Wand2, Braces, Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { generateQuizAction } from "@/lib/gemini"
import { saveQuizToDB, generateQuizFromPDF } from "@/lib/actions"

const JSON_SCHEMA_PROMPT = `You are a quiz generator. Output ONLY valid JSON with no extra text, no markdown fences, no explanations.

The JSON must follow this exact structure:

{
  "title": "Quiz title here",
  "topic": "Topic name here",
  "emoji": "📝",
  "questions": [
    {
      "id": 1,
      "question": "Your question text here. Use markdown code blocks for code snippets.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "explanation": "Brief explanation of why this answer is correct."
    }
  ]
}

Rules:
- "answer" must exactly match one of the strings in "options"
- "id" must be a sequential integer starting from 1
- "options" must have exactly 4 items
- "emoji" should represent the topic (e.g. "⚛️" for Physics, "🧬" for Biology)
- For code questions, use markdown fenced code blocks inside the "question" string
- Output ONLY the JSON object, nothing else`

const EXAMPLE_JSON = `{
  "title": "JavaScript Basics",
  "topic": "JavaScript",
  "emoji": "🟨",
  "questions": [
    {
      "id": 1,
      "question": "What does \`typeof null\` return in JavaScript?",
      "options": ["null", "undefined", "object", "boolean"],
      "answer": "object",
      "explanation": "This is a historical bug in JavaScript — typeof null returns 'object' even though null is not an object."
    },
    {
      "id": 2,
      "question": "Which keyword declares a block-scoped variable?",
      "options": ["var", "let", "function", "const"],
      "answer": "let",
      "explanation": "let and const are block-scoped. var is function-scoped."
    }
  ]
}`

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

    // JSON Import State
    const [jsonInput, setJsonInput] = useState("")
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [jsonValid, setJsonValid] = useState(false)
    const [promptCopied, setPromptCopied] = useState(false)

    const validateJson = (value: string) => {
        setJsonInput(value)
        setJsonError(null)
        setJsonValid(false)
        if (!value.trim()) return

        try {
            const parsed = JSON.parse(value)

            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                setJsonError('Missing "questions" array.')
                return
            }
            if (parsed.questions.length === 0) {
                setJsonError('"questions" array is empty.')
                return
            }

            for (let i = 0; i < parsed.questions.length; i++) {
                const q = parsed.questions[i]
                if (!q.question) { setJsonError(`Question ${i + 1}: missing "question" field.`); return }
                if (!Array.isArray(q.options) || q.options.length !== 4) { setJsonError(`Question ${i + 1}: "options" must be an array of 4 strings.`); return }
                if (!q.answer) { setJsonError(`Question ${i + 1}: missing "answer" field.`); return }
                if (!q.options.includes(q.answer)) { setJsonError(`Question ${i + 1}: "answer" must exactly match one of the options.\nGot: "${q.answer}"\nOptions: ${JSON.stringify(q.options)}`); return }
            }

            setJsonValid(true)
        } catch (e: any) {
            setJsonError(`Invalid JSON: ${e.message}`)
        }
    }

    const copyPrompt = () => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(JSON_SCHEMA_PROMPT)
        } else {
            // Fallback for non-secure contexts
            const el = document.createElement("textarea")
            el.value = JSON_SCHEMA_PROMPT
            el.style.position = "fixed"
            el.style.opacity = "0"
            document.body.appendChild(el)
            el.focus()
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
        }
        setPromptCopied(true)
        toast.success("Prompt copied! Paste it into any AI to generate questions.")
        setTimeout(() => setPromptCopied(false), 3000)
    }

    const handleAction = async () => {
        setLoading(true)

        let textToAnalyze = "";
        let quizTitle = "";
        let generatedResult = null;

        try {
            if (activeTab === 'upload') {
                if (!file) {
                    toast.error("Please select a PDF file.")
                    setLoading(false)
                    return
                }
                const formData = new FormData()
                formData.append("pdf", file)
                generatedResult = await generateQuizFromPDF(formData)
                quizTitle = file.name.replace(".pdf", "")

            } else if (activeTab === 'parse') {
                if (!parseText) {
                    toast.error("Please paste some text to analyze.")
                    setLoading(false)
                    return
                }
                textToAnalyze = parseText
                quizTitle = "Notes Analysis"

            } else if (activeTab === 'json') {
                if (!jsonInput.trim()) {
                    toast.error("Please paste your JSON.")
                    setLoading(false)
                    return
                }
                if (!jsonValid) {
                    toast.error("Fix the JSON errors before importing.")
                    setLoading(false)
                    return
                }

                const parsed = JSON.parse(jsonInput)
                const questions = parsed.questions.map((q: any, i: number) => ({
                    id: i + 1,
                    question: q.question,
                    options: q.options,
                    answer: q.answer,
                    explanation: q.explanation || "",
                }))

                await saveQuizToDB({
                    title: parsed.title || "Imported Quiz",
                    topic: parsed.topic || "Imported Content",
                    emoji: parsed.emoji || "📝",
                    difficulty: "medium",
                    questions,
                })

                toast.success("Quiz imported successfully!")
                router.push("/quizzes")
                return

            } else {
                if (!topic) {
                    toast.error("Please enter a topic.")
                    setLoading(false)
                    return
                }
                textToAnalyze = `Generate a ${difficulty} difficulty quiz about ${topic} with ${count[0]} questions.`
                quizTitle = topic
            }

            if (!generatedResult) {
                generatedResult = await generateQuizAction(textToAnalyze)
            }

            const { emoji, questions } = generatedResult

            if (!questions || questions.length === 0) {
                throw new Error("No questions generated.")
            }

            await saveQuizToDB({
                title: quizTitle,
                topic: activeTab === 'generate' ? topic : 'Imported Content',
                emoji,
                difficulty,
                questions,
            })

            toast.success("Quiz added to your library!")
            router.push("/quizzes")

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to generate quiz. Try again.")
        } finally {
            setLoading(false)
        }
    }

    const getButtonLabel = () => {
        if (loading) return activeTab === 'generate' ? 'Generating Quiz...' : activeTab === 'json' ? 'Importing...' : 'Analyzing Document...'
        if (activeTab === 'upload') return 'Generate from PDF'
        if (activeTab === 'parse') return 'Generate Quiz from Text'
        if (activeTab === 'json') return 'Import Quiz from JSON'
        return 'Generate Quiz'
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
                        Use AI to master any subject. Parse notes, upload PDFs, generate from scratch, or import JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="parse" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6 h-11">
                            <TabsTrigger value="upload" className="text-sm">
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                PDF
                            </TabsTrigger>
                            <TabsTrigger value="parse" className="text-sm">
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Text
                            </TabsTrigger>
                            <TabsTrigger value="generate" className="text-sm">
                                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                                AI
                            </TabsTrigger>
                            <TabsTrigger value="json" className="text-sm">
                                <Braces className="mr-1.5 h-3.5 w-3.5" />
                                JSON
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

                        <TabsContent value="json" className="space-y-4">
                            {/* Copy Prompt Banner */}
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">Use any AI to generate questions</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Copy this prompt → paste into ChatGPT, Claude, Gemini, etc. → paste the output below.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 gap-1.5 border-primary/30 hover:bg-primary/10"
                                        onClick={copyPrompt}
                                    >
                                        {promptCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        {promptCopied ? "Copied!" : "Copy Prompt"}
                                    </Button>
                                </div>
                                <div className="rounded bg-muted/60 px-3 py-2 font-mono text-[10px] text-muted-foreground leading-relaxed line-clamp-3 border">
                                    You are a quiz generator. Output ONLY valid JSON with no extra text... "questions": [{"{"}  "id": 1, "question": "...", "options": [...], "answer": "...", "explanation": "..." {"}"}]
                                </div>
                            </div>

                            {/* JSON Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="jsonInput" className="text-sm font-medium">Paste JSON Output</Label>
                                    {jsonInput.trim() && (
                                        <span className={`text-xs flex items-center gap-1 ${jsonValid ? "text-green-500" : "text-destructive"}`}>
                                            {jsonValid
                                                ? <><CheckCircle2 className="h-3 w-3" /> Valid JSON</>
                                                : <><AlertCircle className="h-3 w-3" /> Invalid</>
                                            }
                                        </span>
                                    )}
                                </div>
                                <Textarea
                                    id="jsonInput"
                                    placeholder={EXAMPLE_JSON}
                                    className={`min-h-[260px] font-mono text-xs bg-muted/30 focus:bg-background transition-colors ${jsonError ? "border-destructive focus-visible:ring-destructive" : jsonValid ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                                    value={jsonInput}
                                    onChange={(e) => validateJson(e.target.value)}
                                    spellCheck={false}
                                />
                                {jsonError && (
                                    <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 border border-destructive/20">
                                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <pre className="whitespace-pre-wrap font-mono">{jsonError}</pre>
                                    </div>
                                )}
                                {jsonValid && (() => {
                                    const parsed = JSON.parse(jsonInput)
                                    return (
                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-500/10 rounded-md px-3 py-2 border border-green-500/20">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                            {parsed.questions.length} question{parsed.questions.length !== 1 ? "s" : ""} ready to import
                                            {parsed.title ? ` · "${parsed.title}"` : ""}
                                        </div>
                                    )
                                })()}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20"
                        onClick={handleAction}
                        disabled={loading || (activeTab === 'json' && !!jsonInput.trim() && !jsonValid)}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {getButtonLabel()}
                            </>
                        ) : getButtonLabel()}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
