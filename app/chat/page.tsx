"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, Send, Sparkles, Copy, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Message = {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export default function ChatPage() {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hi, I'm Ted. I can help you understand your quiz mistakes or clarify complex topics. What are we studying today?",
            timestamp: new Date()
        }
    ])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const newMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, newMsg])
        setInput("")
        setLoading(true)

        // Simulate AI response
        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "That's a great question. Based on your recent quiz on Calculus, it seems you might be confused about the Chain Rule. \n\nHere's a simpler way to think about it: treat the inner function as a single variable first...",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, response])
            setLoading(false)
        }, 1500)
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            <Card className="flex-1 overflow-hidden flex flex-col shadow-lg border-muted/40">
                <div className="bg-muted/50 p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Ted</h3>
                            <p className="text-xs text-muted-foreground">AI Tutor • Gemini 2.5 Flash</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                <Avatar className="h-8 w-8 mt-1">
                                    {msg.role === "assistant" ? (
                                        <>
                                            <AvatarImage src="/bot-avatar.png" />
                                            <AvatarFallback className="bg-primary/10"><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                                        </>
                                    ) : (
                                        <>
                                            <AvatarImage src="/user-avatar.png" />
                                            <AvatarFallback>You</AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                <div className={`flex flex-col gap-2 max-w-[80%]`}>
                                    <div className={`rounded-2xl p-4 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === "assistant" && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><Copy className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><ThumbsUp className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><ThumbsDown className="h-3 w-3" /></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback className="bg-primary/10"><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-2xl p-4 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-xs text-muted-foreground">Ted is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Ask Ted about a concept..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    )
}
