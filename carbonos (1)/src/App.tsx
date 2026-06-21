/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { CarbonProfile, DailyMission, Challenge, LeaderboardEntry, ChatMessage } from "./types";
import { DEFAULT_PROFILE, INITIAL_MISSIONS, CHALLENGES, LEADERBOARD } from "./data/carbonMockData";
import Onboarding from "./components/Onboarding";
import CarbonScoreRing from "./components/CarbonScoreRing";
import MissionsChallenges from "./components/MissionsChallenges";
import CarbonTimeMachine from "./components/CarbonTimeMachine";
import ReceiptScanner from "./components/ReceiptScanner";
import CarbonLens from "./components/CarbonLens";
import SustainabilityCoach from "./components/SustainabilityCoach";
import EcoSanctuary from "./components/EcoSanctuary";

// Import real Firebase Auth / Firestore helpers
import { auth, db, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, handleFirestoreError } from "./lib/firebase";
import { signInAnonymously, User as FirebaseUser } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

import { 
  Leaf, 
  Sprout,
  Sparkles, 
  RefreshCw, 
  Globe, 
  MapPin, 
  Eye, 
  FileText, 
  Cpu, 
  Bot, 
  Flame, 
  Compass, 
  ShieldCheck,
  CheckCircle2,
  Trash2,
  History,
  Activity,
  Award,
  ChevronRight,
  LogOut,
  User,
  PlusCircle,
  HelpCircle
} from "lucide-react";

type MobileTab = "home" | "log" | "sanctuary" | "ai";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem("carbonos_profile_local");
      if (stored) {
        return {
          uid: "local_guest_user",
          displayName: "Eco Guest",
          isAnonymous: true,
          email: "guest@carbonos.local"
        };
      }
    } catch (_) {}
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<CarbonProfile>(DEFAULT_PROFILE);
  const [missions, setMissions] = useState<DailyMission[]>(INITIAL_MISSIONS);
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(LEADERBOARD);
  const [userPoints, setUserPoints] = useState<number>(350); 
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [sanctuaryOffsetRate, setSanctuaryOffsetRate] = useState<number>(0);
  const [customLogs, setCustomLogs] = useState<any[]>([]);

  // Firestore snapshot listener unsubscribe triggers
  const activityLogsUnsubscribeRef = useRef<(() => void) | null>(null);
  const userMissionsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Action log state selectors
  const [logCategory, setLogCategory] = useState<"transport" | "food" | "housing" | "shopping">("transport");
  const [logValue, setLogValue] = useState<number>(5); // miles/servings/hours
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [coinEffect, setCoinEffect] = useState<boolean>(false);

  // 1a. Auth Sync on Mount (Subscribes exactly once)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // A Google profile is active. Remove local guest credentials so accounts never cross paths
        localStorage.removeItem("carbonos_profile_local");
        localStorage.removeItem("carbonos_logs_local");
        localStorage.removeItem("carbonos_missions_local");
        localStorage.removeItem("carbonos_claimed_missions_local");
        localStorage.removeItem("carbonos_sanctuary_items");
        localStorage.removeItem("carbonos_sanctuary_local_guest_user");

        setCurrentUser(user);
        await syncUserProfile(user);
      } else {
        // No Firebase user is authenticated. Let's see if we should fallback to Guest Mode.
        const storedProfileStr = localStorage.getItem("carbonos_profile_local");
        if (storedProfileStr) {
          const guestUser = {
            uid: "local_guest_user",
            displayName: "Eco Guest",
            isAnonymous: true,
            email: "guest@carbonos.local"
          };
          setCurrentUser(guestUser);
          await syncUserProfile(guestUser);
        } else {
          // No active local guest exists. Treat as completely logged out
          if (activityLogsUnsubscribeRef.current) {
            activityLogsUnsubscribeRef.current();
            activityLogsUnsubscribeRef.current = null;
          }
          if (userMissionsUnsubscribeRef.current) {
            userMissionsUnsubscribeRef.current();
            userMissionsUnsubscribeRef.current = null;
          }
          setCurrentUser(null);
          setProfile(DEFAULT_PROFILE);
          setUserPoints(350);
          setAuthLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 1b. Listen to local guest data propagation events
  useEffect(() => {
    const handleLocalUpdate = () => {
      if (currentUser?.uid === "local_guest_user") {
        syncUserProfile(currentUser);
      }
    };
    window.addEventListener("carbonos_local_update", handleLocalUpdate);

    return () => {
      window.removeEventListener("carbonos_local_update", handleLocalUpdate);
    };
  }, [currentUser]);

  // 2. Read & Initialize User Profile on Firestore or LocalStorage
  const syncUserProfile = async (user: any) => {
    try {
      if (user.uid === "local_guest_user") {
        const storedProfileStr = localStorage.getItem("carbonos_profile_local");
        if (storedProfileStr) {
          const stored = JSON.parse(storedProfileStr);
          setProfile(stored);
          setUserPoints(stored.xp !== undefined ? stored.xp : 355);
        } else {
          const initialLocalProfile = {
            ...DEFAULT_PROFILE,
            userId: "local_guest_user",
            name: "Eco Guest",
            onboarded: false
          };
          localStorage.setItem("carbonos_profile_local", JSON.stringify(initialLocalProfile));
          setProfile(initialLocalProfile);
          setUserPoints(355);
        }
        syncActivityLogs("local_guest_user");
        syncUserMissions("local_guest_user");
        setAuthLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setProfile({
          userId: user.uid,
          name: data.name || user.displayName || "Eco Champion",
          onboarded: data.onboarded !== undefined ? data.onboarded : false,
          metrics: data.metrics || DEFAULT_PROFILE.metrics,
          carbonScore: data.carbonScore !== undefined ? data.carbonScore : DEFAULT_PROFILE.carbonScore,
          weeklyProgress: data.weeklyProgress || DEFAULT_PROFILE.weeklyProgress,
          co2Breakdown: data.co2Breakdown || DEFAULT_PROFILE.co2Breakdown
        });
        setUserPoints(data.xp !== undefined ? data.xp : 350);
      } else {
        // Initial setup for new user
        const newProfile = {
          userId: user.uid,
          name: user.displayName || "Eco Champion",
          onboarded: false,
          metrics: DEFAULT_PROFILE.metrics,
          carbonScore: DEFAULT_PROFILE.carbonScore,
          weeklyProgress: DEFAULT_PROFILE.weeklyProgress,
          co2Breakdown: DEFAULT_PROFILE.co2Breakdown,
          xp: 350,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setProfile({
          ...DEFAULT_PROFILE,
          userId: user.uid,
          name: user.displayName || "Eco Champion",
          onboarded: false
        });
        setUserPoints(350);
      }

      // Sync activities
      syncActivityLogs(user.uid);
      // Sync completed/claimed mission states
      syncUserMissions(user.uid);

    } catch (e) {
      console.error("Firestore user sync error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Listen to activity logs on Firestore or LocalStorage
  const syncActivityLogs = (uid: string) => {
    if (activityLogsUnsubscribeRef.current) {
      activityLogsUnsubscribeRef.current();
      activityLogsUnsubscribeRef.current = null;
    }

    if (uid === "local_guest_user") {
      const storedLogsStr = localStorage.getItem("carbonos_logs_local");
      if (storedLogsStr) {
        setCustomLogs(JSON.parse(storedLogsStr));
      } else {
        setCustomLogs([]);
      }
      return;
    }

    const logsColRef = collection(db, "users", uid, "activity_logs");
    const q = query(logsColRef, orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const logsList: any[] = [];
      snapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      setCustomLogs(logsList);
    }, (error) => {
      console.warn("Soft handling: Listening activity logs failed or auth expired:", error);
    });

    activityLogsUnsubscribeRef.current = unsub;
  };

  // 4. Sync custom mission completions from Firestore or LocalStorage
  const syncUserMissions = (uid: string) => {
    if (userMissionsUnsubscribeRef.current) {
      userMissionsUnsubscribeRef.current();
      userMissionsUnsubscribeRef.current = null;
    }

    if (uid === "local_guest_user") {
      const storedMissionsStr = localStorage.getItem("carbonos_missions_local") || "[]";
      const completedList: string[] = JSON.parse(storedMissionsStr);
      const claimedMissionsStr = localStorage.getItem("carbonos_claimed_missions_local") || "[]";
      const claimedList: string[] = JSON.parse(claimedMissionsStr);

      setMissions((prev) => 
        prev.map((m) => ({
          ...m,
          completed: completedList.includes(m.id),
          claimed: claimedList.includes(m.id)
        }))
      );
      return;
    }

    const ref = collection(db, "users", uid, "user_missions");
    const unsub = onSnapshot(ref, (snap) => {
      const completedIds: string[] = [];
      const claimedIds: string[] = [];
      snap.forEach((doc) => {
        const item = doc.data();
        if (item.completed) completedIds.push(doc.id);
        if (item.claimed) claimedIds.push(doc.id);
      });

      setMissions((prev) => 
        prev.map((m) => ({
          ...m,
          completed: completedIds.includes(m.id),
          claimed: claimedIds.includes(m.id)
        }))
      );
    }, (error) => {
      console.warn("Soft handling: Listening user missions failed or auth expired:", error);
    });

    userMissionsUnsubscribeRef.current = unsub;
  };

  // 5. Traditional login handlers for seamless native-feel setup with fallback
  const loginAnonymously = async () => {
    setAuthLoading(true);
    setProfile(DEFAULT_PROFILE);
    setUserPoints(355);

    // Explicitly sign out of any background Google/Firebase session first so states never coincide
    try {
      await signOut(auth);
    } catch (_) {}

    // Complete clear of Guest localStorage keys so guest starts perfectly fresh with calibration
    localStorage.removeItem("carbonos_profile_local");
    localStorage.removeItem("carbonos_logs_local");
    localStorage.removeItem("carbonos_missions_local");
    localStorage.removeItem("carbonos_claimed_missions_local");
    localStorage.removeItem("carbonos_sanctuary_items");
    localStorage.removeItem("carbonos_sanctuary_local_guest_user");

    const localUser = {
      uid: "local_guest_user",
      displayName: "Eco Guest",
      isAnonymous: true,
      email: "guest@carbonos.local"
    };
    setCurrentUser(localUser);
    await syncUserProfile(localUser);
  };

  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setProfile(DEFAULT_PROFILE);
    setUserPoints(350);

    // Clean out any leftover or background sessions so they never clash
    try {
      await signOut(auth);
    } catch (_) {}

    const provider = new GoogleAuthProvider();
    // Enforce account selection prompt to let users choose which Google account to register/log in with
    provider.setCustomParameters({
      prompt: "select_account"
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google sync popup cancelled or failing:", e);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    // Unsubscribe from active listeners
    if (activityLogsUnsubscribeRef.current) {
      activityLogsUnsubscribeRef.current();
      activityLogsUnsubscribeRef.current = null;
    }
    if (userMissionsUnsubscribeRef.current) {
      userMissionsUnsubscribeRef.current();
      userMissionsUnsubscribeRef.current = null;
    }

    // Explicitly clear all Guest sandbox data so subsequent sessions trigger complete calibration
    localStorage.removeItem("carbonos_profile_local");
    localStorage.removeItem("carbonos_logs_local");
    localStorage.removeItem("carbonos_missions_local");
    localStorage.removeItem("carbonos_claimed_missions_local");
    localStorage.removeItem("carbonos_sanctuary_items");
    localStorage.removeItem("carbonos_sanctuary_local_guest_user");

    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out error:", e);
    }

    setCurrentUser(null);
    setProfile(DEFAULT_PROFILE);
    setUserPoints(350);
    setActiveTab("home");
  };

  // Save profile state to Firestore or LocalStorage
  const saveProfileToFirestore = async (newProfile: CarbonProfile, xpBalance?: number) => {
    if (!currentUser) return;
    const resolvedPointsObj = xpBalance !== undefined ? xpBalance : userPoints;

    // Guarantee the profile userId is always synchronized with the actual logged-in user's UID
    const profileToSave = {
      ...newProfile,
      userId: currentUser.uid
    };

    if (currentUser.uid === "local_guest_user") {
      const updatedLocal = {
        ...profileToSave,
        xp: resolvedPointsObj,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("carbonos_profile_local", JSON.stringify(updatedLocal));
      setProfile(profileToSave);
      return;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        userId: currentUser.uid,
        name: profileToSave.name,
        onboarded: profileToSave.onboarded,
        metrics: profileToSave.metrics,
        carbonScore: profileToSave.carbonScore,
        co2Breakdown: profileToSave.co2Breakdown,
        weeklyProgress: profileToSave.weeklyProgress,
        xp: resolvedPointsObj,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setProfile(profileToSave);
    } catch (e) {
      handleFirestoreError(e, "update" as any, `users/${currentUser.uid}`);
    }
  };

  const handleOnboardingComplete = async (newProfile: CarbonProfile) => {
    await saveProfileToFirestore(newProfile);
    setLeaderboard((prev) => 
      prev.map((l) => 
        l.name.includes("Champion") 
          ? { ...l, score: newProfile.carbonScore, co2Saved: Math.round(620 - (newProfile.co2Breakdown.transport + newProfile.co2Breakdown.food + newProfile.co2Breakdown.housing + newProfile.co2Breakdown.shopping)) } 
          : l
      )
    );
  };

  const handleRecalibrate = async () => {
    const cleared: CarbonProfile = {
      ...profile,
      onboarded: false
    };
    await saveProfileToFirestore(cleared);
  };

  // Complete & claim points in Firestore
  const handleCompleteMission = async (missionId: string) => {
    if (!currentUser) return;

    // Optimistically update local active state so that check ticks appear instantly
    setMissions((prev) => 
      prev.map((m) => m.id === missionId ? { ...m, completed: true } : m)
    );

    if (currentUser.uid === "local_guest_user") {
      const storedMissionsStr = localStorage.getItem("carbonos_missions_local") || "[]";
      const completedList: string[] = JSON.parse(storedMissionsStr);
      if (!completedList.includes(missionId)) {
        completedList.push(missionId);
      }
      localStorage.setItem("carbonos_missions_local", JSON.stringify(completedList));
      return;
    }

    try {
      const missionRef = doc(db, "users", currentUser.uid, "user_missions", missionId);
      await setDoc(missionRef, {
        id: missionId,
        userId: currentUser.uid,
        missionId,
        completed: true,
        claimed: false
      });
    } catch (e) {
      console.error("Mission complete write failed:", e);
      // Revert optimistic update on exception
      setMissions((prev) => 
        prev.map((m) => m.id === missionId ? { ...m, completed: false } : m)
      );
    }
  };

  const handleClaimPoints = async (missionId: string) => {
    if (!currentUser) return;
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.claimed) return;

    // Optimistically update local claimed state so that claim reward button registers instantly
    setMissions((prev) => 
      prev.map((m) => m.id === missionId ? { ...m, claimed: true } : m)
    );

    if (currentUser.uid === "local_guest_user") {
      const claimedMissionsStr = localStorage.getItem("carbonos_claimed_missions_local") || "[]";
      const claimedList: string[] = JSON.parse(claimedMissionsStr);
      if (!claimedList.includes(missionId)) {
        claimedList.push(missionId);
      }
      localStorage.setItem("carbonos_claimed_missions_local", JSON.stringify(claimedList));

      const pointsReward = mission.xpReward;
      const newPtsVal = userPoints + pointsReward;
      setUserPoints(newPtsVal);

      const carbonScoreBoost = Math.min(1000, profile.carbonScore + Math.round(mission.co2SavedValue * 2.5));
      const updatedProfile: CarbonProfile = {
        ...profile,
        carbonScore: carbonScoreBoost
      };
      await saveProfileToFirestore(updatedProfile, newPtsVal);

      // Local activity log
      const localLogsStr = localStorage.getItem("carbonos_logs_local") || "[]";
      const localLogs: any[] = JSON.parse(localLogsStr);
      localLogs.unshift({
        id: `local_log_${Date.now()}`,
        userId: "local_guest_user",
        category: mission.category,
        type: "Mission Reward",
        description: `Successfully accomplished daily task: "${mission.title}"`,
        co2Saved: mission.co2SavedValue,
        xpReward: mission.xpReward,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("carbonos_logs_local", JSON.stringify(localLogs));
      setCustomLogs(localLogs);
      return;
    }

    try {
      const missionRef = doc(db, "users", currentUser.uid, "user_missions", missionId);
      // Use setDoc with merge: true so it never throws "Document not found"
      await setDoc(missionRef, { completed: true, claimed: true }, { merge: true });

      const pointsReward = mission.xpReward;
      const newPtsVal = userPoints + pointsReward;
      setUserPoints(newPtsVal);

      // Boost Carbon Score (eco-behavioral response)
      const carbonScoreBoost = Math.min(1000, profile.carbonScore + Math.round(mission.co2SavedValue * 2.5));
      const updatedProfile: CarbonProfile = {
        ...profile,
        carbonScore: carbonScoreBoost
      };
      await saveProfileToFirestore(updatedProfile, newPtsVal);

      // Save claim in ledger event logs
      const logRef = doc(collection(db, "users", currentUser.uid, "activity_logs"));
      await setDoc(logRef, {
        id: logRef.id,
        userId: currentUser.uid,
        category: mission.category,
        type: "Mission Reward",
        description: `Successfully accomplished daily task: "${mission.title}"`,
        co2Saved: mission.co2SavedValue,
        xpReward: mission.xpReward,
        createdAt: new Date().toISOString()
      });

    } catch (e) {
      console.error("Claiming mission reward failing:", e);
      // Revert optimistic update on exception
      setMissions((prev) => 
        prev.map((m) => m.id === missionId ? { ...m, claimed: false } : m)
      );
    }
  };

  const handleJoinChallenge = (challengeId: string) => {
    setChallenges((prev) => 
      prev.map((c) => c.id === challengeId ? { ...c, isJoined: true, participants: c.participants + 1 } : c)
    );
  };

  const handleSpendPoints = async (cost: number, rewardId: string) => {
    if (!currentUser) return;
    const finalPoints = Math.max(0, userPoints - cost);
    setUserPoints(finalPoints);

    if (currentUser.uid === "local_guest_user") {
      const storedProfileStr = localStorage.getItem("carbonos_profile_local");
      if (storedProfileStr) {
        const stored = JSON.parse(storedProfileStr);
        stored.xp = finalPoints;
        localStorage.setItem("carbonos_profile_local", JSON.stringify(stored));
      }
      return;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.uid), { xp: finalPoints });
    } catch (e) {
      console.error("Spend points firestore update fail:", e);
    }
  };

  // --- NEW LIFE SOLVING REAL FEATURE: CUSTOM HABIT ACTIONS CALCULATOR LOGGER ---
  const handleLogCustomAction = async () => {
    if (!currentUser) return;
    setIsLogging(true);

    // Calculate dynamic CO2 saved & XP awarded depending on selected sliders
    let savingsCo2 = 0;
    let descriptionText = "";
    let xpAward = 50;

    if (logCategory === "transport") {
      savingsCo2 = parseFloat((logValue * 0.354).toFixed(1)); // 0.354 kg saved per mile bike vs average car
      descriptionText = `Bcycled/walked ${logValue} miles or took transit instead of driving a single gasoline combustion engine.`;
      xpAward = Math.round(logValue * 15);
    } else if (logCategory === "food") {
      savingsCo2 = parseFloat((logValue * 2.2).toFixed(1)); // 2.2 kg saved per serving of vegan food replacing meat
      descriptionText = `Ate ${logValue} plant-based vegan servings, bypassing dense industrial livestock equivalents.`;
      xpAward = Math.round(logValue * 25);
    } else if (logCategory === "housing") {
      savingsCo2 = parseFloat((logValue * 0.45).toFixed(1)); // 0.45 kg saved per cooling hour adjusted
      descriptionText = `Turned off high voltage standby power sources or optimized residential temperature for ${logValue} active hours.`;
      xpAward = Math.round(logValue * 10);
    } else if (logCategory === "shopping") {
      savingsCo2 = parseFloat((logValue * 4.5).toFixed(1)); // 4.5 kg saved per secondhand item
      descriptionText = `Purchased ${logValue} pre-owned, thrifted, or locally manufactured essentials instead of standard fast shipping.`;
      xpAward = Math.round(logValue * 35);
    }

    if (currentUser.uid === "local_guest_user") {
      try {
        const localLogsStr = localStorage.getItem("carbonos_logs_local") || "[]";
        const localLogs: any[] = JSON.parse(localLogsStr);
        const newLog = {
          id: `local_log_${Date.now()}`,
          userId: "local_guest_user",
          category: logCategory,
          type: "Manual Log",
          description: descriptionText,
          co2Saved: savingsCo2,
          xpReward: xpAward,
          createdAt: new Date().toISOString()
        };
        localLogs.unshift(newLog);
        localStorage.setItem("carbonos_logs_local", JSON.stringify(localLogs));
        setCustomLogs(localLogs);

        const addedXp = userPoints + xpAward;
        setUserPoints(addedXp);

        const updatedScore = Math.min(1000, profile.carbonScore + Math.round(savingsCo2 * 2.5));
        const updatedWeekly = [...profile.weeklyProgress];
        if (updatedWeekly.length > 0) {
          const lastIndex = updatedWeekly.length - 1;
          updatedWeekly[lastIndex] = {
            ...updatedWeekly[lastIndex],
            co2: Math.max(10, updatedWeekly[lastIndex].co2 - savingsCo2),
            score: updatedScore
          };
        }

        const updatedProfile: CarbonProfile = {
          ...profile,
          carbonScore: updatedScore,
          weeklyProgress: updatedWeekly
        };

        await saveProfileToFirestore(updatedProfile, addedXp);

        setCoinEffect(true);
        setTimeout(() => setCoinEffect(false), 2000);
      } catch (e) {
        console.error("Local custom action log fail:", e);
      } finally {
        setIsLogging(false);
      }
      return;
    }

    try {
      const logRef = doc(collection(db, "users", currentUser.uid, "activity_logs"));
      await setDoc(logRef, {
        id: logRef.id,
        userId: currentUser.uid,
        category: logCategory,
        type: `Manual Log`,
        description: descriptionText,
        co2Saved: savingsCo2,
        xpReward: xpAward,
        createdAt: new Date().toISOString()
      });

      // Award XP
      const addedXp = userPoints + xpAward;
      setUserPoints(addedXp);

      // Increment Carbon Score
      const updatedScore = Math.min(1000, profile.carbonScore + Math.round(savingsCo2 * 2.5));

      // Re-structure weekly progress to reflect physical improvement
      const updatedWeekly = [...profile.weeklyProgress];
      if (updatedWeekly.length > 0) {
        const lastIndex = updatedWeekly.length - 1;
        updatedWeekly[lastIndex] = {
          ...updatedWeekly[lastIndex],
          co2: Math.max(10, updatedWeekly[lastIndex].co2 - savingsCo2),
          score: updatedScore
        };
      }

      const updatedProfile: CarbonProfile = {
        ...profile,
        carbonScore: updatedScore,
        weeklyProgress: updatedWeekly
      };

      await saveProfileToFirestore(updatedProfile, addedXp);

      // Trigger coin effect
      setCoinEffect(true);
      setTimeout(() => setCoinEffect(false), 2000);

    } catch (e) {
      console.error("Firestore logging error:", e);
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeletedLog = async (logId: string) => {
    if (!currentUser) return;
    if (currentUser.uid === "local_guest_user") {
      const localLogsStr = localStorage.getItem("carbonos_logs_local") || "[]";
      const localLogs: any[] = JSON.parse(localLogsStr);
      const filtered = localLogs.filter((l) => l.id !== logId);
      localStorage.setItem("carbonos_logs_local", JSON.stringify(filtered));
      setCustomLogs(filtered);
      return;
    }

    try {
      const logRef = doc(db, "users", currentUser.uid, "activity_logs", logId);
      await deleteDoc(logRef);
    } catch (e) {
      console.error("Failed to delete log entry:", e);
    }
  };

  // --- RENDERING VIEWS ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="relative flex justify-center">
            <span className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 animate-spin">
              <Leaf className="h-7 w-7" />
            </span>
          </div>
          <p className="text-sm font-mono font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing carbonOS...</p>
        </div>
      </div>
    );
  }

  // Welcome Screen (Authentication Prompt)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center py-12 px-4 select-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[100px] pointer-events-none opacity-60" />
        <div className="absolute -bottom-40 right-0 w-[400px] h-[400px] bg-teal-100 rounded-full blur-[100px] pointer-events-none opacity-60 animate-glow-slow" />

        <div className="w-full max-w-[420px] bg-white rounded-[32px] mobile-shadow p-8 flex flex-col justify-between items-center text-center space-y-8 relative z-10 border border-slate-100">
          <div className="space-y-4">
            <div className="flex justify-center">
              <span className="h-16 w-16 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center hover:rotate-12 transition-all">
                <Leaf className="h-8 w-8 text-emerald-500" />
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">carbonOS</h1>
              <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider font-bold">Behavioral Emission Ledger</p>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-sans font-medium px-4">
              Connect to our dynamic cloud database to log, calculate, and neutralize daily environmental footprints.
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <button
              onClick={loginAnonymously}
              className="w-full py-3.5 bg-slate-900 text-white hover:bg-slate-800 text-sm font-extrabold rounded-2xl transition-all cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Frictionless Guest Entry
            </button>
            
            <button
              onClick={loginWithGoogle}
              className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-extrabold rounded-2xl transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.52 4.114-5.127 4.114-3.524 0-6.38-2.856-6.38-6.38s2.856-6.38 6.38-6.38c1.648 0 3.136.622 4.27 1.648l3.053-3.053C19.227 2.477 15.938 1.2 12.24 1.2 6.13 1.2 1.2 6.13 1.2 12.24s4.93 11.04 11.04 11.04c6.38 0 11.04-4.5 11.04-11.04 0-.741-.093-1.44-.257-1.955H12.24z"/></svg>
              Sync with Google Profile
            </button>
          </div>

          <span className="text-[10px] text-slate-400 font-mono font-medium">Decoupled Sandbox Interface // secure Firestore Isolation</span>
        </div>
      </div>
    );
  }

  // Questionnaire / Onboarding state
  if (!profile.onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col relative overflow-x-hidden font-sans">
      
      {/* Background Soft Gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] bg-teal-100 rounded-full blur-[120px] opacity-40 pointer-events-none" />

      {/* Responsive Widescreen Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 select-none">
            <span className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-emerald-500 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">carbonOS</h1>
              <p className="text-slate-400 font-mono text-[9px] uppercase tracking-wider font-extrabold">Behavioral Emission Ledger</p>
            </div>
          </div>

          {/* Navigation tabs in header (beautiful full web tabs) */}
          <nav className="flex space-x-1 bg-slate-100 px-1 py-1 rounded-xl">
            {[
              { id: "home", label: "My Carbon Twin", icon: User },
              { id: "log", label: "Daily Log", icon: Flame },
              { id: "sanctuary", label: "Eco Sanctuary", icon: Sprout },
              { id: "ai", label: "AI Climate Lab", icon: Cpu }
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MobileTab)}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isTabActive
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls / Profile Section */}
          <div className="flex items-center space-x-3.5">
            <div className="hidden md:flex flex-col items-end text-right font-sans">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                {profile.name}
                {currentUser?.isAnonymous && (
                  <span className="text-[8px] bg-slate-100 text-slate-500 border border-slate-200 px-1 rounded uppercase tracking-wider font-extrabold">Guest</span>
                )}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">ID: {currentUser?.uid.slice(0, 8)}...</span>
            </div>
            
            <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <User className="h-4.5 w-4.5 text-emerald-600" />
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-rose-50/50 text-slate-400 hover:text-rose-550 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main viewport */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Dynamic Micro-Coin coin drop animation frame */}
        {coinEffect && (
          <div className="fixed inset-0 bg-emerald-500/10 z-50 pointer-events-none flex items-center justify-center animate-fade-in">
            <div className="text-center space-y-2 transform -translate-y-12 animate-bounce">
              <span className="text-7xl text-amber-500 animate-pulse drop-shadow-md">🪙</span>
              <h3 className="text-emerald-700 text-lg font-black font-sans uppercase bg-white border border-emerald-100 shadow-xl px-5 py-2 rounded-full">
                Ledger Updated! +XP
              </h3>
            </div>
          </div>
        )}

        {/* SCREEN 1: PORTFOLIO OVERVIEW */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Profile Card & Carbon Score Gauge Column */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Profile Widget */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                        {profile.name}
                        {currentUser?.isAnonymous && (
                          <span className="text-[7px] bg-slate-100 text-slate-500 border border-slate-200 px-1 rounded uppercase tracking-wider font-bold">Guest</span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {currentUser?.uid.slice(0, 16)}...</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-450">LEDGER LEVEL</span>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Level {Math.floor(userPoints / 1000) + 1} ({userPoints} XP)
                    </span>
                  </div>
                </div>

                {/* Carbon Score Gauge */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <CarbonScoreRing profile={profile} sanctuaryOffsetDaily={sanctuaryOffsetRate} />
                </div>

                {/* Calibration resets */}
                <button
                  id="reset_onboarding_btn"
                  onClick={handleRecalibrate}
                  className="w-full py-3.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-mono font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-xs"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recalibrate Carbon Twin
                </button>
              </div>

              {/* Dynamic Action logs ledger feed */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
                  <h4 className="text-sm font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-2">
                    <History className="h-5 w-5 text-emerald-500" />
                    Verified Habits Ledger
                  </h4>
                  <span className="font-mono text-xs uppercase font-extrabold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {customLogs.length} events
                  </span>
                </div>

                {customLogs.length === 0 ? (
                  <div className="text-center py-24 text-slate-400 space-y-3 flex-grow flex flex-col justify-center items-center">
                    <HelpCircle className="h-10 w-10 stroke-slate-300" />
                    <p className="text-sm font-bold">No entries logged yet!</p>
                    <p className="text-xs max-w-sm">Head over to the <strong className="text-emerald-500 font-bold">⚡ Daily Log</strong> tab to input carbon footprint offsets.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1 flex-grow">
                    {customLogs.map((log) => {
                      const categoryColors: Record<string, string> = {
                        transport: "bg-amber-100 text-amber-800 border-amber-200/50",
                        food: "bg-emerald-100 text-emerald-800 border-emerald-200/50",
                        housing: "bg-cyan-100 text-cyan-800 border-cyan-200/50",
                        shopping: "bg-indigo-100 text-indigo-800 border-indigo-200/50"
                      };
                      return (
                        <div key={log.id} className="p-4 bg-slate-50/60 hover:bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs transition-all animate-fade-in group">
                          <div className="space-y-1 flex-grow pr-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-mono font-bold border ${categoryColors[log.category] || "bg-slate-100"}`}>
                                {log.category}
                              </span>
                              <span className="text-slate-400 font-mono text-[9px]">{new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[12px] text-slate-600 font-medium font-sans leading-relaxed">{log.description}</p>
                          </div>
                          
                          <div className="text-right flex-shrink-0 flex items-center gap-4">
                            <span className="text-emerald-600 font-mono font-bold text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                              -{log.co2Saved} kg
                            </span>
                            <button 
                              onClick={() => handleDeletedLog(log.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SCREEN 2: INTERACTIVE DYNAMIC HABIT LOGGER */}
        {activeTab === "log" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Tracker Form Column */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Track Daily Milestones</h3>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Log Real-Life Actions & Offset Carbon</p>
                </div>

                {/* Categories blocks */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "transport", label: "Commute", icon: "🚲", color: "border-amber-200 bg-amber-50 text-amber-800" },
                    { id: "food", label: "Vegan Meal", icon: "🥦", color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
                    { id: "housing", label: "Power Cut", icon: "🔌", color: "border-cyan-200 bg-cyan-50 text-cyan-800" },
                    { id: "shopping", label: "Thrifting", icon: "🛍️", color: "border-indigo-200 bg-indigo-50 text-indigo-800" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setLogCategory(cat.id as any);
                        setLogValue(cat.id === "transport" ? 5 : cat.id === "food" ? 1 : cat.id === "housing" ? 4 : 1);
                      }}
                      className={`p-3.5 rounded-xl text-left border flex flex-col items-start gap-1 justify-between transition-all cursor-pointer ${
                        logCategory === cat.id 
                          ? `${cat.color} ring-2 ring-emerald-500 scale-102 font-bold`
                          : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sub Sliding Calculators */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4">
                  {logCategory === "transport" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="text-slate-500 uppercase font-bold">BIKE OR TRANSIT (MILES)</span>
                        <span className="text-emerald-600 font-extrabold">{logValue} mi</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        step="1"
                        value={logValue}
                        onChange={(e) => setLogValue(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-450 pt-1">
                        <span>Save: <strong className="text-emerald-600 font-bold">{(logValue * 0.354).toFixed(1)} kg CO₂</strong></span>
                        <span>Gain: <strong className="text-amber-600 font-bold">+{logValue * 15} PTS</strong></span>
                      </div>
                    </div>
                  )}

                  {logCategory === "food" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="text-slate-500 uppercase font-bold">VEGAN MEALS (SERVINGS)</span>
                        <span className="text-emerald-600 font-extrabold">{logValue} serving(s)</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={logValue}
                        onChange={(e) => setLogValue(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-450 pt-1">
                        <span>Save: <strong className="text-emerald-600 font-bold">{(logValue * 2.2).toFixed(1)} kg CO₂</strong></span>
                        <span>Gain: <strong className="text-amber-600 font-bold">+{logValue * 25} PTS</strong></span>
                      </div>
                    </div>
                  )}

                  {logCategory === "housing" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="text-slate-500 uppercase font-bold">VAMPIRE APPLIANCES UNPLUGGED (HOURS)</span>
                        <span className="text-emerald-600 font-extrabold">{logValue} hrs</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="24" 
                        step="1"
                        value={logValue}
                        onChange={(e) => setLogValue(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-450 pt-1">
                        <span>Save: <strong className="text-emerald-600 font-bold">{(logValue * 0.45).toFixed(1)} kg CO₂</strong></span>
                        <span>Gain: <strong className="text-amber-600 font-bold">+{logValue * 10} PTS</strong></span>
                      </div>
                    </div>
                  )}

                  {logCategory === "shopping" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="text-slate-500 uppercase font-bold">THRIFTED ITEMS (UNITS)</span>
                        <span className="text-emerald-600 font-extrabold">{logValue} item(s)</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        step="1"
                        value={logValue}
                        onChange={(e) => setLogValue(Number(e.target.value))}
                        className="w-full accent-emerald-555 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-450 pt-1">
                        <span>Save: <strong className="text-emerald-600 font-bold">{(logValue * 4.5).toFixed(1)} kg CO₂</strong></span>
                        <span>Gain: <strong className="text-amber-600 font-bold">+{logValue * 35} PTS</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogCustomAction}
                  disabled={isLogging}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold rounded-xl shadow-sm text-sm active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  {isLogging ? "Logging action to database..." : "Log and Accumulate Points"}
                </button>
              </div>

              {/* Missions and Challenges Column */}
              <div className="lg:col-span-7">
                <MissionsChallenges 
                  missions={missions}
                  challenges={challenges}
                  leaderboards={leaderboard}
                  points={userPoints}
                  onCompleteMission={handleCompleteMission}
                  onClaimPoints={handleClaimPoints}
                  onJoinChallenge={handleJoinChallenge}
                />
              </div>

            </div>
          </div>
        )}

        {/* SCREEN 3: ECO SANCTUARY & CONSERVATORY SINK */}
        {activeTab === "sanctuary" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Eco Sanctuary</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Invest your earned ledger XP values in verified nature-based carbon sequestration seeds or smart technological adsorbing pods. Nurture their growth to accelerate visual biological carbon capturing in real-time.
              </p>
            </div>

            <EcoSanctuary 
              profile={profile} 
              userPoints={userPoints} 
              onSpendPoints={handleSpendPoints} 
              onEarnPoints={async (amount, reason) => {
                const finalPoints = userPoints + amount;
                setUserPoints(finalPoints);
                if (currentUser && currentUser.uid !== "local_guest_user") {
                  try {
                    await updateDoc(doc(db, "users", currentUser.uid), { xp: finalPoints });
                  } catch (e) {
                    console.error("Earn points sanctuary update fail:", e);
                  }
                } else {
                  const storedProfileStr = localStorage.getItem("carbonos_profile_local");
                  if (storedProfileStr) {
                    const stored = JSON.parse(storedProfileStr);
                    stored.xp = finalPoints;
                    localStorage.setItem("carbonos_profile_local", JSON.stringify(stored));
                  }
                }
              }}
              onUpdateOffsetRate={(rateDaily) => setSanctuaryOffsetRate(rateDaily)}
            />
          </div>
        )}

        {/* SCREEN 4: AI CLIMATE LAB PORTAL */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header Navigation for AI Modes */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Cpu className="text-emerald-450 h-5 w-5 animate-pulse" />
                  carbonOS AI Studio
                </h3>
                <p className="text-[10px] text-emerald-200 font-mono uppercase font-black tracking-wider">GEMINI COGNITIVE LOG & COMPUTER VISION ENGINE</p>
              </div>
              <span className="text-[9px] px-3 py-1 bg-slate-800 border border-slate-700 font-mono rounded text-slate-300">Grounding Compliant / 1.5 Flash</span>
            </div>

            {/* AI Lab Sub-Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Sustainability Coach, Time Machine) */}
              <div className="xl:col-span-7 space-y-6">
                <SustainabilityCoach profile={profile} />
                <CarbonTimeMachine profile={profile} />
              </div>

              {/* Right Column (Vision Scanner, Carbon Lens) */}
              <div className="xl:col-span-5 space-y-6">
                <ReceiptScanner />
                <CarbonLens />
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Decorative Widescreen Footer */}
      <footer className="bg-white border-t border-slate-200/60 mt-16 py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-slate-450">
          <div className="flex items-center gap-1.5 justify-center md:justify-start">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>FORTRESS SECURITY LOCK</span>
            <span>•</span>
            <span>FIRESTORE CLOUD INTEGRATION ACTIVE</span>
            <span>•</span>
            <span>GEMINI GROUNDED</span>
          </div>
          <p className="normal-case text-slate-400 font-sans text-center md:text-right">Real-time individual ledger tracking compliant with IPCC greenhouse gas protocols.</p>
        </div>
      </footer>
      
    </div>
  );
}
