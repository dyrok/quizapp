import mongoose, { Schema, model, models } from 'mongoose';

const QuestionSchema = new Schema({
    id: { type: String, required: true }, // Changed to String to support both numeric and ObjectId strings
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true },
    explanation: { type: String }, // AI provides this, good to store
    correctIndex: { type: Number }
});

const QuizSchema = new Schema({
    title: { type: String, required: true },
    topic: { type: String, required: true },
    emoji: { type: String }, // User-defined emoji
    difficulty: { type: String },
    questions: [QuestionSchema],
    createdAt: { type: Date, default: Date.now },
    // Keeping specific fields for compatibility
    originalId: { type: String } // To store the timestamp ID if we want
});

// Prevent overwriting the model if it's already compiled
const Quiz = models.Quiz || model('Quiz', QuizSchema);

export default Quiz;
