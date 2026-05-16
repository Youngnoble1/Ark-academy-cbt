/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useProfile } from "@/src/context/ProfileContext";
import { BECE_DATA, BECEChallenge, MCQQuestion, TheoryQuestion } from "../data/bece_questions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, ArrowRight, Trophy, BookOpen, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ChallengeMode() {
  const { profile, addResult } = useProfile();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentSubjectStep] = useState<"mcq" | "theory" | "results">("mcq");
  
  // MCQ state
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [mcqAnswers, setMCQAnswers] = useState<Record<number, string>>({});
  
  // Theory state
  const [currentTheoryIndex, setCurrentTheoryIndex] = useState(0);
  const [theoryAnswers, setTheoryAnswers] = useState<Record<number, string>>({});
  
  const [isFinished, setIsFinished] = useState(false);

  const subjectData = selectedSubject ? BECE_DATA[selectedSubject] : null;

  const handleStart = () => {
    if (!selectedSubject) return;
    setIsStarted(true);
    setCurrentSubjectStep("mcq");
    setCurrentMCQIndex(0);
    setCurrentTheoryIndex(0);
    setMCQAnswers({});
    setTheoryAnswers({});
    setIsFinished(false);
  };

  const handleMCQAnswer = (answer: string) => {
    setMCQAnswers(prev => ({ ...prev, [currentMCQIndex]: answer }));
  };

  const nextMCQ = () => {
    if (!subjectData) return;
    if (currentMCQIndex < subjectData.mcqs.length - 1) {
      setCurrentMCQIndex(prev => prev + 1);
    } else {
      setCurrentSubjectStep("theory");
    }
  };

  const handleTheorySubmit = () => {
    if (currentTheoryIndex < (subjectData?.theory.length || 0) - 1) {
      setCurrentTheoryIndex(prev => prev + 1);
    } else {
      finishChallenge();
    }
  };

  const finishChallenge = async () => {
    if (!subjectData) return;
    
    let mcqScore = 0;
    subjectData.mcqs.forEach((q, idx) => {
      if (mcqAnswers[idx] === q.correctAnswer) mcqScore++;
    });

    const totalQuestions = subjectData.mcqs.length + subjectData.theory.length;
    
    await addResult({
      quizTitle: `BECE Challenge: ${selectedSubject}`,
      subject: selectedSubject!,
      score: mcqScore, // Theory isn't auto-graded in this simplified mockup
      totalQuestions: totalQuestions,
      feedback: `You completed the ${selectedSubject} challenge with ${mcqScore} correct MCQs. Your theory responses are saved for review.`,
      answers: [mcqAnswers, theoryAnswers]
    });

    setCurrentSubjectStep("results");
    setIsFinished(true);
  };

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 font-bold px-4 py-1">BECE Challenge Mode</Badge>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Are you ready to test your limits?</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Standard BECE questions categorized by subject. 60 Objectives + 5 Theory questions to simulate a real exam environment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(BECE_DATA).map((subject) => (
            <Card 
              key={subject}
              id={`subject-${subject.replace(/\s+/g, '-').toLowerCase()}`}
              className={`cursor-pointer transition-all border-2 rounded-3xl overflow-hidden ${selectedSubject === subject ? "border-blue-600 ring-4 ring-blue-50 shadow-xl" : "border-slate-100 hover:border-slate-200"}`}
              onClick={() => setSelectedSubject(subject)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${selectedSubject === subject ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="font-bold border-slate-200">
                    {BECE_DATA[subject].mcqs.length} MCQs
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold mt-4">{subject}</CardTitle>
                <CardDescription>Comprehensive practice from BECE master archives.</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button 
            disabled={!selectedSubject}
            onClick={handleStart}
            size="lg" 
            className="h-14 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-blue-200"
          >
            Start Challenge <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === "results") {
    const mcqScore = subjectData?.mcqs.filter((q, i) => mcqAnswers[i] === q.correctAnswer).length || 0;
    const totalMCQs = subjectData?.mcqs.length || 0;
    const percentage = Math.round((mcqScore / totalMCQs) * 100);

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-yellow-100">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Challenge Completed!</h1>
          <p className="text-slate-500 mb-8 font-medium">Excellent work on the {selectedSubject} challenge.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-12">
            <Card className="border-none bg-slate-50 p-6 rounded-3xl">
              <div className="text-3xl font-black text-slate-900">{mcqScore} / {totalMCQs}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Objective Score</div>
            </Card>
            <Card className="border-none bg-slate-50 p-6 rounded-3xl">
              <div className="text-3xl font-black text-slate-900">{percentage}%</div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Accuracy</div>
            </Card>
          </div>

          <div className="text-left space-y-6 mb-12">
            <h2 className="text-2xl font-black text-slate-900 px-2">Detailed Review</h2>
            <div className="space-y-4">
              {subjectData?.mcqs.map((q, idx) => {
                const isCorrect = mcqAnswers[idx] === q.correctAnswer;
                return (
                  <div key={idx} className={`p-6 rounded-3xl border ${isCorrect ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"}`}>
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-bold text-slate-900">{idx + 1}. {q.question}</p>
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Your Answer</span>
                        <span className={isCorrect ? "text-green-700 font-bold" : "text-red-700 font-bold"}>{mcqAnswers[idx] || "No answer"}</span>
                      </div>
                      {!isCorrect && (
                        <div className="p-3 bg-green-100 border border-green-200 rounded-xl">
                          <span className="text-[10px] font-black text-green-600 uppercase block mb-1">Correct Answer</span>
                          <span className="text-green-800 font-black">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                    {q.explanation && (
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-xs text-blue-700 leading-relaxed italic">
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] mb-12 flex items-start gap-4 text-left shadow-sm">
            <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <p className="text-blue-900 font-black mb-1">Theory Reference</p>
              <p className="text-sm text-blue-700/80 leading-relaxed">
                Your performance in the Objective section was {percentage}%. Compare your theory answers against the curriculum benchmarks below.
              </p>
              <div className="mt-6 space-y-6">
                {subjectData?.theory.map((q, idx) => (
                  <div key={idx} className="bg-white/50 p-6 rounded-2xl border border-blue-100">
                    <p className="font-bold text-slate-900 mb-2">{q.question}</p>
                    <div className="mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Your Answer</span>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">{theoryAnswers[idx] || "Not answered"}</p>
                    </div>
                    <div className="pt-4 border-t border-blue-100/50">
                      <span className="text-[10px] font-bold text-green-600 uppercase">Ideal Guide</span>
                      <p className="text-xs text-slate-500 italic mt-1">{q.answerKey}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setIsStarted(false)} className="rounded-2xl h-12 px-8">Back to Selection</Button>
            <Button onClick={() => window.location.reload()} className="rounded-2xl h-12 px-8">Return Home</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
            {currentStep === "mcq" ? currentMCQIndex + 1 : currentTheoryIndex + 1}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              {currentStep === "mcq" ? "Objectives Section" : "Theory Section"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{selectedSubject}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</div>
          <div className="flex items-center gap-3">
             <Progress 
               value={
                 currentStep === "mcq" 
                   ? (currentMCQIndex / subjectData!.mcqs.length) * 100 
                   : (currentTheoryIndex / subjectData!.theory.length) * 100
               } 
               className="h-2 w-32 md:w-48"
             />
             <span className="text-xs font-bold text-slate-900 shrink-0">
               {currentStep === "mcq" 
                 ? `${currentMCQIndex + 1} / ${subjectData!.mcqs.length}` 
                 : `${currentTheoryIndex + 1} / ${subjectData!.theory.length}`
               }
             </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentStep === "mcq" ? `mcq-${currentMCQIndex}` : `theory-${currentTheoryIndex}`}
           initial={{ x: 20, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: -20, opacity: 0 }}
           transition={{ duration: 0.2 }}
        >
          {currentStep === "mcq" ? (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <div className="flex gap-2 mb-4">
                     <Badge variant="secondary" className="px-3 py-1 font-bold">Question {currentMCQIndex + 1}</Badge>
                  </div>
                  <CardTitle className="text-2xl font-black leading-tight text-slate-900">
                    {subjectData?.mcqs[currentMCQIndex].question}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-4">
                  <RadioGroup 
                    className="space-y-4"
                    value={mcqAnswers[currentMCQIndex] || ""}
                    onValueChange={(val) => handleMCQAnswer(val)}
                  >
                    {subjectData?.mcqs[currentMCQIndex].options.map((option, idx) => {
                       const isSelected = mcqAnswers[currentMCQIndex] === option;
                       
                       let bgColor = "bg-slate-50";
                       let borderColor = "border-slate-100";
                       
                       if (isSelected) {
                         borderColor = "border-blue-600";
                         bgColor = "bg-blue-50";
                       }

                       return (
                         <div key={idx} className={`relative flex items-center p-5 rounded-2xl border-2 transition-all ${borderColor} ${bgColor}`}>
                            <RadioGroupItem value={option} id={`opt-${idx}`} className="sr-only" />
                            <Label 
                              htmlFor={`opt-${idx}`} 
                              className="flex items-center justify-between w-full cursor-pointer font-bold text-slate-700"
                            >
                              <div className="flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mr-4 text-xs font-black text-slate-400">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {option}
                              </div>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm" />}
                            </Label>
                         </div>
                       );
                    })}
                  </RadioGroup>
               </CardContent>
               <CardFooter className="p-8 pt-0 flex justify-end">
                  <Button 
                    disabled={!mcqAnswers[currentMCQIndex]} 
                    onClick={nextMCQ} 
                    className="h-12 px-8 rounded-xl font-bold"
                  >
                    Next Question <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </CardFooter>
            </Card>
          ) : (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <div className="flex gap-2 mb-4">
                     <Badge className="px-3 py-1 font-bold bg-slate-900">Theory Question {currentTheoryIndex + 1}</Badge>
                  </div>
                  <CardTitle className="text-2xl font-black leading-tight text-slate-900">
                    {subjectData?.theory[currentTheoryIndex].question}
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium mt-2 italic">Provide a comprehensive answer in the space provided below.</CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-4">
                  <Textarea 
                    placeholder="Type your response here..."
                    className="min-h-[250px] rounded-3xl border-2 border-slate-100 focus:border-slate-900 p-6 font-medium text-lg leading-relaxed shadow-inner"
                    value={theoryAnswers[currentTheoryIndex] || ""}
                    onChange={(e) => setTheoryAnswers(prev => ({ ...prev, [currentTheoryIndex]: e.target.value }))}
                  />
               </CardContent>
               <CardFooter className="p-8 pt-0 flex justify-end">
                  <Button 
                    disabled={!theoryAnswers[currentTheoryIndex]} 
                    onClick={handleTheorySubmit} 
                    className="h-12 px-8 rounded-xl font-bold bg-slate-900"
                  >
                    {currentTheoryIndex < (subjectData?.theory.length || 0) - 1 ? "Next Question" : "Finish Challenge"} 
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
               </CardFooter>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
