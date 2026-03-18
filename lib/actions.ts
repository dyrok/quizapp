'use server'

import connectToDatabase from "@/lib/db";
import Quiz from "@/models/Quiz";
import { Question } from "@/lib/gemini";

// Helper to sanitize MongoDB documents for client
function sanitize(doc: any) {
    const { _id, ...rest } = doc.toObject ? doc.toObject() : doc;
    return { ...rest, _id: _id.toString() };
}

export async function saveQuizToDB(quizData: {
    title: string;
    topic: string;
    emoji: string;
    difficulty: string;
    questions: Question[];
}) {
    await connectToDatabase();

    const newQuiz = new Quiz({
        title: quizData.title,
        topic: quizData.topic,
        emoji: quizData.emoji,
        difficulty: quizData.difficulty,
        questions: quizData.questions,
        createdAt: new Date(),
    });

    const saved = await newQuiz.save();

    // Manually construct plain object to avoid serialization issues with nested _id
    return {
        id: saved._id.toString(),
        title: saved.title,
        topic: saved.topic,
        emoji: saved.emoji,
        difficulty: saved.difficulty,
        questions: saved.questions.map((q: any) => ({
            id: q._id ? q._id.toString() : (q.id || Math.random().toString()),
            question: q.question,
            options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [],
            answer: String(q.answer)
        })),
        createdAt: saved.createdAt.toISOString()
    };
}

export async function updateQuizInDB(quizId: string, data: {
    title: string;
    emoji?: string;
    questions: Question[];
}) {
    await connectToDatabase();

    console.log("updateQuizInDB called for:", quizId);
    console.log("Data received:", data);

    const updatedQuiz = await Quiz.findByIdAndUpdate(
        quizId,
        {
            title: data.title,
            emoji: data.emoji,
            questions: data.questions,
        },
        { new: true }
    );
    console.log("Updated Quiz result:", updatedQuiz);

    if (!updatedQuiz) {
        throw new Error("Quiz not found");
    }

    return {
        id: updatedQuiz._id.toString(),
        title: updatedQuiz.title,
        topic: updatedQuiz.topic,
        emoji: updatedQuiz.emoji,
        difficulty: updatedQuiz.difficulty,
        questions: updatedQuiz.questions.map((q: any) => ({
            id: q._id ? q._id.toString() : (q.id || Math.random().toString()),
            question: q.question,
            options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [],
            answer: String(q.answer)
        })),
        createdAt: updatedQuiz.createdAt.toISOString()
    };
}


export async function getQuizzesFromDB() {
    await connectToDatabase();

    // Fetch last 20 quizzes
    const quizzes = await Quiz.find({}).sort({ createdAt: -1 }).limit(20).lean();

    return quizzes.map((q: any) => ({
        id: q._id.toString(), // Map _id to id for frontend compatibility
        title: q.title,
        topic: q.topic,
        emoji: q.emoji,
        date: q.createdAt.toISOString(),
        questions: q.questions ? q.questions.map((qn: any) => ({
            id: qn.id || qn._id?.toString(),
            question: qn.question,
            options: Array.isArray(qn.options) ? qn.options.map((o: any) => String(o)) : [],
            answer: String(qn.answer)
        })) : [],
    }));
}

export async function getQuizFromDB(id: string) {
    await connectToDatabase();

    try {
        const quiz = await Quiz.findById(id).lean(); // Use lean() for plain objects
        if (!quiz) return null;

        return {
            id: quiz._id.toString(),
            title: quiz.title,
            topic: quiz.topic,
            emoji: quiz.emoji,
            date: quiz.createdAt.toISOString(),
            questions: quiz.questions.map((q: any) => ({
                id: q.id || q._id?.toString() || Math.random().toString(), // Ensure ID is string
                question: q.question,
                options: Array.isArray(q.options) ? q.options.map((opt: any) => String(opt)) : [],
                answer: String(q.answer)
            })),
        };
    } catch (error) {
        console.error("Error fetching quiz:", error);
        return null;
    }
}

export async function deleteQuizFromDB(id: string) {
    await connectToDatabase();
    await Quiz.findByIdAndDelete(id);
    return { success: true };
}

export async function generateQuizFromPDF(formData: FormData) {
    const file = formData.get("pdf") as File;
    if (!file) {
        throw new Error("No file provided");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // pdf-parse v2 uses PDFParse class, but types still reflect v1's default export
        const pdfParseModule = await import("pdf-parse") as any;
        const PDFParse = pdfParseModule.PDFParse;
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        const text = result.text;

        if (!text || text.trim().length === 0) {
            throw new Error("No text could be extracted from this PDF.");
        }

        const truncatedText = text.substring(0, 20000);

        const { generateQuizAction } = await import("./gemini");
        return await generateQuizAction(truncatedText);

    } catch (error: any) {
        console.error("PDF Parse Error:", error);
        throw new Error(error.message || "Failed to parse PDF");
    }
}

// --- Flashcards ---
import FlashcardSet from "@/models/FlashcardSet";

export async function saveFlashcardsToDB(data: { topic: string, cards: { front: string, back: string }[] }) {
    await connectToDatabase();
    const newSet = new FlashcardSet({
        topic: data.topic,
        cards: data.cards,
        createdAt: new Date(),
    });
    const saved = await newSet.save();

    // Manually serialize to ensure no nested ObjectsIds remain
    return {
        id: saved._id.toString(),
        topic: saved.topic,
        cards: saved.cards.map((c: any) => ({
            front: c.front,
            back: c.back,
            _id: c._id ? c._id.toString() : undefined
        })),
        createdAt: saved.createdAt.toISOString()
    };
}

export async function getFlashcardSetsFromDB() {
    await connectToDatabase();
    const sets = await FlashcardSet.find({}).sort({ createdAt: -1 }).lean();
    return sets.map((s: any) => ({
        id: s._id.toString(),
        topic: s.topic,
        cards: s.cards ? s.cards.map((c: any) => ({
            front: c.front,
            back: c.back,
            _id: c._id ? c._id.toString() : undefined
        })) : [],
        date: s.createdAt.toISOString()
    }));
}


// --- Results & Weak Areas ---
import QuizResult from "@/models/QuizResult";

export async function saveQuizResultToDB(data: {
    quizId: string,
    topic: string,
    score: number,
    totalQuestions: number,
    wrongAnswers: any[]
}) {
    await connectToDatabase();
    const result = new QuizResult({
        ...data,
        createdAt: new Date()
    });
    await result.save();
    return { success: true };
}

export async function getWeakAreasFromDB() {
    await connectToDatabase();
    // Aggregate wrong answers by topic
    // This is a simple implementation. For production, use MongoDB Aggregation Pipeline.
    const results = await QuizResult.find({}).sort({ createdAt: -1 }).limit(50);

    const topicStats: Record<string, { total: number, correct: number, mistakes: Set<string>, latestQuizId: string, latestDate: Date }> = {};

    results.forEach((r: any) => {
        if (!topicStats[r.topic]) {
            topicStats[r.topic] = { total: 0, correct: 0, mistakes: new Set(), latestQuizId: r.quizId, latestDate: new Date(r.createdAt) };
        } else {
            // Update latest if this one is newer
            const currentDate = new Date(r.createdAt);
            if (currentDate > topicStats[r.topic].latestDate) {
                topicStats[r.topic].latestQuizId = r.quizId;
                topicStats[r.topic].latestDate = currentDate;
            }
        }

        topicStats[r.topic].total += r.totalQuestions;
        topicStats[r.topic].correct += r.score;
        r.wrongAnswers.forEach((w: any) => topicStats[r.topic].mistakes.add(w.question));
    });

    const weakAreas = Object.keys(topicStats)
        .map(topic => {
            const stats = topicStats[topic];
            const accuracy = Math.round((stats.correct / stats.total) * 100);
            return {
                topic,
                accuracy,
                mistakeCount: stats.mistakes.size,
                // Pick a random mistake as "last mistake" for UI
                lastMistake: Array.from(stats.mistakes)[0] || "General Improvement needed",
                lastQuizId: stats.latestQuizId // Added for navigation
            };
        })
        .filter(area => area.accuracy < 80) // Only return weak areas
        .sort((a, b) => a.accuracy - b.accuracy); // Lowest accuracy first

    return weakAreas;
}
