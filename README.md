# 🧠 QuizAI - Intelligent Learning Platform

QuizAI is a modern, AI-powered educational application designed to help users learn any topic effectively. Leveraging Google's **Gemini 2.5** models, it dynamically generates quizzes, analyzes user performance to identify weak areas, and creates personalized flashcards for targeted study.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248)
![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-8E75B2)

## ✨ Key Features

-   **🤖 AI Quiz Generation**: Create custom quizzes on any topic instantly with adjustable difficulty levels. Powered by `gemini-2.5-flash-lite`.
-   **📊 Smart Performance Analysis**: Get detailed, balanced feedback on your quiz results. The AI highlights both your strengths and areas for improvement.
-   **🃏 Dynamic Flashcards**: Automatically generate flashcards based on your specific mistakes. The AI creates concise "Back" answers (1-5 words) for effective spaced repetition.
-   **📉 Weak Areas Tracking**: The system tracks topics where your accuracy is below 80%, helping you focus on what matters.
-   **💬 Ted Agent**: A context-aware AI study assistant. Select any text on a page to ask "Ted" specific questions, or chat freely for explanations.
-   **🎨 Modern UI/UX**: Built with a sleek, dark-mode-first design using **Shadcn UI**, **Framer Motion** for smooth animations, and **Tailwind CSS**.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
-   **AI Integration**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)
-   **State Management**: React Hooks & Server Actions
-   **Markdown Rendering**: `react-markdown` with `tailwindcss-typography`

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+ installed
-   A MongoDB instance (local or Atlas)
-   A Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/quizai.git
    cd quizai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add the following:

    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/quizapp
    NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```bash
├── app/                  # Next.js App Router pages & layouts
│   ├── quizzes/          # Quiz listing, playing, and results
│   ├── flashcards/       # Flashcard review interface
│   ├── weak-areas/       # Analytics for weak topics
│   └── api/              # API routes (if any)
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn UI primitives
│   ├── ted-agent.tsx     # AI Chatbot component
│   └── ...
├── lib/                  # Utilities and Server Actions
│   ├── actions.ts        # MongoDB Server Actions
│   ├── gemini.ts         # Gemini AI logic & prompts
│   └── db.ts             # Database connection
└── models/               # Mongoose Schema definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
