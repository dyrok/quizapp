export interface Question {
    id: number;
    question: string;
    code?: string;
    options: string[];
    answer?: string;
    explanation?: string;
}

// Kept for backward compatibility if any imports linger, but empty.
export const PREMADE_QUIZ_SOURCE = "";
export const REAL_QUIZ: Question[] = [];
export const MOCK_ANSWERS: Record<number, number> = {};

// Helper just in case
export function parseQuiz(source: string): Question[] {
    return [];
}
