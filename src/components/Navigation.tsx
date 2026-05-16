/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/src/context/ProfileContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, BookOpen, LayoutDashboard, Settings, UserPlus, LogOut, ShieldCheck, Trophy } from "lucide-react";
import { toast } from "sonner";

export function Navbar() {
  const { profile, logout } = useProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast.success("Profile cleared successfully");
    } catch (error) {
      console.error("Session reset error", error);
    }
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
              Ark Academy CBT
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {profile ? (
              <>
                <Link to="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                {profile.isAdmin && (
                  <Link to="/admin" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="gap-2 text-blue-600">
                      <ShieldCheck className="w-4 h-4" />
                      Admin Records
                    </Button>
                  </Link>
                )}
                <Link to="/challenge" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2 text-amber-600">
                    <Trophy className="w-4 h-4" />
                    Challenge Mode
                  </Button>
                </Link>
                <Link to="/resources" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <BookOpen className="w-4 h-4" />
                    Resources
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="sm" className="gap-2 border-blue-100 bg-blue-50/50">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="max-w-[100px] truncate font-medium">{profile.name}</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs text-slate-400 font-bold uppercase">
                      Student Account
                    </div>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/challenge")} className="text-amber-600">
                      <Trophy className="w-4 h-4 mr-2" />
                      Challenge Mode
                    </DropdownMenuItem>
                    {profile.isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")} className="text-blue-600">
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/resources")}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Resources
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/onboarding")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </DropdownMenuItem>
                    <div className="h-px bg-slate-100 my-1" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Exit & Clear Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/onboarding")} className="gap-2 shadow-sm">
                <UserPlus className="w-4 h-4" />
                Create Student Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                A
              </div>
              <span className="font-bold text-lg text-slate-900">Ark Academy</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
              Empowering students through innovative computer-based testing and personalized learning.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Primary 3</li>
                <li>JSS 3</li>
                <li>SS 1</li>
                <li>JSSCE (WAEC)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Help</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Contact Support</li>
                <li>Teacher Portal</li>
                <li>Student Guide</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Ark Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
