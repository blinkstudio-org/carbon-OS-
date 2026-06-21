/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarbonProfile } from "../types";
import { Award, Zap, TrendingUp, Info, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface CarbonScoreRingProps {
  profile: CarbonProfile;
  sanctuaryOffsetDaily?: number;
}

export default function CarbonScoreRing({ profile, sanctuaryOffsetDaily = 0 }: CarbonScoreRingProps) {
  // Score mapping: 0 to 1000.
  const score = profile.carbonScore;
  const breakDown = profile.co2Breakdown;
  
  const totalMonthlyco2Raw = breakDown.transport + breakDown.food + breakDown.housing + breakDown.shopping;
  const offsetMonthly = sanctuaryOffsetDaily * 30.4; // daily to monthly conversion
  const totalMonthlyco2 = Math.max(0, totalMonthlyco2Raw - offsetMonthly);
  
  // Average benchmark
  const averageMonthlyCo2 = 620; 
  const savingPct = Math.round(((averageMonthlyCo2 - totalMonthlyco2) / averageMonthlyCo2) * 100);

  // SVG Circular math
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Score percentage representing circular bar fill
  const scorePct = Math.min(100, Math.max(0, score / 10));
  const strokeDashoffset = circumference - (scorePct / 100) * circumference;

  // Determine user score bracket
  let bracketName = "Carbon Heavy";
  let bracketColor = "text-rose-600 border-rose-200 bg-rose-50";
  let bracketGlow = "stroke-rose-500";
  
  if (score > 800) {
    bracketName = "Ecological Saint";
    bracketColor = "text-emerald-700 border-emerald-200 bg-emerald-50";
    bracketGlow = "stroke-emerald-500";
  } else if (score > 600) {
    bracketName = "Eco Champion";
    bracketColor = "text-teal-700 border-teal-200 bg-teal-50";
    bracketGlow = "stroke-teal-500";
  } else if (score > 400) {
    bracketName = "Sustaining Guardian";
    bracketColor = "text-amber-700 border-amber-200 bg-amber-50";
    bracketGlow = "stroke-amber-500";
  }

  // Get dynamic AI-style suggestions based on highest consumer footprint category
  const getTopWasteFactor = () => {
    const list = [
      { name: "Daily Vehicle Transportation", val: breakDown.transport, tip: "Consider converting short local errands to e-biking or bus transit, saving up to 45 kg CO₂ monthly." },
      { name: "Dietary Heavy Red Meat", val: breakDown.food, tip: "Swapping just 2 dinners per week with organic legume protein or vegan alternatives lowers dietary load by 22%." },
      { name: "Home Power Draft", val: breakDown.housing, tip: "Setting thermostat thresholds 2° lower at night or upgrading window caulking blocks standby heat leaks." },
      { name: "Consumer Retail Deliveries", val: breakDown.shopping, tip: "Aim for bulk purchases or thrifting. Secondhand clothes reduce manufacturing outputs by 75%." }
    ];
    return list.sort((a,b) => b.val - a.val)[0];
  };

  const worstMetric = getTopWasteFactor();

  // Custom tooltip design matching CarbonOS glassmorphism in light-mode
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg border border-slate-800">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wide opacity-85">{payload[0].payload.week}</p>
          <div className="mt-1.5 space-y-1 font-mono text-xs">
            <p className="text-emerald-400 font-extrabold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              FOOTPRINT: {payload[0].value} kg CO₂
            </p>
            <p className="text-slate-300 font-semibold flex items-center gap-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              SCORE: {payload[0].payload.score} PTS
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="score_ring_card" className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm relative overflow-hidden flex flex-col gap-5 w-full">
      {/* Absolute faint background glow */}
      <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Main Stats Summary grid */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Circle Ring display */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-slate-100"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated score circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`transition-all duration-1000 ease-out fill-transparent ${bracketGlow}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Floating text stats centered inside Circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">CARBON SCORE</span>
            <span className="text-3xl font-extrabold font-sans leading-none my-1.5 text-slate-900">
              {score}
            </span>
            <div className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold tracking-wider border ${bracketColor}`}>
              {bracketName}
            </div>
          </div>
        </div>

        {/* Carbon Stats Summary */}
        <div className="flex-grow space-y-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Active Footprint Index</h3>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">SECURED & DYNAMIC SYNC</p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] px-2 py-0.5 rounded-lg font-mono font-medium">
              <TrendingUp className="h-3 w-3" />
              {savingPct > 0 ? `${savingPct}% BELOW AVG` : "GRID STANDARD"}
            </div>
          </div>

          {/* Monthly score detail */}
          <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 font-mono text-xs">
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">MONTHLY CO2</span>
              <span className="text-slate-800 text-sm font-extrabold">{totalMonthlyco2.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase text-[10px]">SAVINGS SAVED</span>
              <span className="text-emerald-600 text-sm font-extrabold">
                +{Math.max(0, averageMonthlyCo2 - totalMonthlyco2).toLocaleString()} kg
              </span>
            </div>
          </div>

          {/* Categorized progress rows */}
          <div className="space-y-2 pt-1">
            {[
              { label: "Transportation", color: "bg-amber-400", val: breakDown.transport, pct: Math.round((breakDown.transport / (totalMonthlyco2Raw || 1)) * 100) },
              { label: "Diet & Food", color: "bg-emerald-400", val: breakDown.food, pct: Math.round((breakDown.food / (totalMonthlyco2Raw || 1)) * 100) },
              { label: "Residential Power", color: "bg-cyan-400", val: breakDown.housing, pct: Math.round((breakDown.housing / (totalMonthlyco2Raw || 1)) * 100) },
              { label: "Retail Shopping", color: "bg-indigo-400", val: breakDown.shopping, pct: Math.round((breakDown.shopping / (totalMonthlyco2Raw || 1)) * 100) }
            ].map((cat) => (
              <div key={cat.label} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${cat.color}`} />
                    {cat.label}
                  </span>
                  <span className="text-slate-700 font-mono font-semibold">
                    {cat.val} kg <span className="text-[10px] font-normal text-slate-400">({cat.pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}

            {offsetMonthly > 0 && (
              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1.5 font-sans">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conservatory Offsets
                  </span>
                  <span className="text-emerald-600 font-mono font-bold">
                    -{Math.round(offsetMonthly)} kg <span className="text-[10px] font-normal text-slate-400">({Math.round((offsetMonthly / (totalMonthlyco2Raw || 1)) * 100)}% offset)</span>
                  </span>
                </div>
                <div className="w-full bg-emerald-50 h-1 rounded-full overflow-hidden border border-emerald-150">
                  <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: `${Math.min(100, Math.round((offsetMonthly / (totalMonthlyco2Raw || 1)) * 100))}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Actionable Micro-Insight banner */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex gap-3 items-start">
            <Info className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">Behavioral Target: <span className="text-amber-600">{worstMetric?.name}</span></span>
              <p className="text-slate-600 leading-relaxed font-sans">{worstMetric?.tip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="pt-4 border-t border-slate-100 w-full">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 tracking-tight uppercase font-mono">Weekly Footprint Reductions</h4>
              <p className="text-[9px] text-slate-400 font-sans">Active behavioral tracking cycles (kg CO₂)</p>
            </div>
          </div>
        </div>

        <div className="h-32 w-full text-slate-500">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={profile.weeklyProgress || []}
              margin={{ top: 8, right: 8, left: -28, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="week" 
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="co2" 
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={{ r: 3, stroke: "#ffffff", strokeWidth: 1.5, fill: "#10b981" }}
                activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 1.5, fill: "#059669" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
