/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { CarbonProfile } from "../types";
import { SCENARIOS } from "../data/carbonMockData";
import { 
  Zap, 
  Hourglass, 
  CloudRain, 
  ThermometerSun, 
  Waves, 
  Globe,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface CarbonTimeMachineProps {
  profile: CarbonProfile;
}

export default function CarbonTimeMachine({ profile }: CarbonTimeMachineProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2036);
  const [scenarioType, setScenarioType] = useState<"Current Trend" | "Climate Collapse" | "CarbonOS Target" | "Net Zero Utopia">("CarbonOS Target");

  const getTwinStatus = () => {
    const score = profile.carbonScore;
    if (score > 750) {
      return {
        status: "OPTIMIZED METRIC TWIN",
        desc: "Your Carbon Twin is on-track for absolute sustainability stability before 2040. Minimal high-intensity buying outputs.",
        vibe: "border-emerald-200 bg-emerald-50/50 text-emerald-850"
      };
    } else if (score > 500) {
      return {
        status: "STABILIZING METRIC TWIN",
        desc: "Decent eco routine metrics. Footprint is manageable but local transportation emissions are dragging stabilization schedules.",
        vibe: "border-teal-200 bg-teal-50/50 text-teal-850"
      };
    } else {
      return {
        status: "EMISSION REBOOT WARNING",
        desc: "High residual household power and shopping metrics. Carbon Twin requires immediate mitigation to prevent collapse.",
        vibe: "border-rose-200 bg-rose-50/50 text-rose-850 font-medium"
      };
    }
  };

  const twinInfo = getTwinStatus();
  const activeScenario = SCENARIOS.find(
    s => s.year === selectedYear && s.scenarioName === scenarioType
  ) || SCENARIOS.find(s => s.scenarioName === scenarioType) || SCENARIOS[0];

  return (
    <div id="time_machine_container" className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm relative overflow-hidden flex flex-col gap-4">
      
      {/* HEADER SECTION */}
      <div className="flex items-center space-x-2.5">
        <span className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-150 flex items-center justify-center text-teal-600">
          <Globe className="h-5 w-5 animate-spin" style={{ animationDuration: "35s" }} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Predictive Carbon Twin™</h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Climate forecasting engine</p>
        </div>
      </div>

      {/* TWIN CARD */}
      <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${twinInfo.vibe}`}>
        <div className="flex justify-between items-center text-[10px] tracking-wider font-mono">
          <span className="font-bold uppercase">{twinInfo.status}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        </div>
        <p className="font-sans leading-relaxed text-slate-650">{twinInfo.desc}</p>
      </div>

      {/* SIMULATED MODEL STATES */}
      <div className="space-y-2">
        <span className="text-[9px] tracking-widest text-slate-400 uppercase font-mono block font-bold">CHOOSE SIMULATION PARAMETERS</span>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold font-mono uppercase">
          {[
            { id: "Climate Collapse", color: "border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50" },
            { id: "Current Trend", color: "border-slate-200 text-slate-650 bg-slate-50/50 hover:bg-slate-105" },
            { id: "CarbonOS Target", color: "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50" },
            { id: "Net Zero Utopia", color: "border-cyan-200 text-cyan-700 bg-cyan-50/50 hover:bg-cyan-50" }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => setScenarioType(sc.id as any)}
              className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                scenarioType === sc.id
                  ? "bg-slate-900 border-slate-900 text-white font-extrabold shadow-sm"
                  : sc.color
              }`}
            >
              {sc.id}
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE TIME SLIDER */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">Interactive Time Slider</span>
          <span className="text-xs font-bold font-mono text-teal-600 flex items-center gap-1">
            <Hourglass className="h-3.5 w-3.5 animate-pulse" />
            TARGET: {selectedYear} AD
          </span>
        </div>
        
        <div className="pt-1">
          <input
            type="range"
            min="2026"
            max="2056"
            step="10"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full accent-teal-500 bg-slate-100 h-1.5 rounded-full cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400 mt-1">
            <span>2026 (Present)</span>
            <span>2036</span>
            <span>2046</span>
            <span>2056 (Future)</span>
          </div>
        </div>
      </div>

      {/* METRIC CARD OUTCOME OUTPUT */}
      <div id="forecasted_outcome_card" className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 font-sans animate-fade-in text-xs">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-150">
          <span className="h-6 w-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-mono text-[9px] font-bold">AD</span>
          <div className="space-y-0.5">
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">WORLD STATUS OUTCOME</span>
            <span className="text-slate-800 text-xs font-extrabold flex items-center gap-1 leading-none">{activeScenario.scenarioName}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white border border-slate-100/60 p-2.5 rounded-lg flex flex-col justify-center items-center">
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Atmosphere CO₂</span>
            <span className="text-[#bf1e2e] font-mono text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
              <CloudRain className="h-3.5 w-3.5 text-rose-500" />
              {activeScenario.globalPpm} PPM
            </span>
          </div>
          <div className="bg-white border border-slate-100/60 p-2.5 rounded-lg flex flex-col justify-center items-center">
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Temp Variance</span>
            <span className="text-amber-600 font-mono text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
              <ThermometerSun className="h-3.5 w-3.5 text-amber-500" />
              +{activeScenario.temperatureRise}°C
            </span>
          </div>
        </div>

        <p className="text-slate-600 font-sans text-[11px] leading-relaxed pt-1 font-medium">{activeScenario.impactReport}</p>
      </div>

    </div>
  );
}
