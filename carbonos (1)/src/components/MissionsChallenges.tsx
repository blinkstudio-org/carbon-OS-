/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { DailyMission, Challenge, LeaderboardEntry } from "../types";
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Flame, 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  Plus
} from "lucide-react";

interface MissionsChallengesProps {
  missions: DailyMission[];
  challenges: Challenge[];
  leaderboards: LeaderboardEntry[];
  points: number;
  onCompleteMission: (missionId: string) => void;
  onClaimPoints: (missionId: string) => void;
  onJoinChallenge: (challengeId: string) => void;
}

type TabType = "missions" | "challenges" | "leaderboards";

export default function MissionsChallenges({
  missions,
  challenges,
  leaderboards,
  points,
  onCompleteMission,
  onClaimPoints,
  onJoinChallenge
}: MissionsChallengesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("missions");
  const [subLeaderboard, setSubLeaderboard] = useState<"individual" | "campus" | "city">("individual");

  const filteredLeaderboard = leaderboards.filter(entry => entry.category === subLeaderboard);

  return (
    <div id="missions_dashboard_wrapper" className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm relative overflow-hidden flex flex-col h-[525px]">
      
      {/* Tab Navigation header */}
      <div className="flex border-b border-slate-100 pb-3 items-center justify-between">
        <div className="flex items-center space-x-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
          {[
            { id: "missions", label: "Missions" },
            { id: "challenges", label: "Challenges" },
            { id: "leaderboards", label: "Rankings" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-mono tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-emerald-600 font-bold border border-slate-200/50 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global XP Points Display */}
        <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold">
          <Flame className="h-4.5 w-4.5 animate-pulse" />
          <span>{points.toLocaleString()} PTS</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-grow overflow-y-auto pr-1 pt-3 space-y-3">
        
        {/* TAB 1: MISSIONS */}
        {activeTab === "missions" && (
          <div className="space-y-3">
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">DAILY ACTIONS // SUSTAINABLE HABITS</p>
            {missions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-semibold">All daily missions finished!</p>
                <p className="text-xs text-slate-400">Check back tomorrow for fresh offsets.</p>
              </div>
            ) : (
              missions.map((mission) => {
                let categoryColor = "text-amber-600 bg-amber-50 border-amber-100";
                if (mission.category === "food") categoryColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                if (mission.category === "housing") categoryColor = "text-cyan-600 bg-cyan-50 border-cyan-100";
                if (mission.category === "shopping") categoryColor = "text-indigo-600 bg-indigo-50 border-indigo-100";

                return (
                   <div 
                     key={mission.id}
                     className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                       mission.completed 
                         ? "bg-slate-50 border-slate-100 opacity-60" 
                         : "bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                     }`}
                   >
                     {/* Checkbox Trigger */}
                     <button 
                       onClick={() => !mission.completed && onCompleteMission(mission.id)}
                       disabled={mission.completed}
                       className="mt-0.5 focus:outline-none flex-shrink-0 cursor-pointer text-slate-400 hover:text-emerald-500 transition-colors"
                     >
                       {mission.completed ? (
                         <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                       ) : (
                         <Circle className="h-5 w-5 text-slate-300 hover:scale-110 active:scale-95 transition-transform" />
                       )}
                     </button>

                     {/* Mission Details */}
                     <div className="flex-grow space-y-1">
                       <div className="flex items-center gap-2">
                         <h4 className={`text-xs font-bold text-slate-800 transition-all ${mission.completed ? "line-through text-slate-400" : ""}`}>
                           {mission.title}
                         </h4>
                         <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono tracking-wider border font-bold ${categoryColor}`}>
                           {mission.category}
                         </span>
                       </div>
                       <p className="text-[11px] text-slate-550 leading-relaxed font-sans">{mission.description}</p>
                       
                       {/* Reward Footer */}
                       <div className="flex items-center gap-3 pt-1 text-[9px] font-mono">
                         <span className="text-emerald-600 font-bold">-{mission.co2SavedValue} kg CO₂</span>
                         <span className="text-slate-300">•</span>
                         <span className="text-amber-600 font-bold flex items-center gap-0.5">
                           <Sparkles className="h-3 w-3" />
                           {mission.xpReward} PTS
                         </span>

                         {mission.completed && !mission.claimed && (
                           <button 
                             onClick={() => onClaimPoints(mission.id)}
                             className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-sans text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                           >
                             Claim Rewards
                           </button>
                         )}

                         {mission.claimed && (
                           <span className="ml-auto font-sans text-[9px] uppercase font-bold text-emerald-650 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Claimed</span>
                         )}
                       </div>
                     </div>
                   </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CHALLENGES */}
        {activeTab === "challenges" && (
          <div className="space-y-3">
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">COMMUNITY CLIMATE EXPERIMENTS</p>
            {challenges.map((challenge) => {
              const progressPct = Math.min(100, Math.round((challenge.current / challenge.target) * 100));
              return (
                <div 
                  key={challenge.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 tracking-tight">{challenge.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{challenge.description}</p>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-mono uppercase font-bold">{challenge.type}</span>
                  </div>

                  {/* Progress info */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-555">
                      <span>Progress: <strong className="text-slate-700">{challenge.current} / {challenge.target} {challenge.unit}</strong></span>
                      <span>{progressPct}% Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  {/* Bottom details & join control */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="flex items-center gap-0.5"><Users className="h-3 w-3 text-slate-400" /> {challenge.participants}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-slate-500 font-semibold"><Calendar className="h-3 w-3" /> {challenge.daysRemaining} days remaining</span>
                    </div>

                    {challenge.isJoined ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-sans font-bold">Active Participant</span>
                    ) : (
                      <button 
                        onClick={() => onJoinChallenge(challenge.id)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-650 hover:text-emerald-700 border border-emerald-100 font-sans text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" />
                        Join Sprints
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: LEADERBOARDS */}
        {activeTab === "leaderboards" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-0.5 rounded-xl">
              {[
                { id: "individual", label: "Friends" },
                { id: "campus", label: "Local Campus" },
                { id: "city", label: "Metro Area" }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSubLeaderboard(sub.id as "individual" | "campus" | "city")}
                  className={`flex-grow px-2 py-1.5 text-[10px] font-bold rounded-lg font-mono transition-all text-center cursor-pointer ${
                    subLeaderboard === sub.id
                      ? "bg-white text-slate-800 shadow-xs border border-slate-200/30"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              {filteredLeaderboard.map((user, index) => {
                const isUserHimself = user.name.includes("Champion") || user.id === "user_carbon_os_001";
                return (
                  <div 
                    key={user.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isUserHimself 
                        ? "bg-emerald-50/50 border-emerald-200/50" 
                        : "bg-slate-50/30 border-transparent hover:border-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Rank Indicator */}
                      <span className={`w-5 text-center font-mono text-xs font-bold ${
                        index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-amber-700" : "text-slate-400"
                      }`}>
                        #{index + 1}
                      </span>
                      {/* Person Name */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {user.name}
                          {isUserHimself && <span className="bg-emerald-500 text-white text-[8px] font-sans px-1 rounded-sm uppercase tracking-wider font-extrabold shadow-sm">You</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">-{user.co2Saved} kg of average emissions</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs font-extrabold text-slate-800">{user.score}</span>
                      <p className="text-[9px] text-slate-400 font-mono">CARBONOS</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
