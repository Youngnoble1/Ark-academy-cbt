/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "@/src/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle, GraduationCap, Sparkles, BookOpen, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { generateAIFeedback } from "@/src/services/geminiService";

export default function QuizPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, addResult } = useProfile();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStatus, setQuizStatus] = useState<"loading" | "ready" | "in_progress" | "completed">("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    function fetchQuiz() {
      if (!id) return;
      
      // Get from local storage
      const savedQuizzes = JSON.parse(localStorage.getItem("ark_quizzes") || "[]");
      const data = savedQuizzes.find((q: any) => q.id === id);
      
      if (!data) {
        toast.error("Quiz not found");
        navigate("/dashboard");
        return;
      }
      setQuiz(data);
      setTimeLeft((data.timeLimit || 15) * 60);
      setQuizStatus("ready");
    }
    fetchQuiz();
  }, [id, navigate]);

  const handleSubmit = useCallback(async () => {
    if (quizStatus === "completed" || !quiz) return;
    
    setIsSubmitting(true);
    
    const score = quiz.questions.reduce((acc: number, q: any, idx: number) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);

    try {
      toast.info("AI is analyzing your performance...");
      const aiFeedback = await generateAIFeedback(
        quiz.subject,
        profile?.classLevel || "General",
        score,
        quiz.questions.length
      );
      setFeedback(aiFeedback);

      // Save result locally
      await addResult({
        quizTitle: quiz.title,
        subject: quiz.subject,
        score,
        totalQuestions: quiz.questions.length,
        feedback: aiFeedback,
        answers: quiz.questions.map((q: any, idx: number) => ({
          question: q.text || q.question,
          selected: selectedAnswers[idx],
          correct: q.correctAnswer,
          isCorrect: selectedAnswers[idx] === q.correctAnswer
        }))
      });

      setQuizStatus("completed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save results");
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, quizStatus, selectedAnswers, profile, addResult]);

  useEffect(() => {
    if (quizStatus !== "in_progress" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStatus, timeLeft, handleSubmit]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizStatus !== "in_progress") return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerIndex,
    }));
  };

  if (quizStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium tracking-tight">Initializing Exam environment...</p>
      </div>
    );
  }

  if (quizStatus === "ready") {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <Card className="text-center overflow-hidden border-none shadow-2xl">
          <div className="h-32 bg-blue-600 flex flex-col items-center justify-center text-white">
            <GraduationCap className="w-12 h-12 mb-2" />
            <h1 className="font-bold text-xl uppercase tracking-widest">Ark Academy</h1>
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-black">{quiz.title}</CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">{quiz.subject}</Badge>
              <Badge variant="outline" className="border-slate-200">{quiz.questions.length} Multiple Choice Questions</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Timer</span>
                  <div className="font-black text-slate-900 text-lg">{quiz.timeLimit}m</div>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Passing</span>
                  <div className="font-black text-slate-900 text-lg">70%</div>
               </div>
            </div>
            <div className="text-sm text-slate-500 bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-left">
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Note: This test runs locally on your browser. Do not clear your browsing data if you want to keep your results.</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="pb-10 flex flex-col gap-4 px-10">
            <Button size="lg" className="w-full text-lg h-14 font-black shadow-lg shadow-blue-600/30" onClick={() => setQuizStatus("in_progress")}>
              Begin Assessment
            </Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-slate-400">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (quizStatus === "completed") {
    const score = quiz.questions.reduce((acc: number, q: any, idx: number) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="shadow-2xl border-none overflow-hidden rounded-3xl">
             <div className={`h-2 ${percentage >= 70 ? "bg-green-500" : "bg-blue-500"}`} />
             <CardHeader className="text-center pt-10">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <CardTitle className="text-4xl font-black text-slate-900 leading-tight tracking-tight">Test Completed!</CardTitle>
               <CardDescription className="text-lg mt-2">You've successfully finished the {quiz.title}.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-10 px-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-50 p-8 rounded-3xl text-center border border-slate-100">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Final Score</p>
                   <div className="text-6xl font-black text-slate-900 mb-1">{score}<span className="text-2xl text-slate-300 font-medium">/{quiz.questions.length}</span></div>
                   <Badge className={`mt-2 px-4 py-1 text-sm font-bold border-none ${percentage >= 70 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {percentage}% Correct
                   </Badge>
                 </div>
                 <div className="bg-white p-8 rounded-3xl border-2 border-slate-50 flex flex-col justify-center shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                      <h4 className="font-bold text-slate-900">AI Teacher Insight</h4>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic">
                      "{feedback || "Great job completing the test! Review your answers below to learn more."}"
                    </p>
                 </div>
               </div>

               <div className="space-y-6">
                 <h4 className="text-xl font-black text-slate-900 border-l-4 border-blue-600 pl-4">Review Results</h4>
                 <div className="space-y-4 pb-10">
                   {quiz.questions.map((q: any, idx: number) => {
                     const isCorrect = selectedAnswers[idx] === q.correctAnswer;
                     return (
                       <div key={idx} className={`p-6 rounded-2xl border transition-all ${isCorrect ? "bg-green-50/20 border-green-100" : "bg-red-50/20 border-red-100"}`}>
                         <p className="font-bold text-slate-900 mb-4 leading-tight text-lg">{idx + 1}. {q.text || q.question}</p>
                         <div className="space-y-3">
                           {q.options.map((opt: string, optIdx: number) => (
                             <div 
                               key={optIdx} 
                               className={`p-3 rounded-xl border text-sm flex items-center justify-between ${
                                 optIdx === q.correctAnswer 
                                   ? "bg-green-100 border-green-200 text-green-800 font-bold" 
                                   : optIdx === selectedAnswers[idx] && !isCorrect
                                     ? "bg-red-100 border-red-200 text-red-800 font-bold"
                                     : "bg-white border-slate-100 text-slate-400"
                               }`}
                             >
                               <span>{opt}</span>
                               {optIdx === q.correctAnswer && <CheckCircle2 className="w-4 h-4" />}
                               {optIdx === selectedAnswers[idx] && !isCorrect && <XCircle className="w-4 h-4" />}
                             </div>
                           ))}
                         </div>
                         {(q.explanation || q.content) && (
                           <div className="mt-4 p-3 bg-white/50 rounded-xl text-xs text-slate-500 leading-relaxed">
                             <span className="font-bold text-slate-900 block mb-1">Explanation:</span>
                             {q.explanation || q.content}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             </CardContent>
             <CardFooter className="bg-slate-50/50 border-t p-8 gap-4">
               <Button onClick={() => navigate("/dashboard")} className="flex-1 h-14 text-lg font-black shadow-lg shadow-blue-600/10">Return to Dashboard</Button>
               <Button variant="outline" onClick={() => window.print()} className="flex-1 h-14 text-lg font-bold border-slate-200">Print Report</Button>
             </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="sticky top-0 bg-white border-b z-50 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="font-black text-slate-900 leading-none mb-1 text-lg">{quiz.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{quiz.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exam Duration</span>
                <div className={`flex items-center gap-2 font-mono text-xl font-black ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-slate-900"}`}>
                  <Clock className="w-5 h-5 shrink-0" />
                  {formatTime(timeLeft)}
                </div>
             </div>
             <Button 
               variant="outline" 
               className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-black px-6"
               onClick={() => {
                 if (confirm("Are you sure you want to finalize your submission?")) {
                   handleSubmit();
                 }
               }}
             >
               Finalize
             </Button>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="mb-12">
           <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Progress</span>
                <span className="text-3xl font-black text-slate-900">{currentQuestionIndex + 1}<span className="text-slate-300 font-medium">/{quiz.questions.length}</span></span>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{Math.round(progress)}% Complete</span>
           </div>
           <Progress value={progress} className="h-2.5 bg-slate-200 border border-slate-100 rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <Card className="border-none shadow-2xl shadow-slate-200/40 overflow-hidden rounded-[2rem]">
              <CardHeader className="p-10 pb-6">
                <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                  {currentQuestion.text || currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`flex items-center p-6 rounded-2xl border-2 text-left transition-all group relative ${
                        selectedAnswers[currentQuestionIndex] === index
                          ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20"
                          : "bg-white border-slate-100 hover:border-blue-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-6 font-black text-lg transition-colors ${
                         selectedAnswers[currentQuestionIndex] === index 
                         ? "bg-white text-blue-600 border-white" 
                         : "bg-slate-50 text-slate-300 border-slate-100 group-hover:border-blue-200 group-hover:text-blue-600"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-xl font-bold flex-grow">{option}</span>
                      {selectedAnswers[currentQuestionIndex] === index && (
                        <CheckCircle2 className="w-6 h-6 text-white shrink-0 ml-4" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 p-10 border-t flex justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="h-14 px-8 text-lg font-bold rounded-2xl"
                >
                  Previous
                </Button>
                
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="h-14 px-12 text-xl font-black shadow-xl shadow-blue-600/20 bg-blue-600 rounded-2xl">
                    {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : "Finish & Submit"}
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentQuestionIndex((prev) => prev + 1)} className="h-14 px-12 text-xl font-black bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                    Continue to Next
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
