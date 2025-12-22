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
    difficulty: string;
    questions: Question[];
}) {
    await connectToDatabase();

    const newQuiz = new Quiz({
        title: quizData.title,
        topic: quizData.topic,
        difficulty: quizData.difficulty,
        questions: quizData.questions,
        createdAt: new Date(),
    });

    const saved = await newQuiz.save();
    return sanitize(saved);
}

export async function getQuizzesFromDB() {
    await connectToDatabase();

    // Fetch last 20 quizzes
    const quizzes = await Quiz.find({}).sort({ createdAt: -1 }).limit(20).lean();

    return quizzes.map((q: any) => ({
        id: q._id.toString(), // Map _id to id for frontend compatibility
        title: q.title,
        topic: q.topic,
        date: q.createdAt.toISOString(),
        questions: q.questions,
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
            date: quiz.createdAt.toISOString(),
            questions: quiz.questions.map((q: any) => ({
                id: q.id,
                question: q.question,
                options: [...q.options], // Ensure plain array
                answer: q.answer
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
    return sanitize(saved);
}

export async function getFlashcardSetsFromDB() {
    await connectToDatabase();
    const sets = await FlashcardSet.find({}).sort({ createdAt: -1 });
    return sets.map(s => ({
        id: s._id.toString(),
        topic: s.topic,
        cards: s.cards,
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
