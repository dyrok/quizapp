"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, X, Send, Sparkles, Loader2, Maximize2, Minimize2, TextCursor } from "lucide-react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from 'react-markdown'

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

type Message = {
    id: string
    role: "user" | "model"
    content: string
}

export function TedAgent() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedContext, setSelectedContext] = useState<string | null>(null)
    const scrollViewportRef = useRef<HTMLDivElement>(null)
    const endRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        // Validation check to ensure we only scroll when content changes
        const timeout = setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        }, 100) // Small delay to allow DOM render
        return () => clearTimeout(timeout)
    }, [messages, isOpen, loading])

    // Capture selection when opening or when window selection changes
    useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection()?.toString().trim()
            if (selection && selection.length > 0) {
                setSelectedContext(selection)
            } else {
                // Determine if we should clear it? 
                // Let's keep it until manually cleared or used, to avoid flickering
            }
        }

        // Listen for selection changes only when open? Or always?
        // Let's listen on mouseup/keyup globally but only update if something is selected
        document.addEventListener('mouseup', handleSelection)
        document.addEventListener('keyup', handleSelection)

        return () => {
            document.removeEventListener('mouseup', handleSelection)
            document.removeEventListener('keyup', handleSelection)
        }
    }, [])

    const handleSend = async () => {
        const currentInput = input.trim();
        const currentSelectedContext = selectedContext; // Capture current value
        if (!currentInput && !currentSelectedContext) return;

        let fullPrompt = currentInput;
        let visibleContent = currentInput;

        if (currentSelectedContext) {
            fullPrompt = `Context: "${currentSelectedContext}"\n\nUser Question: ${currentInput}`;
            visibleContent = `Ref: "${currentSelectedContext.substring(0, 50)}..."\n\n${currentInput}`;
            setSelectedContext(null); // Clear context after sending
        }

        const storedMsg: Message = { id: Date.now().toString(), role: "user", content: visibleContent }
        setMessages(prev => [...prev, storedMsg])

        setInput("")
        setLoading(true)

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            // Construct history correctly
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

            const chat = model.startChat({
                history: history,
                generationConfig: {
                    maxOutputTokens: 1000, // Increased for better explanations
                },
            });

            const sendWithRetry = async (retries = 1): Promise<string> => {
                try {
                    const result = await chat.sendMessage(fullPrompt); // Send the full context prompt
                    const response = result.response;
                    return response.text();
                } catch (err: any) {
                    if (retries > 0 && (err.message?.includes("429") || err.status === 429)) {
                        console.log("Rate limited (429). Retrying in 5s...");
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        return sendWithRetry(retries - 1);
                    }
                    throw err;
                }
            };

            const text = await sendWithRetry();

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "model", content: text }])
        } catch (error: any) {
            console.error("Gemini Error:", error)
            let errorMessage = "I'm sorry, I encountered an error. Please try again.";

            if (error.message?.includes("429") || error.status === 429) {
                errorMessage = "I'm thinking a bit too hard right now (Rate Limit). Give me a moment.";
            }

            toast.error("AI Error")
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "model", content: errorMessage }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        // Added max-h-[85vh] to ensure it fits in viewport, and flex column layout
                        className={`mb-4 w-[350px] ${isExpanded ? "w-[600px] h-[700px] max-h-[85vh]" : "h-[500px] max-h-[80vh]"} shadow-2xl pointer-events-auto flex flex-col`}
                    >
                        <Card className="flex flex-col h-full border border-border bg-card shadow-xl overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 bg-muted/50 border-b shrink-0">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border ring-1 ring-background">
                                        <AvatarImage src="/bot-avatar.png" />
                                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-sm font-medium">Ted AI</CardTitle>
                                        <p className="text-[10px] text-muted-foreground">Study Assistant (Gemini 2.5)</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Minimize" : "Maximize"}>
                                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsOpen(false)} title="Close Chat">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Scrollable Messages Area - Added min-h-0 for flex shrinking */}
                            <div className="flex-1 min-h-0 bg-background/50 relative">
                                <ScrollArea className="h-full p-4">
                                    <div className="flex flex-col gap-4 pb-4">
                                        {messages.length === 0 && (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-muted-foreground opacity-60 mt-10">
                                                <Sparkles className="h-10 w-10 mb-3" />
                                                <p>Hi! I'm Ted.</p>
                                                <p>Select text on the page to ask about it!</p>
                                            </div>
                                        )}
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div className={`
                                                    rounded-2xl px-4 py-2 text-sm max-w-[85%] shadow-sm
                                                    ${msg.role === "user"
                                                        ? "bg-primary text-primary-foreground rounded-br-sm prose-invert"
                                                        : "bg-muted text-foreground rounded-bl-sm border border-border"}
                                                `}>
                                                    <div className="prose dark:prose-invert prose-sm max-w-none break-words leading-relaxed">
                                                        <ReactMarkdown
                                                            components={{
                                                                code({ node, className, children, ...props }) {
                                                                    const match = /language-(\w+)/.exec(className || '')
                                                                    return !className?.includes('language') ? (
                                                                        <code className="bg-black/20 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs" {...props}>
                                                                            {children}
                                                                        </code>
                                                                    ) : (
                                                                        <pre className="mt-2 mb-2 p-2 bg-black/90 text-white rounded-md overflow-x-auto text-xs font-mono">
                                                                            <code className={className} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        </pre>
                                                                    )
                                                                }
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="flex justify-start">
                                                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2 border border-border text-sm">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-muted-foreground">Thinking...</span>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={endRef} />
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Footer Input */}
                            <CardFooter className="p-3 pt-3 border-t bg-background shrink-0 flex-col gap-2">
                                {/* Context Indicator */}
                                <AnimatePresence>
                                    {selectedContext && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="w-full flex items-center justify-between text-xs bg-accent/50 text-accent-foreground px-3 py-1.5 rounded-md border border-primary/20"
                                        >
                                            <div className="flex items-center gap-2 truncate max-w-[80%]">
                                                <TextCursor className="h-3 w-3 shrink-0" />
                                                <span className="truncate italic">"{selectedContext.substring(0, 40)}..."</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setSelectedContext(null)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSend()
                                    }}
                                    className="flex w-full gap-2 items-end"
                                >
                                    <Input
                                        placeholder={selectedContext ? "Ask about selection..." : "Ask anything..."}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        className="h-10 transition-all"
                                        autoFocus
                                    />
                                    <Button size="icon" type="submit" disabled={loading || (!input.trim() && !selectedContext)} className="h-10 w-10 shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <div className="pointer-events-auto">
                {!isOpen && (
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 flex items-center justify-center"
                    >
                        <Bot className="h-7 w-7" />
                        <span className="sr-only">Open Ted</span>
                    </Button>
                )}
            </div>
        </div>
    )
}
