"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { getQuizFromDB, updateQuizInDB } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Trash2, Plus, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()
    const quizId = unwrappedParams.id

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [quiz, setQuiz] = useState<any>(null)

    // Form State
    const [title, setTitle] = useState("")
    const [questions, setQuestions] = useState<any[]>([])

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                const data = await getQuizFromDB(quizId)
                if (!data) {
                    toast.error("Quiz not found")
                    router.push("/quizzes")
                    return
                }
                setQuiz(data)
                setTitle(data.title || data.topic)
                setQuestions(data.questions.map((q: any) => ({
                    ...q,
                    options: [...q.options] // Clone options array
                })))
            } catch (error) {
                console.error("Failed to load quiz", error)
                toast.error("Error loading quiz")
            } finally {
                setLoading(false)
            }
        }
        loadQuiz()
    }, [quizId, router])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateQuizInDB(quizId, {
                title,
                questions
            })
            toast.success("Quiz updated successfully")
            router.push("/quizzes")
            router.refresh()
        } catch (error) {
            console.error("Failed to update quiz", error)
            toast.error("Failed to update quiz")
        } finally {
            setSaving(false)
        }
    }

    const handleQuestionChange = (index: number, field: string, value: string) => {
        const updated = [...questions]
        updated[index] = { ...updated[index], [field]: value }
        setQuestions(updated)
    }

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...questions]
        const newOptions = [...updated[qIndex].options]
        newOptions[oIndex] = value
        updated[qIndex].options = newOptions
        setQuestions(updated)
    }

    const deleteQuestion = (index: number) => {
        const updated = questions.filter((_, i) => i !== index)
        setQuestions(updated)
    }

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Quiz</h1>
                    <p className="text-muted-foreground">Update quiz details and questions.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Title Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Quiz Details</CardTitle>
                    <CardDescription>Basic information about this quiz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter quiz title..."
                            className="bg-background text-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Questions Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        Questions <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{questions.length}</span>
                    </h2>
                    {/* Future: Add 'Add Question' button functionality */}
                </div>

                {questions.map((q, qIndex) => (
                    <Card key={qIndex} className="relative group">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteQuestion(qIndex)}
                            title="Delete Question"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Question {qIndex + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Question Text (Markdown Supported)</Label>
                                <Textarea
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
                                    className="min-h-[80px] font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((option: string, oIndex: number) => (
                                    <div key={oIndex} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-muted-foreground">Option {oIndex + 1}</Label>
                                            {option === q.answer && (
                                                <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Correct Answer
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input
                                                value={option}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                className={option === q.answer ? "border-green-500 ring-green-500/20" : ""}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Correct Answer Selector (Simple dropdown or text match) */}
                            <div className="space-y-2 pt-2">
                                <Label>Correct Answer (Must match one option exactly)</Label>
                                <Input
                                    value={q.answer}
                                    onChange={(e) => handleQuestionChange(qIndex, 'answer', e.target.value)}
                                    className="border-primary/50"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end pb-20">
                <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[150px] shadow-xl shadow-primary/20">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
