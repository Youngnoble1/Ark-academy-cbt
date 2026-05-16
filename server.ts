import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, SchemaType } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

const quizSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "The MCQ question text" },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Exactly 4 options"
          },
          correctAnswer: { type: SchemaType.INTEGER, description: "Index of the correct option (0-3)" },
          explanation: { type: SchemaType.STRING, description: "Short explanation of why the answer is correct" }
        },
        required: ["text", "options", "correctAnswer", "explanation"]
      }
    },
    theoryQuestions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "The theory question text requiring a written answer" },
          idealAnswer: { type: SchemaType.STRING, description: "The full ideal answer for this theory question" },
          marks: { type: SchemaType.INTEGER, description: "Marks allocated for this question (default 8)" }
        },
        required: ["text", "idealAnswer", "marks"]
      }
    }
  },
  required: ["questions", "theoryQuestions"]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Generate Quiz
  app.post("/api/quiz/generate", async (req, res) => {
    const { subject, classLevel, topics, mcqCount = 50, theoryCount = 5 } = req.body;
    
    const prompt = `Generate a comprehensive exam for ${classLevel} students in the subject "${subject}". 
    Topics to cover: ${topics.join(", ")}.
    
    Requirements:
    1. Generate exactly ${mcqCount} Multiple Choice Questions (MCQs). Each MCQ is worth 1 mark.
    2. Generate exactly ${theoryCount} Theory Questions. Each theory question is worth 8 marks.
    
    Difficulty MUST be appropriate for ${classLevel}.
    Return the response as a single JSON object containing 'questions' (array of MCQs) and 'theoryQuestions' (array of theory objects).`;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
        },
      });

      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Grade Theory
  app.post("/api/quiz/grade-theory", async (req, res) => {
    const { questions, answers } = req.body;
    
    const entries = questions.map((q: any, idx: number) => ({
      question: q.question,
      idealAnswer: q.idealAnswer,
      studentAnswer: answers[idx] || ""
    }));

    const prompt = `You are an expert examiner. Grade these theory answers for a student exam.
    Each question is worth 8 marks. 
    Be fair but strict. 
    Return only a JSON array of numbers representing the scores (0-8) for each answer in order.

    Questions and Answers:
    ${JSON.stringify(entries, null, 2)}

    Example Response: [5, 8, 2, 7, 4]`;

    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const scores = JSON.parse(text.match(/\[.*\]/)?.[0] || "[]");
      res.json(scores);
    } catch (error: any) {
      console.error("AI Grading failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Feedback
  app.post("/api/quiz/feedback", async (req, res) => {
    const { subject, classLevel, score, total } = req.body;
    
    const prompt = `A ${classLevel} student just completed a ${subject} quiz and scored ${score} out of ${total}.
    Analyze this performance and provide a short, encouraging, and highly specific piece of academic advice. 
    Focus on what they should review based on the curriculum. 
    Keep it under 3 sentences.`;

    try {
      const model = ai.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: "You are a supportive and professional teacher at Ark Academy. You speak with authority and warmth.",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ feedback: response.text() });
    } catch (error: any) {
      console.error("Gemini Feedback Error:", error);
      res.json({ feedback: "Excellent work completing your assessment! Keep practicing these core concepts to build your academic foundation at Ark Academy." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
