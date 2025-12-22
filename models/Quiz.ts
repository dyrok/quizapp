import mongoose, { Schema, model, models } from 'mongoose';

const QuestionSchema = new Schema({
    id: { type: Number, required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true }, // The string text of the correct answer
    correctIndex: { type: Number } // Index of the correct answer (optional but helpful)
});

const QuizSchema = new Schema({
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String },
    questions: [QuestionSchema],
    createdAt: { type: Date, default: Date.now },
    // Keeping specific fields for compatibility
    originalId: { type: String } // To store the timestamp ID if we want
});

// Prevent overwriting the model if it's already compiled
const Quiz = models.Quiz || model('Quiz', QuizSchema);

export default Quiz;
