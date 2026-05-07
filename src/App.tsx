/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProfileProvider, useProfile } from "@/src/context/ProfileContext";
import LandingPage from "@/src/pages/LandingPage";
import Onboarding from "@/src/pages/Onboarding";
import Dashboard from "@/src/pages/Dashboard";
import QuizGenerator from "@/src/pages/QuizGenerator";
import QuizPlayer from "@/src/pages/QuizPlayer";
import ResourcePage from "@/src/pages/ResourcePage";
import AdminDashboard from "@/src/pages/AdminDashboard";
import { Navbar, Footer } from "@/src/components/Navigation";
import { Toaster } from "@/components/ui/sonner";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();
  
  if (loading) return null;
  
  // If no profile exists, and we aren't already on onboarding or landing, redirect
  if (!profile && window.location.pathname !== "/" && window.location.pathname !== "/onboarding") {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <MainLayout>
              <LandingPage />
            </MainLayout>
          } />
          
          <Route path="/onboarding" element={
            <Onboarding />
          } />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </PrivateRoute>
          } />

          <Route path="/quiz/new" element={
            <PrivateRoute>
              <MainLayout>
                <QuizGenerator />
              </MainLayout>
            </PrivateRoute>
          } />

          <Route path="/quiz/:id" element={
            <PrivateRoute>
              <QuizPlayer />
            </PrivateRoute>
          } />

          <Route path="/resources" element={
            <PrivateRoute>
              <MainLayout>
                <ResourcePage />
              </MainLayout>
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <PrivateRoute>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </PrivateRoute>
          } />
        </Routes>
        <Toaster />
      </Router>
    </ProfileProvider>
  );
}
