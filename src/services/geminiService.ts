/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export async function generateQuizQuestions(
  subject: string,
  classLevel: string,
  topics: string[],
  mcqCount: number = 50,
  theoryCount: number = 5
) {
  try {
    const response = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, classLevel, topics, mcqCount, theoryCount }),
    });
    
    if (!response.ok) throw new Error("Failed to generate quiz");
    return await response.json();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function gradeTheoryAnswers(
  questions: { question: string; idealAnswer: string }[],
  answers: Record<number, string>
) {
  try {
    const response = await fetch("/api/quiz/grade-theory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions, answers }),
    });
    
    if (!response.ok) throw new Error("Failed to grade answers");
    return await response.json();
  } catch (error) {
    console.error("AI Grading failed:", error);
    return questions.map(() => 0);
  }
}

export async function generateAIFeedback(
  subject: string,
  classLevel: string,
  score: number,
  total: number
) {
  try {
    const response = await fetch("/api/quiz/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, classLevel, score, total }),
    });
    
    if (!response.ok) throw new Error("Failed to generate feedback");
    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error("Gemini Feedback Error:", error);
    return "Excellent work completing your assessment! Keep practicing these core concepts to build your academic foundation at Ark Academy.";
  }
}
