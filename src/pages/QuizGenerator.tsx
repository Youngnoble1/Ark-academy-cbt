/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useProfile } from "@/src/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SYLLABUS } from "@/src/constants";
import { generateQuizQuestions } from "@/src/services/geminiService";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BrainCircuit, Loader2, Sparkles, ChevronLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function QuizGenerator() {
  const { profile } = useProfile();
  const [subject, setSubject] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!subject) {
      toast.error("Please select a subject");
      return;
    }

    setLoading(true);
    try {
      const classLevel = profile!.classLevel;
      const classSyllabus = SYLLABUS[classLevel as any];
      
      let category = "General";
      if (classLevel === "SS 1") {
        category = profile?.department === "Science" ? "Science" : (profile?.department === "Arts" ? "Arts" : (profile?.department === "Commercial" ? "Commercial" : "Core"));
      } else if (classLevel === "Primary 3" || classLevel === "JSS 3" || classLevel === "JSSCE (WAEC)") {
        category = "General";
      }
      
      const categoryData = classSyllabus[category] || classSyllabus["General"] || Object.values(classSyllabus)[0];
      const subjectData = (categoryData as any[]).find((s: any) => s.name === subject);
      const topics = subjectData?.topics || [];

      toast.info("AI is generating your questions...", { duration: 5000 });
      
      // Request 10 MCQ and 2 Theory for practice
      const data = await generateQuizQuestions(subject, profile!.classLevel, topics, 10, 2);
      
      const quiz = {
        id: uuidv4(),
        title: `${subject} Practice Test`,
        subject,
        classLevel: profile!.classLevel,
        topics: topics.slice(0, 3),
        questions: data.questions,
        theoryQuestions: data.theoryQuestions,
        timeLimit: 30, // 30 mins for practice
        createdAt: new Date().toISOString(),
      };

      // Store locally
      const savedQuizzes = JSON.parse(localStorage.getItem("ark_quizzes") || "[]");
      localStorage.setItem("ark_quizzes", JSON.stringify([quiz, ...savedQuizzes]));

      toast.success("Quiz generated successfully!");
      navigate(`/quiz/${quiz.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const availableSubjects = profile ? 
    Object.values(SYLLABUS[profile.classLevel as any] || {}).flat() : [];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/dashboard")} 
        className="mb-6 gap-2 text-slate-500 hover:text-slate-900"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      <Card className="shadow-xl border-none">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <BrainCircuit className="text-blue-600 w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">AI Quiz Generator</CardTitle>
          <CardDescription className="text-base mt-2">
            Select a subject and Gemini AI will create a personalized test based on your {profile?.classLevel} syllabus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-3">
            <Label htmlFor="subject" className="text-sm font-bold uppercase tracking-wider text-slate-400">Choose Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject" className="h-14 bg-slate-50 border-slate-100 text-lg">
                <SelectValue placeholder="Which subject are we practicing today?" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((s: any) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900/80 leading-relaxed">
                <p className="font-bold mb-1 text-amber-900">Personalized Learning experience</p>
                <p>Gemini AI will analyze your curriculum and produce 10 multiple-choice questions with detailed explanations for a better understanding.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8">
          <Button className="w-full h-14 text-xl font-bold gap-3 shadow-lg shadow-blue-600/30" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Crafting Your Test...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Test
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
