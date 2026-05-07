/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useProfile } from "@/src/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, History, PlayCircle, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { SYLLABUS } from "@/src/constants";

export default function Dashboard() {
  const { profile, results } = useProfile();
  const navigate = useNavigate();

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / results.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-sans">Welcome, {profile?.name}!</h1>
          <p className="text-slate-500">
            {profile?.classLevel} {profile?.department ? `• ${profile.department}` : ""}
          </p>
        </div>
        <Button onClick={() => navigate("/quiz/new")} className="gap-2 shadow-lg shadow-blue-600/20">
          <PlayCircle className="w-4 h-4" />
          Take New Test
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Overall Progress" value={`${averageScore}%`} icon={<TrendingUp className="text-blue-600" />} progress={averageScore} />
        <StatCard title="Quizzes Completed" value={results.length.toString()} icon={<CheckCircle2 className="text-green-600" />} />
        <StatCard title="Learning Resources" value="12" icon={<BookOpen className="text-purple-600" />} />
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Performance History</TabsTrigger>
          <TabsTrigger value="syllabus" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Class Syllabus</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg">Recent Attempts</CardTitle>
              <CardDescription>Review your past performance and AI feedback.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {results.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {results.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                          <History className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{result.quizTitle}</h4>
                          <p className="text-sm text-slate-500">
                            {format(result.completedAt, "MMM dd, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900">{result.score}/{result.totalQuestions}</div>
                        <Badge className={`mt-1 ${result.score / result.totalQuestions >= 0.7 ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {Math.round((result.score / result.totalQuestions) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <GraduationCap className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">You haven't taken any quizzes yet.</p>
                  <Button variant="link" onClick={() => navigate("/quiz/new")} className="text-blue-600">Start your first test now</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile && Object.entries(SYLLABUS[profile.classLevel as any] || {}).map(([category, subjects]) => (
                <React.Fragment key={category}>
                  {(subjects as any[]).map((subj) => (
                    <Card key={subj.name} className="border-none shadow-sm h-full">
                      <CardHeader className="pb-3 border-b bg-slate-50/50">
                        <CardTitle className="text-lg font-bold">{subj.name}</CardTitle>
                        <CardDescription className="text-xs uppercase tracking-wider font-bold text-slate-400">{category}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {subj.topics.map((t: string) => (
                            <li key={t} className="text-sm text-slate-600 flex items-start gap-2 leading-tight">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </React.Fragment>
              ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon, progress }: { title: string; value: string; icon: React.ReactNode; progress?: number }) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
        </div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {progress !== undefined && (
          <div className="mt-4">
            <Progress value={progress} className="h-2 bg-slate-100" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
