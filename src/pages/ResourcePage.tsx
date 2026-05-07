/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useProfile } from "@/src/context/ProfileContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ExternalLink, FileText, Globe, CheckCircle2 } from "lucide-react";
import { SYLLABUS } from "@/src/constants";

export default function ResourcePage() {
  const { profile } = useProfile();
  
  const currentSyllabus = profile ? SYLLABUS[profile.classLevel as any] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Learning Resources</h1>
        <p className="text-lg text-slate-600 max-w-2xl">
          Curated materials and study guides for {profile?.classLevel} {profile?.department ? `• ${profile.department}` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Syllabus Section */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
            <BookOpen className="text-blue-600 w-8 h-8" />
            Core Subjects Syllabus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentSyllabus && Object.entries(currentSyllabus).map(([cat, subjects]) => (
              (subjects as any[]).map((subj) => (
                <Card key={subj.name} className="overflow-hidden border-none shadow-xl shadow-slate-200/30 rounded-3xl group">
                  <div className="h-3 bg-blue-600 w-0 group-hover:w-full transition-all duration-500" />
                  <CardHeader className="bg-slate-50/50">
                    <CardTitle className="font-bold text-xl">{subj.name}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-widest font-black text-slate-400">{cat} Subject</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {subj.topics.map((topic: string) => (
                        <li key={topic} className="text-sm text-slate-600 flex items-start gap-3 leading-tight">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ))}
          </div>
        </div>

        {/* Recommended Links/Files */}
        <div className="space-y-8">
          <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
             <Globe className="text-blue-600 w-8 h-8" />
             Study Materials
          </h2>
          <div className="space-y-4">
            <ResourceLink 
              title="English Grammar Guide" 
              type="PDF" 
              description="Comprehensive guide on complex sentence structures."
            />
            <ResourceLink 
              title="Mathematics Practice Set" 
              type="Worksheet" 
              description="Factoring and Quadratic equations practice problems."
            />
             <ResourceLink 
              title="Physics Simulation Lab" 
              type="Interactive" 
              description="Visualizing kinetic and potential energy."
            />
            <ResourceLink 
              title="Civic Education Constitution" 
              type="Doc" 
              description="Summary of the national constitution for students."
            />
          </div>

          <Card className="bg-slate-900 border-none text-white rounded-3xl p-4 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Need more help?</CardTitle>
              <CardDescription className="text-slate-400">Our academic team is here to support your learning journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <button className="w-full h-12 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                Contact Education Team
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ResourceLink({ title, type, description }: { title: string; type: string; description: string }) {
  return (
    <Card className="hover:border-blue-200 transition-all cursor-pointer group rounded-2xl shadow-sm border-slate-100">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
           <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
            <Badge variant="secondary" className="text-[9px] h-4 px-2 font-black uppercase tracking-tighter bg-slate-100 text-slate-500">{type}</Badge>
          </div>
          <p className="text-xs text-slate-500 leading-snug">{description}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-600 self-center" />
      </CardContent>
    </Card>
  );
}
