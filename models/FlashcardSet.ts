import mongoose, { Schema, model, models } from 'mongoose';

const CardSchema = new Schema({
    front: { type: String, required: true },
    back: { type: String, required: true }
});

const FlashcardSetSchema = new Schema({
    topic: { type: String, required: true },
    cards: [CardSchema],
    createdAt: { type: Date, default: Date.now },
});

const FlashcardSet = models.FlashcardSet || model('FlashcardSet', FlashcardSetSchema);

export default FlashcardSet;
