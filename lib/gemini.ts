"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const modelName = "gemini-2.5-flash-lite"; // User specified model

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

        console.warn(`Gemini API Error, retrying... (${retries} attempts left). Error: ${error.message}`);
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

export async function generateQuizAction(text: string): Promise<Question[]> {
    if (!text) return [];

    const callAi = async () => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            You are an expert teacher. 
            Analyze the following text and generate a multiple-choice quiz with 5-10 questions.
            The questions should test understanding of key concepts.
            
            IMPORTANT: If a question involves code, YOU MUST USE MARKDOWN CODE BLOCKS for the code itself.
            For example:
            "What is the output of this Python code?
            \`\`\`python
            print('Hello')
            \`\`\`"

            Do NOT use inline code (single backticks) for multi-line code snippets.
            
            Return ONLY a JSON array of objects with this exact structure:
            [
                {
                    "id": 1, 
                    "question": "Question text here (with markdown code blocks if needed)",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Option A", 
                    "explanation": "Brief explanation of why this is the correct answer."
                }
            ]

            Text to analyze:
            ${text.substring(0, 15000)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    };

    try {
        const jsonString = await runWithRetry(callAi);
        const questions = JSON.parse(cleanJsonString(jsonString));

        // Validation check
        if (!Array.isArray(questions)) throw new Error("AI returned invalid structure (not array)");

        return questions.map((q: any, i: number) => ({ ...q, id: i + 1 }));

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
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Upgrade to flash
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            A student took a quiz and achieved a score of ${score}/${questions.length}.
            
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
            }
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
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
