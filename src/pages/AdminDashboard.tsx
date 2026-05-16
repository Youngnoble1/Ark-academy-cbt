/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { useProfile, QuizResult, Quiz } from "@/src/context/ProfileContext";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle2, XCircle, Search, Calendar, User as UserIcon, Loader2, 
  Settings, Trash2, Edit3, Plus, BrainCircuit, Printer, FileText, BarChart3,
  BookOpen, Hash, TrendingUp, Info, ShieldCheck, ArrowUpDown, ChevronUp, ChevronDown, Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateQuizQuestions } from "@/src/services/geminiService";
import { SYLLABUS } from "@/src/constants";

export default function AdminDashboard() {
  const { profile, quizzes, saveQuiz, deleteQuiz } = useProfile();
  const [allResults, setAllResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'completedAt', direction: 'desc' });
  const [subjectFilter, setSubjectFilter] = useState<string>("All");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAllResults() {
      if (!profile?.isAdmin) return;
      
      try {
        const resultsQuery = query(collection(db, "results"), orderBy("completedAt", "desc"));
        const snapshot = await getDocs(resultsQuery);
        const fetchedResults = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          completedAt: doc.data().completedAt.toDate()
        })) as QuizResult[];
        setAllResults(fetchedResults);
      } catch (error) {
        console.error("Error fetching results", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllResults();
  }, [profile]);

  if (!profile?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleQuickGenerate = async (subject: string) => {
    setGenLoading(true);
    try {
      const classLevel = "SS 1"; // Default or dynamic
      const topics = ["General Review", "Current Curriculum"];
      
      toast.info(`Generating global ${subject} exam (50 MCQ + 5 Theory)...`);
      const data = await generateQuizQuestions(subject, classLevel, topics, 50, 5);
      
      await saveQuiz({
        title: `${subject} Global Examination`,
        subject,
        classLevel,
        topics,
        questions: data.questions,
        theoryQuestions: data.theoryQuestions,
        timeLimit: 120, // 2 hours for full exam
        isGlobal: true
      });
      
      toast.success(`${subject} exam published to all students!`);
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setGenLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredResults = allResults.filter(r => {
    const matchesSearch = (
      r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesSubject = subjectFilter === "All" || r.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let aValue: any;
    let bValue: any;

    if (key === 'percentage') {
      aValue = (a.score / (a.maxScore || a.totalQuestions)) * 100;
      bValue = (b.score / (b.maxScore || b.totalQuestions)) * 100;
    } else {
      aValue = (a as any)[key];
      bValue = (b as any)[key];
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const uniqueSubjects = ["All", ...Array.from(new Set(allResults.map(r => r.subject)))];

  // Group analytics by student
  const studentStats = allResults.reduce((acc, r) => {
    const uid = r.userId;
    if (!acc[uid]) {
      acc[uid] = {
        name: r.userName,
        attempts: 0,
        avgScore: 0,
        subjects: {} as Record<string, { total: number, count: number }>
      };
    }
    acc[uid].attempts++;
    acc[uid].avgScore += (r.score / (r.maxScore || r.totalQuestions)) * 100;
    
    if (!acc[uid].subjects[r.subject]) {
      acc[uid].subjects[r.subject] = { total: 0, count: 0 };
    }
    acc[uid].subjects[r.subject].total += (r.score / (r.maxScore || r.totalQuestions)) * 100;
    acc[uid].subjects[r.subject].count++;
    
    return acc;
  }, {} as any);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-slate-500 font-medium ml-12">Academic oversight, quiz distribution, and student history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold h-12" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search everything..." 
              className="pl-10 h-12 bg-white border-slate-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden group">
          <CardHeader className="bg-blue-600 text-white pb-6 pt-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <FileText className="w-16 h-16" />
            </div>
            <CardTitle className="text-4xl font-black">{allResults.length}</CardTitle>
            <CardDescription className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">Total Tests Taken</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden group">
          <CardHeader className="bg-slate-900 text-white pb-6 pt-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <UserIcon className="w-16 h-16" />
            </div>
            <CardTitle className="text-4xl font-black">
              {new Set(allResults.map(r => r.userId)).size}
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Active Students</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden group">
          <CardHeader className="bg-emerald-600 text-white pb-6 pt-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-16 h-16" />
            </div>
            <CardTitle className="text-4xl font-black text-white">
              {quizzes.length}
            </CardTitle>
            <CardDescription className="text-emerald-100 font-bold uppercase tracking-widest text-[10px]">Published Quizzes</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden group">
          <CardHeader className="bg-white border-2 border-slate-100 pb-6 pt-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-16 h-16 text-slate-900" />
            </div>
            <CardTitle className="text-4xl font-black text-slate-900">
              {allResults.length > 0 ? Math.round(allResults.reduce((acc, r) => acc + (r.score / (r.maxScore || r.totalQuestions)), 0) / allResults.length * 100) : 0}%
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Mean Mastery</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-8">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 h-auto">
            <TabsTrigger value="history" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              <Calendar className="w-4 h-4 mr-2" />
              Quiz History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Student Analytics
            </TabsTrigger>
            <TabsTrigger value="library" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Quiz Library
            </TabsTrigger>
            <TabsTrigger value="generator" className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600">
              <BrainCircuit className="w-4 h-4 mr-2" />
              AI Exam Lab
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
              <select 
                className="text-sm font-bold text-slate-900 bg-transparent border-none focus:ring-0 cursor-pointer"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                   <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Records...</p>
                </div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible">
                  <Table id="printable-table">
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead 
                          className="font-black text-slate-400 text-[10px] uppercase tracking-widest pl-8 py-6 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('userName')}
                        >
                          <div className="flex items-center gap-2">
                            Student
                            {sortConfig?.key === 'userName' ? (
                              sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('quizTitle')}
                        >
                          <div className="flex items-center gap-2">
                            Knowledge Area
                            {sortConfig?.key === 'quizTitle' ? (
                              sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('percentage')}
                        >
                          <div className="flex items-center gap-2">
                            Performance
                            {sortConfig?.key === 'percentage' ? (
                              sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </TableHead>
                        <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6">Status</TableHead>
                        <TableHead 
                          className="font-black text-slate-400 text-[10px] uppercase tracking-widest pr-8 py-6 cursor-pointer hover:text-blue-600 transition-colors text-right"
                          onClick={() => handleSort('completedAt')}
                        >
                          <div className="flex items-center justify-end gap-2 text-right">
                            Completion
                            {sortConfig?.key === 'completedAt' ? (
                              sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults.map((result) => {
                        const percentage = (result.score / (result.maxScore || result.totalQuestions)) * 100;
                        const isPassed = percentage >= 70;
                        
                        return (
                          <TableRow key={result.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="pl-8 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                     <UserIcon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 leading-none mb-1">{result.userName || "Unknown Student"}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{result.userId.slice(0, 8)}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="py-6">
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{result.quizTitle}</span>
                                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{result.subject}</span>
                               </div>
                            </TableCell>
                            <TableCell className="py-6">
                               <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-lg font-black text-slate-900">{result.score}</span>
                                      <span className="text-slate-300 font-bold">/ {result.totalQuestions}</span>
                                    </div>
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${isPassed ? "bg-emerald-500" : "bg-red-500"}`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="py-6">
                               <Badge className={`px-3 py-1 font-bold border-none rounded-lg shadow-sm ${isPassed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                 {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline" /> : <XCircle className="w-3.5 h-3.5 mr-1.5 inline" />}
                                 {isPassed ? "Excellence" : "Revision Required"}
                               </Badge>
                            </TableCell>
                            <TableCell className="pr-8 py-6 text-slate-400 font-medium text-right">
                               <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                                    {format(result.completedAt, "HH:mm")}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-bold">
                                    {format(result.completedAt, "MMM d, yyyy")}
                                  </div>
                               </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Student Mastery & Weak Areas
                </CardTitle>
                <CardDescription>Aggregate performance mapping based on subject mastery.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="pl-8 font-black text-slate-400 text-[10px] uppercase py-6">Student</TableHead>
                      <TableHead className="font-black text-slate-400 text-[10px] uppercase py-6">Avg Performance</TableHead>
                      <TableHead className="font-black text-slate-400 text-[10px] uppercase py-6">Strengths</TableHead>
                      <TableHead className="font-black text-slate-400 text-[10px] uppercase py-6">Weak Areas</TableHead>
                      <TableHead className="pr-8 font-black text-slate-400 text-[10px] uppercase py-6 text-right">Tests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(studentStats).map(([uid, stats]: [string, any]) => {
                      const avg = stats.avgScore / stats.attempts;
                      
                      const subjectsList = Object.entries(stats.subjects).map(([name, data]: [string, any]) => ({
                        name,
                        score: data.total / data.count
                      })).sort((a, b) => b.score - a.score);

                      const strengths = subjectsList.filter(s => s.score >= 80).map(s => s.name);
                      const weaknesses = subjectsList.filter(s => s.score < 60).map(s => s.name);

                      return (
                        <TableRow key={uid}>
                          <TableCell className="pl-8 py-8">
                            <span className="font-bold text-slate-900">{stats.name}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className={`text-lg font-black ${avg >= 70 ? "text-emerald-600" : (avg >= 50 ? "text-amber-600" : "text-rose-600")}`}>
                                {Math.round(avg)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {strengths.length > 0 ? strengths.slice(0, 2).map(s => (
                                <Badge key={s} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none rounded-lg text-[10px] uppercase px-2 font-black">
                                  {s}
                                </Badge>
                              )) : <span className="text-slate-300 italic text-xs">Computing...</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-wrap gap-1.5">
                              {weaknesses.length > 0 ? weaknesses.slice(0, 2).map(s => (
                                <Badge key={s} className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-none rounded-lg text-[10px] uppercase px-2 font-black">
                                  {s}
                                </Badge>
                              )) : <span className="text-slate-300 italic text-xs">Safe</span>}
                            </div>
                          </TableCell>
                          <TableCell className="pr-8 text-right font-bold text-slate-400">
                            {stats.attempts}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map(quiz => (
                <Card key={quiz.id} className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <div className="bg-slate-900 p-6 flex items-center justify-between">
                    <Badge className="bg-blue-600 border-none rounded-lg font-black text-[10px] uppercase tracking-widest">
                       {quiz.subject}
                    </Badge>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" onClick={() => deleteQuiz(quiz.id)}>
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                  <CardContent className="p-6 pt-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{quiz.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                      <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {quiz.questions.length} MCQs</span>
                      <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> {quiz.theoryQuestions?.length || 0} Theory</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quiz.classLevel} Syllabus</span>
                       <Button variant="link" className="text-blue-600 font-bold p-0 h-auto">
                          Edit Content
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <button 
                onClick={() => toast.info("Use AI Exam Lab to generate new curriculum content")}
                className="group border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[300px]"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                  <Plus className="w-8 h-8 text-slate-300 group-hover:text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Add New Module</p>
                  <p className="text-xs text-slate-400 font-medium">Manually construct a custom test</p>
                </div>
              </button>
           </div>
        </TabsContent>

        <TabsContent value="generator">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden p-8 bg-slate-900 text-white relative">
                 <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                       <BrainCircuit className="w-7 h-7 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Exam Automator</h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                       Quickly generate full curriculum exams with 50 MCQs and 5 Theory questions for specific subjects.
                    </p>
                    
                    <div className="space-y-4">
                       {["Mathematics", "English Language", "Basic Science", "Social Studies", "Biology", "Physics", "Chemistry", "Economics"].map(subject => (
                          <div key={subject} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                             <span className="font-bold">{subject}</span>
                             <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20"
                              onClick={() => handleQuickGenerate(subject)}
                              disabled={genLoading}
                             >
                                {genLoading ? "Generating..." : "Generate & Publish"}
                             </Button>
                          </div>
                       ))}
                    </div>
                 </div>
              </Card>

              <div className="space-y-8">
                 <div className="bg-blue-600 rounded-3xl p-8 text-white">
                    <h3 className="text-2xl font-black mb-2">Platform Standards</h3>
                    <p className="text-blue-100 font-medium mb-6 italic opacity-80">"Consistency builds reliability in assessment."</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Standard MCQ</p>
                          <p className="text-xl font-black">50 Questions</p>
                          <p className="text-xs text-blue-100 opacity-60">1 Mark each</p>
                       </div>
                       <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Standard Theory</p>
                          <p className="text-xl font-black">5 Questions</p>
                          <p className="text-xs text-blue-100 opacity-60">8 Marks each</p>
                       </div>
                    </div>
                 </div>

                 <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                          <Info className="w-5 h-5 text-amber-600" />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900">Admin Tip</h3>
                    </div>
                    <p className="text-slate-500 font-medium leading-relaxed mb-6">
                       Global exams published here will appear on every student's dashboard under the "Assigned Modules" section. Ensure quizzes are generated for each class level individually if needed.
                    </p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current System Access</p>
                       <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          Authenticated as Academic Administrator
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>
      </Tabs>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-table, #printable-table * {
            visibility: visible;
          }
          #printable-table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
