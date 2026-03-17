"use server"

import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
const modelName = "llama-3.3-70b-versatile";

export interface Question {
    id: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export interface QuizAnalysis {
    score: number;
    total: number;
    feedback: string;
    flashcards: { front: string, back: string }[]
}

// Helper: Exponential Backoff Retry
async function runWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) throw error;

        console.warn(`Groq API Error, retrying... (${retries} attempts left). Error: ${error.message}`);
        await new Promise(res => setTimeout(res, delay));
        return runWithRetry(fn, retries - 1, delay * 2);
    }
}

// Helper: Clean JSON string (remove markdown)
function cleanJsonString(input: string): string {
    let clean = input.trim();
    if (clean.startsWith("```json")) {
        clean = clean.replace(/```json/g, "").replace(/```/g, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/```/g, "");
    }
    return clean.trim();
}

export async function generateQuizAction(text: string): Promise<{ emoji: string, questions: Question[] }> {
    if (!text) return { emoji: "📝", questions: [] };

    const callAi = async () => {
        const chatCompletion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: "You are an expert teacher that generates quizzes. You MUST respond with valid JSON only, no extra text."
                },
                {
                    role: "user",
                    content: `Analyze the following text and generate a multiple-choice quiz with 5-10 questions.
The questions should test understanding of key concepts.

IMPORTANT: If a question involves code, YOU MUST USE MARKDOWN CODE BLOCKS for the code itself.
For example:
"What is the output of this Python code?
\`\`\`python
print('Hello')
\`\`\`"

Do NOT use inline code (single backticks) for multi-line code snippets.

Also, generate a single emoji that best represents the topic of this quiz (e.g., "🧬" for Biology, "⚛️" for Physics, "📜" for History).

Return ONLY a JSON object with this exact structure:
{
    "emoji": "🧬",
    "questions": [
        {
            "id": 1,
            "question": "Question text here (with markdown code blocks if needed)",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A",
            "explanation": "Brief explanation of why this is the correct answer."
        }
    ]
}

Text to analyze:
${text.substring(0, 15000)}`
                }
            ],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: "json_object" }
        });

        return chatCompletion.choices[0]?.message?.content || "{}";
    };

    try {
        const jsonString = await runWithRetry(callAi);
        const data = JSON.parse(cleanJsonString(jsonString));

        // Validation check
        if (!data.questions || !Array.isArray(data.questions)) throw new Error("AI returned invalid structure (questions missing or not array)");

        return {
            emoji: data.emoji || "📝",
            questions: data.questions.map((q: any, i: number) => ({ ...q, id: i + 1 }))
        };

    } catch (error: any) {
        console.error("Quiz Generation Final Error:", error);
        throw new Error(`Failed to generate quiz: ${error.message}`);
    }
}

export async function analyzeQuizResultAction(
    questions: Question[],
    userAnswers: Record<number, string>
): Promise<QuizAnalysis> {

    // Calculate Score
    let score = 0;
    const mistakes: { question: string, userAnswer: string, correctAnswer: string }[] = [];

    questions.forEach(q => {
        const userAns = userAnswers[q.id];
        if (userAns === q.answer) {
            score++;
        } else {
            mistakes.push({
                question: q.question,
                userAnswer: userAns || "No Answer",
                correctAnswer: q.answer
            });
        }
    });

    if (mistakes.length === 0) {
        return {
            score,
            total: questions.length,
            feedback: "Perfect score! You have verified mastery of this topic.",
            flashcards: []
        };
    }

    const callAi = async () => {
        const chatCompletion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: "You are an expert tutor. Analyze quiz results and generate feedback and flashcards. Respond with valid JSON only."
                },
                {
                    role: "user",
                    content: `A student took a quiz and achieved a score of ${score}/${questions.length}.

Mistakes made:
${JSON.stringify(mistakes)}

Analyze their performance (considering both their score and specific mistakes) and generate:
1. A 2-sentence encouraging feedback summary acknowledging what they did right vs wrong.
2. A list of flashcards (Front/Back) to help them learn the specific concepts they missed.

CRITICAL FOR FLASHCARDS:
- The 'Back' (Answer) MUST be VERY CONCISE (1-5 words or a short phrase).
- The 'Front' (Question) should be specific enough to lead to that short answer.
- Use MARKDOWN syntax for code blocks if needed.

Return ONLY JSON:
{
    "feedback": "...",
    "flashcards": [ {"front": "...", "back": "..."} ]
}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2048,
            response_format: { type: "json_object" }
        });

        return chatCompletion.choices[0]?.message?.content || "{}";
    };

    try {
        const jsonString = await runWithRetry(callAi);
        const analysis = JSON.parse(cleanJsonString(jsonString));

        return {
            score,
            total: questions.length,
            feedback: analysis.feedback || "Good effort!",
            flashcards: analysis.flashcards || []
        };

    } catch (error) {
        console.error("Analysis Error:", error);
        // Fallback if AI fails (don't block the user from seeing their score)
        return {
            score,
            total: questions.length,
            feedback: "Good effort! Review the questions above to improve.",
            flashcards: []
        };
    }
}

// Chat completion for Ted chatbot - callable from client components as a server action
export async function chatWithTed(
    history: { role: "user" | "assistant", content: string }[],
    userMessage: string
): Promise<string> {
    const systemPrompt = `You are Ted, a friendly and knowledgeable AI study assistant. You help students understand their quiz mistakes, clarify complex topics, and provide clear explanations.

Rules:
- Be concise but thorough in your explanations.
- Use markdown formatting for code blocks, lists, and emphasis.
- If a student asks about a specific topic, provide examples and analogies.
- Be encouraging and supportive.
- If you don't know something, say so honestly.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 1024,
        });

        return chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error: any) {
        console.error("Chat Error:", error);
        if (error.status === 429) {
            return "I'm thinking a bit too hard right now (Rate Limit). Give me a moment and try again.";
        }
        return "I'm sorry, I encountered an error. Please try again.";
    }
}
