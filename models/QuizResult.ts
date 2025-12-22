import mongoose, { Schema, model, models } from 'mongoose';

const QuizResultSchema = new Schema({
    quizId: { type: String, required: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    wrongAnswers: [{
        question: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        userAnswer: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now }
});

const QuizResult = models.QuizResult || model('QuizResult', QuizResultSchema);

export default QuizResult;
