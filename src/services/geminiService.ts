/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const quizSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The MCQ question text" },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 options"
          },
          correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
          explanation: { type: Type.STRING, description: "Short explanation of why the answer is correct" }
        },
        required: ["text", "options", "correctAnswer", "explanation"]
      }
    },
    theoryQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The theory question text requiring a written answer" },
          idealAnswer: { type: Type.STRING, description: "The full ideal answer for this theory question" },
          marks: { type: Type.INTEGER, description: "Marks allocated for this question (default 8)" }
        },
        required: ["text", "idealAnswer", "marks"]
      }
    }
  },
  required: ["questions", "theoryQuestions"]
};

export async function generateQuizQuestions(
  subject: string,
  classLevel: string,
  topics: string[],
  mcqCount: number = 50,
  theoryCount: number = 5
) {
  const prompt = `Generate a comprehensive exam for ${classLevel} students in the subject "${subject}". 
  Topics to cover: ${topics.join(", ")}.
  
  Requirements:
  1. Generate exactly ${mcqCount} Multiple Choice Questions (MCQs). Each MCQ is worth 1 mark.
  2. Generate exactly ${theoryCount} Theory Questions. Each theory question is worth 8 marks.
  
  Difficulty MUST be appropriate for ${classLevel}.
  Return the response as a single JSON object containing 'questions' (array of MCQs) and 'theoryQuestions' (array of theory objects).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function gradeTheoryAnswers(
  questions: { question: string; idealAnswer: string }[],
  answers: Record<number, string>
) {
  const entries = questions.map((q, idx) => ({
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
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    
    const text = response.text;
    const scores = JSON.parse(text.match(/\[.*\]/)?.[0] || "[]");
    return scores as number[];
  } catch (error) {
    console.error("AI Grading failed:", error);
    // Fallback: return 0s if AI fails
    return entries.map(() => 0);
  }
}

export async function generateAIFeedback(
  subject: string,
  classLevel: string,
  score: number,
  total: number
) {
  const prompt = `A ${classLevel} student just completed a ${subject} quiz and scored ${score} out of ${total}.
  Analyze this performance and provide a short, encouraging, and highly specific piece of academic advice. 
  Focus on what they should review based on the curriculum. 
  Keep it under 3 sentences.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a supportive and professional teacher at Ark Academy. You speak with authority and warmth.",
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Feedback Error:", error);
    return "Excellent work completing your assessment! Keep practicing these core concepts to build your academic foundation at Ark Academy.";
  }
}
