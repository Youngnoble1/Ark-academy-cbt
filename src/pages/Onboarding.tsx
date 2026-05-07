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
import { useNavigate } from "react-router-dom";
import { CLASSES, DEPARTMENTS } from "@/src/constants";
import { toast } from "sonner";
import { motion } from "motion/react";
import { auth } from "../lib/firebase";

export default function Onboarding() {
  const { profile, saveProfile, loginWithGoogle } = useProfile();
  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentUser = auth.currentUser;

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
    if (!classLevel) {
      toast.error("Please select your class level");
      return;
    }
    if (classLevel === "SS 1" && !department) {
      toast.error("Please select your department");
      return;
    }

    setLoading(true);
    try {
      if (!auth.currentUser) {
        toast.info("Signing you in first...");
        await loginWithGoogle();
        // The effect of login will re-check profile, or user can click again
        setLoading(false);
        return;
      }

      const isAdmin = adminCode.trim().toUpperCase() === "ARK-ADMIN";
      
      await saveProfile({
        name: name.trim(),
        classLevel,
        department: classLevel === "SS 1" ? department : (classLevel === "JSSCE (WAEC)" ? "General" : undefined),
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
            <CardTitle className="text-2xl font-bold text-slate-900">
              {profile ? "Edit Your Profile" : "Create Student Profile"}
            </CardTitle>
            <CardDescription>
              {profile 
                ? "Update your details below." 
                : "Enter your details to start your learning journey at Ark Academy."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!currentUser && (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center space-y-4">
                <p className="text-sm font-medium text-blue-700">Connect your Google account to sync your progress across devices and enable cloud storage.</p>
                <Button 
                  variant="outline" 
                  className="w-full bg-white border-blue-200 hover:bg-blue-50 text-blue-700 font-bold h-12 rounded-xl"
                  onClick={loginWithGoogle}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
                  Sign in with Google
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Select Class Level</Label>
              <Select value={classLevel} onValueChange={setClassLevel}>
                <SelectTrigger id="class" className="bg-white">
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

            <div className="space-y-2 pt-2 border-t border-slate-100">
               <Label htmlFor="admin" className="text-slate-400 text-xs font-bold uppercase tracking-widest">Teacher? Enter Admin Code</Label>
               <Input 
                 id="admin" 
                 type="password"
                 placeholder="Admin access code" 
                 value={adminCode} 
                 onChange={(e) => setAdminCode(e.target.value)}
                 className="bg-white border-dashed"
               />
            </div>

            {classLevel === "SS 1" && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label htmlFor="dept">Select Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="dept" className="bg-white">
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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full text-lg h-12" onClick={handleComplete} disabled={loading}>
              {loading ? "Saving..." : (profile ? "Update Profile" : "Start Learning")}
            </Button>
            {profile && (
              <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
