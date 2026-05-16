/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useProfile } from "@/src/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CLASSES, DEPARTMENTS } from "@/src/constants";
import { toast } from "sonner";
import { motion } from "motion/react";
import { auth } from "../lib/firebase";
import { ShieldCheck, GraduationCap, Database, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const { profile, saveProfile, loginWithGoogle, online } = useProfile();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"student" | "admin">(
    (searchParams.get("tab") as "student" | "admin") || "student"
  );
  
  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setClassLevel(profile.classLevel);
      setDepartment(profile.department || "");
    }
  }, [profile]);

  const handleComplete = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (activeTab === "student") {
      if (!classLevel) {
        toast.error("Please select your class level");
        return;
      }
      if (classLevel === "SS 1" && !department) {
        toast.error("Please select your department");
        return;
      }
    } else {
      if (!adminCode.trim()) {
        toast.error("Please enter the admin access code");
        return;
      }
      if (adminCode.trim() !== "6677") {
        toast.error("Invalid admin access code");
        return;
      }
    }

    setLoading(true);
    try {
      const isAdmin = adminCode.trim() === "6677";
      
      await saveProfile({
        name: name.trim(),
        classLevel: isAdmin ? "Admin" : classLevel,
        department: isAdmin ? "Management" : (classLevel === "SS 1" ? department : (classLevel === "JSSCE (WAEC)" ? "General" : undefined)),
        isAdmin: isAdmin
      });
      
      if (isAdmin) {
        toast.success("Admin privileges granted!");
      } else {
        toast.success(profile ? "Profile updated!" : "Welcome to Ark Academy!");
      }
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
              {activeTab === "admin" ? (
                <>
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                  Admin Entrance
                </>
              ) : (
                <>
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                  Student Onboarding
                </>
              )}
            </CardTitle>
            <CardDescription>
              {activeTab === "admin" 
                ? "Enter your access code to manage the academy." 
                : "Join Ark Academy and start your learning journey."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!auth.currentUser && (
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <Button 
                  variant="outline" 
                  className="w-full bg-white h-12 shadow-sm border-slate-200 hover:bg-white hover:border-blue-600 transition-all font-bold"
                  onClick={loginWithGoogle}
                  disabled={!online}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
                  Connect Firebase (Cloud Sync)
                </Button>
                <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-wider font-black">Highly Recommended for Cloud Backups</p>
              </div>
            )}

            {activeTab === "admin" ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <Label htmlFor="admin">Admin Access Code</Label>
                  <Input 
                    id="admin" 
                    type="password"
                    placeholder="Enter Access Code" 
                    value={adminCode} 
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="bg-white h-12 text-center text-lg tracking-[1em] font-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input 
                    id="adminName" 
                    placeholder="e.g. Principal Smith" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Select Class Level</Label>
                  <Select value={classLevel} onValueChange={setClassLevel}>
                    <SelectTrigger id="class" className="bg-white h-12">
                      <SelectValue placeholder="Choose your class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {classLevel === "SS 1" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label htmlFor="dept">Select Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="dept" className="bg-white h-12">
                        <SelectValue placeholder="Choose department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full text-lg h-14 font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20" onClick={handleComplete} disabled={loading}>
              {loading ? "Processing..." : (activeTab === "admin" ? "Unlock Admin Portal" : "Start Learning Journey")}
            </Button>
            
            <div className="flex gap-2 w-full mt-2">
               <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 text-slate-400 font-bold hover:text-blue-600"
                onClick={() => setActiveTab(activeTab === "admin" ? "student" : "admin")}
              >
                {activeTab === "admin" ? "Switch to Student" : "Switch to Admin"}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-slate-400 font-bold" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
