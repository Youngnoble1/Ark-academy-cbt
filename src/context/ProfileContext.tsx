/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, Timestamp, getDocFromServer, deleteDoc } from "firebase/firestore";
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

export interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TheoryQuestion {
  text: string;
  idealAnswer: string;
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  topics: string[];
  questions: Question[];
  theoryQuestions?: TheoryQuestion[];
  timeLimit: number;
  createdAt: string;
  isGlobal?: boolean;
}

export interface QuizResult {
  id: string;
  userId: string;
  userName: string;
  quizTitle: string;
  subject: string;
  score: number;
  theoryScores?: { [index: number]: number };
  totalQuestions: number;
  totalTheoryQuestions?: number;
  maxScore: number;
  completedAt: Date;
  feedback: string;
  answers: any[];
  theoryAnswers?: string[];
}

interface ProfileContextType {
  profile: UserProfile | null;
  results: QuizResult[];
  quizzes: Quiz[];
  loading: boolean;
  online: boolean;
  checkConnection: () => Promise<void>;
  saveProfile: (p: Omit<UserProfile, "id" | "uid" | "createdAt">) => Promise<void>;
  addResult: (r: Omit<QuizResult, "id" | "userId" | "userName" | "completedAt">) => Promise<void>;
  saveQuiz: (q: Omit<Quiz, "id" | "createdAt">) => Promise<string>;
  deleteQuiz: (id: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Load profile from local storage first for instant feedback
    const localProfile = localStorage.getItem("ark_profile");
    const localResults = localStorage.getItem("ark_results");
    const localQuizzes = localStorage.getItem("ark_quizzes");
    
    if (localProfile) {
      setProfile(JSON.parse(localProfile));
    }
    if (localResults) {
      setResults(JSON.parse(localResults).map((r: any) => ({
        ...r,
        completedAt: new Date(r.completedAt)
      })));
    }
    if (localQuizzes) {
      setQuizzes(JSON.parse(localQuizzes));
    }

    async function testConnection() {
      try {
        console.log("Checking Firestore connection...");
        const connectDoc = doc(db, "_internal_", "connectivity");
        await getDocFromServer(connectDoc);
        setOnline(true);
      } catch (error: any) {
        console.warn("Initial connection failed:", error.message);
        if (error.message?.includes("offline") || error.message?.includes("reach")) {
          setOnline(false);
        }
      }
    }
    testConnection();

    // Browser online/offline detection
    const handleOnline = () => {
      setOnline(true);
      checkConnection(); // Verify depth of connection
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    async function fetchQuizzes() {
      try {
        const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedQuizzes = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Quiz[];
        setQuizzes(fetchedQuizzes);
        localStorage.setItem("ark_quizzes", JSON.stringify(fetchedQuizzes));
      } catch (e) {
        console.error("Error fetching quizzes", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Fetch profile from Firestore
          const profileDoc = await getDoc(doc(db, "users", user.uid));
          
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            const mergedProfile = { ...profileData, uid: user.uid };
            setProfile(mergedProfile);
            localStorage.setItem("ark_profile", JSON.stringify(mergedProfile));
            
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
            localStorage.setItem("ark_results", JSON.stringify(fetchedResults));
          } else {
            // User signed in but no cloud profile found. 
            // If we have a local profile, sync it to the cloud.
            const localProfileStr = localStorage.getItem("ark_profile");
            if (localProfileStr) {
               const localProfile = JSON.parse(localProfileStr);
               const newCloudProfile = { ...localProfile, uid: user.uid, id: user.uid };
               await setDoc(doc(db, "users", user.uid), newCloudProfile);
               setProfile(newCloudProfile);
               localStorage.setItem("ark_profile", JSON.stringify(newCloudProfile));
               toast.success("Profile synced to cloud!");
            }
          }
        }
        await fetchQuizzes();
      } catch (err: any) {
        console.error("Data fetch error", err);
        if (err.message?.includes("network")) {
          setOnline(false);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync mechanism for offline results
  useEffect(() => {
    if (online) {
      const syncQueueStr = localStorage.getItem("ark_sync_queue");
      if (syncQueueStr) {
        const syncQueue = JSON.parse(syncQueueStr);
        if (syncQueue.length > 0) {
          toast.promise(async () => {
            const remaining = [];
            for (const item of syncQueue) {
              try {
                // Ensure we convert back to Timestamp for Firebase
                const firebasePayload = {
                  ...item,
                  completedAt: Timestamp.fromDate(new Date(item.completedAt))
                };
                // Remove local-only ID if it was generated
                if (item.id && item.id.startsWith("temp-")) delete firebasePayload.id;

                await addDoc(collection(db, "results"), firebasePayload);
              } catch (err) {
                console.error("Failed to sync item", err);
                remaining.push(item);
              }
            }
            localStorage.setItem("ark_sync_queue", JSON.stringify(remaining));
            if (remaining.length > 0) throw new Error("Some items failed to sync");
          }, {
            loading: "Syncing offline results...",
            success: "All results synced to cloud!",
            error: "Connectivity issues - will try syncing again later."
          });
        }
      }
    }
  }, [online]);

  const checkConnection = async () => {
    try {
      const connectDoc = doc(db, "_internal_", "connectivity");
      await getDocFromServer(connectDoc);
      setOnline(true);
      toast.success("Connection re-established!");
    } catch (error: any) {
      console.warn("Connection retry failed:", error.message);
      if (error.message?.includes("offline") || error.message?.includes("reach")) {
        setOnline(false);
        toast.error("Still offline. Check your network or VPN.");
      } else {
        setOnline(true);
      }
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === 'auth/network-request-failed') {
        setOnline(false);
        toast.error("Network error: Please check your connection. If you are using a VPN or educational/corporate network, it may be blocking Google services.", {
          duration: 15000,
        });
      } else {
        toast.error("Failed to sign in with Google: " + (error.message || "Unknown error"));
      }
    }
  };

  const saveProfile = async (data: Omit<UserProfile, "id" | "uid" | "createdAt">) => {
    const uid = auth.currentUser?.uid || "local-user-" + uuidv4().slice(0, 8);
    const newProfile: UserProfile = {
      ...data,
      id: uid,
      uid: uid,
      createdAt: new Date().toISOString(),
    };
    
    setProfile(newProfile);
    localStorage.setItem("ark_profile", JSON.stringify(newProfile));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), newProfile);
      } catch (e) {
        console.error("Failed to save to cloud", e);
      }
    }
  };

  const saveQuiz = async (data: Omit<Quiz, "id" | "createdAt">) => {
    const newQuiz: Quiz = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    // Always save to local storage first
    const updatedQuizzes = [newQuiz, ...quizzes];
    setQuizzes(updatedQuizzes);
    localStorage.setItem("ark_quizzes", JSON.stringify(updatedQuizzes));
    
    try {
      const docRef = await addDoc(collection(db, "quizzes"), newQuiz);
      // Update with the firestore ID
      const quizWithId = { ...newQuiz, id: docRef.id };
      const finalizedQuizzes = [quizWithId, ...quizzes];
      setQuizzes(finalizedQuizzes);
      localStorage.setItem("ark_quizzes", JSON.stringify(finalizedQuizzes));
      return docRef.id;
    } catch (e) {
      console.error("Failed to save quiz to cloud, persisting locally", e);
      return newQuiz.id;
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      await deleteDoc(doc(db, "quizzes", id)); 
      setQuizzes(prev => prev.filter(q => q.id !== id));
      toast.success("Quiz deleted successfully");
    } catch (e) {
      console.error("Delete error", e);
      toast.error("Failed to delete quiz");
    }
  };

  const addResult = async (data: Omit<QuizResult, "id" | "userId" | "userName" | "completedAt">) => {
    const uid = auth.currentUser?.uid || (profile?.uid || "local-user");
    const completedAt = new Date();
    
    const resultToState: QuizResult = {
      ...data,
      id: "temp-" + uuidv4(),
      userId: uid,
      userName: profile?.name || "Student",
      completedAt,
    };
    
    // 1. Update local state and history immediately
    const updatedResults = [resultToState, ...results];
    setResults(updatedResults);
    localStorage.setItem("ark_results", JSON.stringify(updatedResults));

    // 2. Attempt cloud sync or queue for later
    if (auth.currentUser && online) {
      try {
        const firebaseResult = {
          ...data,
          userId: uid,
          userName: profile?.name || "Student",
          completedAt: Timestamp.fromDate(completedAt),
        };
        await addDoc(collection(db, "results"), firebaseResult);
      } catch (e) {
        console.warn("Failed to sync to cloud during attempt, queuing", e);
        bufferResultOffline(resultToState);
      }
    } else {
      // Either not signed in or explicitly offline
      if (auth.currentUser) {
        bufferResultOffline(resultToState);
      }
    }
  };

  const bufferResultOffline = (result: QuizResult) => {
    const queue = JSON.parse(localStorage.getItem("ark_sync_queue") || "[]");
    localStorage.setItem("ark_sync_queue", JSON.stringify([...queue, result]));
    toast.info("Result saved locally. Syncing occurs when back online.");
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("ark_profile");
    localStorage.removeItem("ark_results");
    setProfile(null);
    setResults([]);
  };

  return (
    <ProfileContext.Provider value={{ 
      profile, 
      results, 
      quizzes,
      loading, 
      online, 
      checkConnection, 
      saveProfile, 
      addResult, 
      saveQuiz,
      deleteQuiz,
      loginWithGoogle, 
      logout 
    }}>
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
