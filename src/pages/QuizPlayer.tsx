/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile, Quiz } from "@/src/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle, GraduationCap, Sparkles, BookOpen, ChevronLeft, Send, PenTool, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { generateAIFeedback, gradeTheoryAnswers } from "@/src/services/geminiService";

export default function QuizPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, addResult } = useProfile();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [theoryAnswers, setTheoryAnswers] = useState<Record<number, string>>({});
  const [mode, setMode] = useState<"mcq" | "theory">("mcq");
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);
  const [quizStatus, setQuizStatus] = useState<"loading" | "ready" | "in_progress" | "completed">("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persistence: Load progress on start
  useEffect(() => {
    if (quizStatus === "loading" && id) {
      const savedProgress = localStorage.getItem(`ark_quiz_progress_${id}`);
      if (savedProgress) {
        try {
          const { selected, theory, time, idx, currentMode } = JSON.parse(savedProgress);
          setSelectedAnswers(selected);
          setTheoryAnswers(theory);
          setTimeLeft(time);
          setCurrentQuestionIndex(idx);
          setMode(currentMode);
          setQuizStatus("in_progress"); // Directly jump into exam
          toast.success("Resumed from previous session");
        } catch (e) {
          console.error("Failed to restore progress", e);
        }
      }
    }
  }, [quizStatus, id]);

  // Persistence: Save progress on change
  useEffect(() => {
    if (quizStatus === "in_progress" && id) {
      const progress = {
        selected: selectedAnswers,
        theory: theoryAnswers,
        time: timeLeft,
        idx: currentQuestionIndex,
        currentMode: mode
      };
      localStorage.setItem(`ark_quiz_progress_${id}`, JSON.stringify(progress));
    }
  }, [selectedAnswers, theoryAnswers, timeLeft, currentQuestionIndex, mode, quizStatus, id]);

  // Clear progress on completion
  useEffect(() => {
    if (quizStatus === "completed" && id) {
      localStorage.removeItem(`ark_quiz_progress_${id}`);
    }
  }, [quizStatus, id]);
  const [aiTheoryScores, setAiTheoryScores] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    function fetchQuiz() {
      if (!id) return;
      
      const savedQuizzes = JSON.parse(localStorage.getItem("ark_quizzes") || "[]");
      const data = savedQuizzes.find((q: any) => q.id === id);
      
      if (!data) {
        toast.error("Quiz not found");
        navigate("/dashboard");
        return;
      }
      setQuiz(data);
      setTimeLeft((data.timeLimit || 120) * 60);
      setQuizStatus("ready");
    }
    fetchQuiz();
  }, [id, navigate]);

  const handleSubmit = useCallback(async () => {
    if (quizStatus === "completed" || !quiz) return;
    
    setIsSubmitting(true);
    
    // MCQ Score
    const mcqScore = quiz.questions.reduce((acc: number, q: any, idx: number) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);

    // Theory Logic
    // In a real comprehensive app, we'd use Gemini here to score the theory answers
    // Let's implement a quick scoring simulation or real AI call if possible
    // AI Theory Grading
    let theoryScoreTotal = 0;
    let theoryResults: Record<number, number> = {};
    
    if (quiz.theoryQuestions && quiz.theoryQuestions.length > 0) {
      toast.info("AI is grading your theory answers...");
      const scores = await gradeTheoryAnswers(
        quiz.theoryQuestions.map(q => ({ question: q.text, idealAnswer: q.idealAnswer })),
        theoryAnswers
      );
      scores.forEach((s, idx) => {
        theoryResults[idx] = s;
        theoryScoreTotal += s;
      });
      setAiTheoryScores(theoryResults);
    }

    const totalPossibleMCQ = quiz.questions.length;
    const totalPossibleTheory = (quiz.theoryQuestions?.length || 0) * 8;
    const finalScore = mcqScore + theoryScoreTotal;
    const totalMax = totalPossibleMCQ + totalPossibleTheory;

    try {
      toast.info("Generating performance feedback...");
      const aiFeedback = await generateAIFeedback(
        quiz.subject,
        profile?.classLevel || "General",
        finalScore,
        totalMax
      );
      setFeedback(aiFeedback);

      await addResult({
        quizTitle: quiz.title,
        subject: quiz.subject,
        score: finalScore,
        totalQuestions: totalPossibleMCQ,
        totalTheoryQuestions: quiz.theoryQuestions?.length || 0,
        maxScore: totalMax,
        theoryScores: theoryResults,
        feedback: aiFeedback,
        answers: quiz.questions.map((q: any, idx: number) => ({
          question: q.text || q.question,
          selected: selectedAnswers[idx],
          correct: q.correctAnswer,
          isCorrect: selectedAnswers[idx] === q.correctAnswer
        })),
        theoryAnswers: quiz.theoryQuestions?.map((_, idx) => theoryAnswers[idx] || "")
      });

      setQuizStatus("completed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save results");
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, quizStatus, selectedAnswers, theoryAnswers, profile, addResult]);

  const handleNext = useCallback(() => {
    setQuestionTimeLeft(60); // Reset for next
    if (mode === "mcq") {
      if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (quiz?.theoryQuestions && quiz.theoryQuestions.length > 0) {
        setMode("theory");
        setCurrentQuestionIndex(0);
        toast.info("Entering Theory Section. Questions are 1 minute each.");
        setQuestionTimeLeft(60); // 1 min for theory as requested
      } else {
        handleSubmit();
      }
    } else {
      if (currentQuestionIndex < (quiz?.theoryQuestions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTimeLeft(60);
      } else {
        handleSubmit();
      }
    }
  }, [mode, currentQuestionIndex, quiz, handleSubmit]);

  const currentQuestionCount = mode === "mcq" ? (quiz?.questions.length || 0) : (quiz?.theoryQuestions?.length || 0);
  const totalCount = (quiz?.questions.length || 0) + (quiz?.theoryQuestions?.length || 0);
  const globalProgress = mode === "mcq" ? (currentQuestionIndex + 1) : ((quiz?.questions.length || 0) + currentQuestionIndex + 1);
  const progressPercentage = (globalProgress / totalCount) * 100;

  useEffect(() => {
    if (quizStatus !== "in_progress") return;

    const mainTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(mainTimer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const questionTimer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          toast.warning("Time up for this question!");
          handleNext();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(mainTimer);
      clearInterval(questionTimer);
    };
  }, [quizStatus, handleSubmit, handleNext]);

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
    const mcqScore = quiz.questions.reduce((acc: number, q: any, idx: number) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);
    
    let theoryScoreTotal = 0;
    if (quiz.theoryQuestions) {
      quiz.theoryQuestions.forEach((_, idx) => {
        theoryScoreTotal += aiTheoryScores[idx] || 0;
      });
    }

    const totalPossibleMCQ = quiz.questions.length;
    const totalPossibleTheory = (quiz.theoryQuestions?.length || 0) * 8;
    const finalScore = mcqScore + theoryScoreTotal;
    const totalMax = totalPossibleMCQ + totalPossibleTheory;
    const percentage = Math.round((finalScore / totalMax) * 100);

    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="shadow-2xl border-none overflow-hidden rounded-3xl">
             <div className={`h-2 ${percentage >= 70 ? "bg-green-500" : "bg-blue-500"}`} />
             <CardHeader className="text-center pt-10">
               <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <CardTitle className="text-4xl font-black text-slate-900 leading-tight tracking-tight">Performance Summary</CardTitle>
               <CardDescription className="text-lg mt-2">Comprehensive review of your {quiz.subject} Examination</CardDescription>
             </CardHeader>
             <CardContent className="space-y-10 px-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Score</p>
                    <div className="text-4xl font-black text-slate-900 mb-1">{finalScore}<span className="text-xl text-slate-300 font-medium">/{totalMax}</span></div>
                    <Badge className={`mt-2 px-3 py-1 text-[10px] font-black border-none rounded-lg ${percentage >= 70 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                     {percentage}% Mastery
                    </Badge>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Breakdown</p>
                    <div className="space-y-2 mt-4 text-left">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Objective (MCQ)</span>
                          <span className="text-slate-900">{mcqScore} / {totalPossibleMCQ}</span>
                       </div>
                       <div className="flex justify-between text-xs font-bold font-sans">
                          <span className="text-slate-500">Theory (Assessed)</span>
                          <span className="text-slate-900">{theoryScoreTotal} / {totalPossibleTheory}</span>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 flex flex-col justify-center shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-slate-900">AI Feed</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-4">
                      "{feedback || "Excellent persistence. Reviewing incorrect answers is the fastest path to mastery."}"
                    </p>
                 </div>
               </div>

               <Tabs defaultValue="mcq-review" className="space-y-6">
                  <TabsList className="bg-slate-100 rounded-xl p-1">
                    <TabsTrigger value="mcq-review" className="rounded-lg font-bold">Objective Review</TabsTrigger>
                    <TabsTrigger value="theory-review" className="rounded-lg font-bold">Theory Answers</TabsTrigger>
                  </TabsList>

                  <TabsContent value="mcq-review">
                    <div className="space-y-4 pb-10">
                      {quiz.questions.map((q: any, idx: number) => {
                        const isCorrect = selectedAnswers[idx] === q.correctAnswer;
                        return (
                          <div key={idx} className={`p-6 rounded-2xl border transition-all ${isCorrect ? "bg-green-50/20 border-green-100" : "bg-red-50/20 border-red-100"}`}>
                            <p className="font-bold text-slate-900 mb-4 leading-tight text-lg">{idx + 1}. {q.text || q.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            {q.explanation && (
                              <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                  <Info className="w-3 h-3" />
                                  Explanation
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed italic">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="theory-review">
                    <div className="space-y-6 pb-10">
                       {quiz.theoryQuestions?.map((q, idx) => (
                          <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <div className="flex justify-between items-start mb-6">
                                <h4 className="font-black text-xl text-slate-900 max-w-lg">{idx + 1}. {q.question || q.text}</h4>
                                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20">
                                   Score: {aiTheoryScores[idx] || 0} / 8
                                </div>
                             </div>
                             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Your Answer</p>
                               <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {theoryAnswers[idx] || "No answer provided"}
                               </p>
                            </div>
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                               <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Ideal Answer Guide</span>
                               </div>
                               <p className="text-sm text-slate-600 leading-relaxed">
                                  {q.idealAnswer || "Focus on describing the key concepts clearly and citing relevant examples."}
                               </p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </TabsContent>
               </Tabs>
             </CardContent>
             <CardFooter className="bg-slate-50/50 border-t p-8 gap-4">
               <Button onClick={() => navigate("/dashboard")} className="flex-1 h-14 text-lg font-black shadow-lg shadow-blue-600/10">Return Home</Button>
               <Button variant="outline" onClick={() => window.print()} className="flex-1 h-14 text-lg font-bold border-slate-200">Print Result</Button>
             </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = mode === "mcq" ? quiz.questions[currentQuestionIndex] : quiz.theoryQuestions?.[currentQuestionIndex];
  
  if (!currentQuestion) return null;

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
              <div className="flex items-center gap-2">
                 <Badge className="bg-blue-600 font-black text-[9px] uppercase px-1.5 py-0.5 border-none h-4 rounded-md">{quiz.subject}</Badge>
                 <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0.5 border-slate-200 h-4 rounded-md font-bold">
                    {mode === "mcq" ? "Part I: Objective" : "Part II: Theory"}
                 </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Question Timer</span>
                <div className={`flex items-center gap-2 font-mono text-xl font-black ${questionTimeLeft < 10 ? "text-red-500 animate-pulse" : "text-blue-600"}`}>
                  <Clock className="w-5 h-5 shrink-0" />
                  {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
                </div>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Time</span>
                <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeLeft < 300 ? "text-amber-500" : "text-slate-400"}`}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
             </div>
             <Button 
               variant="outline" 
               className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 font-black px-6"
               onClick={() => {
                 if (confirm("Submit exam now?")) {
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Overall Completion</span>
                <span className="text-3xl font-black text-slate-900">{globalProgress}<span className="text-slate-300 font-medium">/{totalCount}</span></span>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{Math.round(progressPercentage)}% Complete</span>
           </div>
           <Progress value={progressPercentage} className="h-2.5 bg-slate-200 border border-slate-100 rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${currentQuestionIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <Card className="border-none shadow-2xl shadow-slate-200/40 overflow-hidden rounded-[2.5rem]">
              <CardHeader className="p-12 pb-6">
                <div className="flex items-center gap-2 mb-4">
                   {mode === "mcq" ? (
                     <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" />
                     </div>
                   ) : (
                     <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                        <PenTool className="w-4 h-4" />
                     </div>
                   )}
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                     Question {currentQuestionIndex + 1} of {currentQuestionCount}
                   </span>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 leading-tight">
                  {currentQuestion.text || currentQuestion.question}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-12 pt-4">
                {mode === "mcq" ? (
                  <div className="grid grid-cols-1 gap-4">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: index }));
                        }}
                        className={`flex items-center p-6 rounded-3xl border-2 text-left transition-all group relative ${
                          selectedAnswers[currentQuestionIndex] === index
                            ? "bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-600/30"
                            : "bg-white border-slate-100 hover:border-blue-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center mr-6 font-black text-lg transition-colors ${
                           selectedAnswers[currentQuestionIndex] === index 
                           ? "bg-white text-blue-600 border-white" 
                           : "bg-slate-50 text-slate-300 border-slate-100 group-hover:border-blue-200 group-hover:text-blue-600"
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-xl font-bold flex-grow">{option}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                   <div className="space-y-4">
                      <Textarea 
                        placeholder="Type your comprehensive answer here..."
                        className="min-h-[300px] rounded-3xl border-2 border-slate-100 focus:border-purple-500 focus:ring-0 p-8 text-lg font-medium leading-relaxed resize-none bg-slate-50/50"
                        value={theoryAnswers[currentQuestionIndex] || ""}
                        onChange={(e) => {
                          setTheoryAnswers(prev => ({ ...prev, [currentQuestionIndex]: e.target.value }));
                        }}
                      />
                      <div className="flex justify-between items-center px-4">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                           Characters: {(theoryAnswers[currentQuestionIndex] || "").length}
                         </span>
                         <span className="text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded-md">
                           8 Marks Allocation
                         </span>
                      </div>
                   </div>
                )}
              </CardContent>

              <CardFooter className="bg-slate-50/50 p-12 border-t flex justify-between items-center gap-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (mode === "mcq") {
                      setCurrentQuestionIndex(p => Math.max(0, p - 1));
                    } else {
                       if (currentQuestionIndex === 0) {
                         setMode("mcq");
                         setCurrentQuestionIndex((quiz?.questions.length || 1) - 1);
                       } else {
                         setCurrentQuestionIndex(p => p - 1);
                       }
                    }
                  }}
                  className="h-16 px-10 text-lg font-bold rounded-2xl text-slate-400 hover:text-slate-900"
                >
                  Previous
                </Button>
                
                <Button onClick={handleNext} disabled={isSubmitting} className={`h-16 px-14 text-xl font-black rounded-3xl shadow-2xl transition-all ${mode === "mcq" ? "bg-blue-600 shadow-blue-600/20" : "bg-purple-600 shadow-purple-600/20"}`}>
                  {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : (
                    mode === "mcq" && currentQuestionIndex === (quiz?.questions.length || 0) - 1 ? "Start Theory Section" : 
                    globalProgress === totalCount ? "Submit Examination" : "Next Question"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
