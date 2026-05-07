/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useProfile, QuizResult } from "@/src/context/ProfileContext";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Search, Calendar, User as UserIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  const { profile } = useProfile();
  const [allResults, setAllResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredResults = allResults.filter(r => 
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Test Records</h1>
          <p className="text-slate-500 font-medium">Monitoring all student academic performance across Ark Academy.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search student or subject..." 
            className="pl-10 h-11 bg-white border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white pb-6 pt-8">
            <CardTitle className="text-3xl font-black">{allResults.length}</CardTitle>
            <CardDescription className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">Total Assessments</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white pb-6 pt-8">
            <CardTitle className="text-3xl font-black">
              {new Set(allResults.map(r => r.userId)).size}
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Active Students</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6 pt-8">
            <CardTitle className="text-3xl font-black text-slate-900">
              {allResults.length > 0 ? Math.round(allResults.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / allResults.length * 100) : 0}%
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Average Mastery</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest pl-8 py-6">Student</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6">Quiz & Subject</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6">Score</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest py-6">Status</TableHead>
                    <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest pr-8 py-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => {
                    const percentage = (result.score / result.totalQuestions) * 100;
                    const isPassed = percentage >= 70;
                    
                    return (
                      <TableRow key={result.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="pl-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                 <UserIcon className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-900">{result.userName || "Unknown Student"}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{result.quizTitle}</span>
                              <span className="text-xs text-slate-400 font-medium">{result.subject}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-slate-900">{result.score}</span>
                              <span className="text-slate-300 font-medium">/ {result.totalQuestions}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <Badge className={`px-3 py-1 font-bold border-none ${isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                             {isPassed ? <CheckCircle2 className="w-3 h-3 mr-1 inline" /> : <XCircle className="w-3 h-3 mr-1 inline" />}
                             {isPassed ? "Passed" : "Needs Review"}
                           </Badge>
                        </TableCell>
                        <TableCell className="pr-8 py-6 text-slate-400 font-medium">
                           <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {format(result.completedAt, "MMM d, yyyy • HH:mm")}
                           </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">
                        No records found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
