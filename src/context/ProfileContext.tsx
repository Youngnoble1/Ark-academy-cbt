/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  classLevel: string;
  department?: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface QuizResult {
  id: string;
  userId: string;
  userName: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  feedback: string;
  answers: any[];
}

interface ProfileContextType {
  profile: UserProfile | null;
  results: QuizResult[];
  loading: boolean;
  saveProfile: (p: Omit<UserProfile, "id" | "uid" | "createdAt">) => Promise<void>;
  addResult: (r: Omit<QuizResult, "id" | "userId" | "userName" | "completedAt">) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch profile from Firestore
        const profileDoc = await getDoc(doc(db, "users", user.uid));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data() as UserProfile;
          setProfile(profileData);
          
          // Fetch results from Firestore
          const resultsQuery = query(
            collection(db, "results"),
            where("userId", "==", user.uid),
            orderBy("completedAt", "desc")
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          const fetchedResults = resultsSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            completedAt: (doc.data().completedAt as Timestamp).toDate()
          })) as QuizResult[];
          setResults(fetchedResults);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
        setResults([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  const saveProfile = async (data: Omit<UserProfile, "id" | "uid" | "createdAt">) => {
    if (!auth.currentUser) {
      toast.error("Please sign in first");
      await loginWithGoogle();
      return;
    }
    
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const newProfile: UserProfile = {
        ...data,
        id: uid,
        uid: uid,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", uid), newProfile);
      setProfile(newProfile);
      localStorage.setItem("ark_profile", JSON.stringify(newProfile));
    }
  };

  const addResult = async (data: Omit<QuizResult, "id" | "userId" | "userName" | "completedAt">) => {
    if (!auth.currentUser || !profile) return;
    
    const uid = auth.currentUser.uid;
    const completedAt = new Date();
    
    const newResult = {
      ...data,
      userId: uid,
      userName: profile.name,
      completedAt: Timestamp.fromDate(completedAt),
    };
    
    const docRef = await addDoc(collection(db, "results"), newResult);
    
    const resultToState: QuizResult = {
      ...data,
      id: docRef.id,
      userId: uid,
      userName: profile.name,
      completedAt,
    };
    
    setResults(prev => [resultToState, ...prev]);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("ark_profile");
    localStorage.removeItem("ark_results");
    setProfile(null);
    setResults([]);
  };

  return (
    <ProfileContext.Provider value={{ profile, results, loading, saveProfile, addResult, loginWithGoogle, logout }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
