/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "The question text" },
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
};

export async function generateQuizQuestions(
  subject: string,
  classLevel: string,
  topics: string[],
  count: number = 5
) {
  const prompt = `Generate a ${count}-question multiple choice quiz for ${classLevel} students in the subject "${subject}". 
  The questions should focus on these topics: ${topics.join(", ")}.
  Ensure the difficulty is appropriate for ${classLevel}.
  Return the response as a JSON array of question objects.`;

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
