import { useState, useEffect, useRef } from "react";
import { CarbonProfile } from "../types";
import { db } from "../lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  query 
} from "firebase/firestore";
import { 
  Sprout, 
  Trash2, 
  Heart, 
  Sparkles, 
  HelpCircle, 
  ArrowUpRight, 
  CheckCircle, 
  Compass, 
  Flame,
  Globe,
  Waves,
  Hammer,
  Wind,
  Trees
} from "lucide-react";

export interface SanctuaryItem {
  id: string;
  typeId: string;
  name: string;
  purchasedAt: string;
  growth: number; // 0 to 100
  lastNurturedAt: string | null;
  nurtureCount: number;
}

export interface SanctuaryType {
  id: string;
  name: string;
  category: "flora" | "marine" | "soil" | "tech";
  cost: number;
  unlockedAtXp: number;
  co2AbsorptionDaily: number; // in kg CO2 per day
  description: string;
  emoji: string;
  color: string;
}

export const SANCTUARY_TYPES: SanctuaryType[] = [
  {
    id: "mangrove",
    name: "Mangrove Sapling",
    category: "marine",
    cost: 100,
    unlockedAtXp: 0,
    co2AbsorptionDaily: 0.18,
    description: "Coastal defenders with incredible carbon storage capacity in muddy intertidal roots.",
    emoji: "🌱",
    color: "from-emerald-400 to-teal-500"
  },
  {
    id: "kelp_forest",
    name: "Giant Kelp Frond",
    category: "marine",
    cost: 180,
    unlockedAtXp: 150,
    co2AbsorptionDaily: 0.38,
    description: "Fast-growing marine algae acting as an ocean carbon sink, expanding over coastal waters.",
    emoji: "🌿",
    color: "from-teal-400 to-cyan-500"
  },
  {
    id: "urban_forest",
    name: "Redwood Seedling",
    category: "flora",
    cost: 300,
    unlockedAtXp: 400,
    co2AbsorptionDaily: 0.72,
    description: "Long-term carbon sequestering giants. Once grown, they hold immense atmospheric weight.",
    emoji: "🌲",
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "biochar_pit",
    name: "Biochar Soil Injector",
    category: "soil",
    cost: 220,
    unlockedAtXp: 200,
    co2AbsorptionDaily: 0.50,
    description: "Pyrolyzed biomass locked into topsoil, permanently locking carbon for centuries.",
    emoji: "🌋",
    color: "from-amber-600 to-stone-800"
  },
  {
    id: "direct_air_capture",
    name: "DAC Mechanic Filter",
    category: "tech",
    cost: 500,
    unlockedAtXp: 600,
    co2AbsorptionDaily: 1.40,
    description: "Hyper-efficient adsorption filters pulling carbon dioxide directly from ambient airflow.",
    emoji: "💨",
    color: "from-slate-400 to-indigo-950"
  },
  {
    id: "community_solar",
    name: "Solar Microgrid Cooker",
    category: "tech",
    cost: 130,
    unlockedAtXp: 80,
    co2AbsorptionDaily: 0.28,
    description: "Verified community offset initiative replacing wood stoves with solar concentrators.",
    emoji: "☀️",
    color: "from-yellow-400 to-amber-500"
  }
];

interface EcoSanctuaryProps {
  profile: CarbonProfile;
  userPoints: number;
  onSpendPoints: (cost: number, rewardId: string) => Promise<void>;
  onEarnPoints?: (amount: number, reason: string) => Promise<void>;
  onUpdateOffsetRate?: (rateDaily: number) => void;
}

export default function EcoSanctuary({ 
  profile, 
  userPoints, 
  onSpendPoints,
  onEarnPoints,
  onUpdateOffsetRate 
}: EcoSanctuaryProps) {
  const [items, setItems] = useState<SanctuaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [tickerOffset, setTickerOffset] = useState<number>(0);
  const [nurtureFeed, setNurtureFeed] = useState<{ id: string; text: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [salvageTarget, setSalvageTarget] = useState<SanctuaryItem | null>(null);

  // Auto-clear messages
  useEffect(() => {
    if (localError) {
      const t = setTimeout(() => setLocalError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [localError]);

  // Core background loop for ticking counter
  useEffect(() => {
    const intervalRef = setInterval(() => {
      // Calculate continuous offset increments based on daily capture rates
      let incrementPerSecond = 0;
      items.forEach((item) => {
        const type = SANCTUARY_TYPES.find(t => t.id === item.typeId);
        if (type) {
          // Adjust absorption rate by growth level (higher growth = more efficient)
          const growthFactor = 0.5 + (0.5 * (item.growth / 100));
          incrementPerSecond += (type.co2AbsorptionDaily * growthFactor) / 86400;
        }
      });
      setTickerOffset(prev => prev + (incrementPerSecond * 0.1)); // ticking every 100ms
    }, 100);

    return () => clearInterval(intervalRef);
  }, [items]);

  // Sync total offset daily capture rate up to parent component
  useEffect(() => {
    let totalDailyRate = 0;
    items.forEach((item) => {
      const type = SANCTUARY_TYPES.find(t => t.id === item.typeId);
      if (type) {
        const growthFactor = 0.5 + (0.5 * (item.growth / 100));
        totalDailyRate += type.co2AbsorptionDaily * growthFactor;
      }
    });
    if (onUpdateOffsetRate) {
      onUpdateOffsetRate(totalDailyRate);
    }
  }, [items, onUpdateOffsetRate]);

  // Load items from Firestore / LocalStorage
  useEffect(() => {
    const loadSanctuary = async () => {
      setLoading(true);
      if (profile.userId === "local_guest_user") {
        const stored = localStorage.getItem("carbonos_sanctuary_items");
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          // default starter seeds for local guest
          const starterSeeds: SanctuaryItem[] = [];
          setItems(starterSeeds);
          localStorage.setItem("carbonos_sanctuary_items", JSON.stringify(starterSeeds));
        }
        setLoading(false);
        return;
      }

      // If use default mock/unauthenticated ID, do not query Firestore to prevent permission errors
      if (profile.userId === "user_carbon_os_001" || !profile.userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const itemsRef = collection(db, "users", profile.userId, "sanctuary_items");
        const snap = await getDocs(itemsRef);
        const list: SanctuaryItem[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as SanctuaryItem);
        });
        setItems(list);
      } catch (err) {
        console.error("Failed to load sanctuary items from Firestore:", err);
        // Soft fallback to localStorage
        const stored = localStorage.getItem(`carbonos_sanctuary_${profile.userId}`);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };

    if (profile.userId) {
      loadSanctuary();
    }
  }, [profile.userId]);

  // Helper to persist current item list
  const persistItems = async (updatedList: SanctuaryItem[]) => {
    setItems(updatedList);
    if (profile.userId === "local_guest_user") {
      localStorage.setItem("carbonos_sanctuary_items", JSON.stringify(updatedList));
      return;
    }

    // Attempt individual document operations is cleaner, but keeping full local backup as safety
    localStorage.setItem(`carbonos_sanctuary_${profile.userId}`, JSON.stringify(updatedList));
  };

  // Nurture an active item
  const handleNurture = async (itemId: string) => {
    const now = new Date();
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) return;

    // Optional: 1 hour cooldown for nurturing the same plant
    if (targetItem.lastNurturedAt) {
      const last = new Date(targetItem.lastNurturedAt);
      const diffMs = now.getTime() - last.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs < 0.1) { // 6 minutes cooldown for smooth demoing/testing
        setLocalError("This module was nurtured very recently. Give it a few moments of breathing room to absorb atmospheric CO₂!");
        return;
      }
    }

    const nextGrowth = Math.min(100, targetItem.growth + 10);
    const updatedList = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          growth: nextGrowth,
          lastNurturedAt: now.toISOString(),
          nurtureCount: item.nurtureCount + 1
        };
      }
      return item;
    });

    await persistItems(updatedList);

    // Trigger visual floating text feedback
    setNurtureFeed({ id: itemId, text: nextGrowth === 100 ? "🌱 Level Maxed (+50% Rate Boost!)" : "🌟 +10% Growth Rate!" });
    setTimeout(() => setNurtureFeed(null), 3000);

    // Update in Firestore
    if (profile.userId !== "local_guest_user") {
      try {
        const itemDocRef = doc(db, "users", profile.userId, "sanctuary_items", itemId);
        await updateDoc(itemDocRef, {
          growth: nextGrowth,
          lastNurturedAt: now.toISOString(),
          nurtureCount: targetItem.nurtureCount + 1
        });
      } catch (e) {
        console.error("Failed to update nurtured item in firestore:", e);
      }
    }
  };

  // Recruit & Purchase a new sink
  const handlePurchase = async (type: SanctuaryType) => {
    if (userPoints < type.cost) {
      setLocalError("Insufficient Ledger XP balance! Complete Daily Logs and challenges to earn points.");
      return;
    }

    // Deduct points
    await onSpendPoints(type.cost, `sanctuary_purchase_${type.id}`);

    const id = "nature_" + Math.random().toString(36).substring(2, 11);
    const newItem: SanctuaryItem = {
      id,
      typeId: type.id,
      name: `${type.name} #${items.filter(i => i.typeId === type.id).length + 1}`,
      purchasedAt: new Date().toISOString(),
      growth: 10, // starts as 10% seedling
      lastNurturedAt: null,
      nurtureCount: 0
    };

    const updatedList = [...items, newItem];
    await persistItems(updatedList);

    setSuccessMsg(`Congratulations! Sprouted ${newItem.name} in your green conservatory sanctuary.`);
    setTimeout(() => setSuccessMsg(null), 5000);

    // Write to Firestore
    if (profile.userId !== "local_guest_user") {
      try {
        const itemDocRef = doc(db, "users", profile.userId, "sanctuary_items", id);
        await setDoc(itemDocRef, {
          typeId: newItem.typeId,
          name: newItem.name,
          purchasedAt: newItem.purchasedAt,
          growth: newItem.growth,
          lastNurturedAt: newItem.lastNurturedAt,
          nurtureCount: newItem.nurtureCount
        });
      } catch (e) {
        console.error("Failed to add purchased item to firestore:", e);
      }
    }
  };

  // Triggers the salvage screen overlay instead of window.confirm
  const handleDeCultivate = (item: SanctuaryItem) => {
    setSalvageTarget(item);
  };

  // Implemented safe, accessible in-canvas callback for deletion completion
  const executeSalvage = async (item: SanctuaryItem) => {
    const type = SANCTUARY_TYPES.find(t => t.id === item.typeId);
    if (!type) return;

    const refundAmount = Math.round(type.cost * 0.3); // 30% XP refund
    const updatedList = items.filter(i => i.id !== item.id);
    await persistItems(updatedList);

    // Call earn points callback or simulate XP refund
    if (onEarnPoints) {
      await onEarnPoints(refundAmount, `Salvaged ${item.name}`);
    }
    
    setSuccessMsg(`Salvaged ${item.name}! Earned back +${refundAmount} XP refund.`);
    setSalvageTarget(null);

    // Delete representation from Firestore
    if (profile.userId !== "local_guest_user") {
      try {
        const itemDocRef = doc(db, "users", profile.userId, "sanctuary_items", item.id);
        await deleteDoc(itemDocRef);
      } catch (e) {
        console.error("Failed to delete dismantled item in firestore:", e);
      }
    }
  };

  // Calculate stats
  const totalDailySequestration = items.reduce((sum, item) => {
    const type = SANCTUARY_TYPES.find(t => t.id === item.typeId);
    if (!type) return sum;
    const growthFactor = 0.5 + (0.5 * (item.growth / 100)); // 0.5 at seed, 1.0 at max growth
    return sum + (type.co2AbsorptionDaily * growthFactor);
  }, 0);

  const activeMarine = items.filter(i => SANCTUARY_TYPES.find(t => t.id === i.typeId)?.category === "marine").length;
  const activeFlora = items.filter(i => SANCTUARY_TYPES.find(t => t.id === i.typeId)?.category === "flora").length;
  const activeTech = items.filter(i => SANCTUARY_TYPES.find(t => t.id === i.typeId)?.category === "tech").length;
  const activeSoil = items.filter(i => SANCTUARY_TYPES.find(t => t.id === i.typeId)?.category === "soil").length;

  return (
    <div className="space-y-6">
      {/* SECTION 1: DYNAMIC LED CARBON TICKER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LED Live Ticker */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-900/40 shadow-sm flex flex-col justify-between">
          <div className="space-y-1 bg-transparent">
            <span className="text-[10px] font-mono text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5 leading-none">
              <Globe className="h-4 w-4 animate-spin text-emerald-450 inline" style={{ animationDuration: '40s' }} />
              Active Negative Emissions Sink Ticker
            </span>
            <h3 className="text-xl font-bold font-sans text-emerald-100 tracking-tight pt-1">My Conservatory Absorption</h3>
          </div>

          <div className="py-6 flex flex-col items-center justify-center bg-transparent">
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-emerald-450 tracking-wider tabular-nums leading-none">
              {tickerOffset.toFixed(7)} <span className="text-lg text-emerald-200">kg CO₂</span>
            </div>
            <p className="text-[9px] text-emerald-300 font-mono mt-2 bg-emerald-900/35 border border-emerald-800 px-3 py-1 rounded-full uppercase font-black tracking-wider animate-pulse">
              Passive Sequestration Live Event Stream (100ms cycle)
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-900/30 flex justify-between text-xs text-emerald-200/80 font-mono bg-transparent">
            <div>
              <span>Daily Multiplier: </span>
              <strong className="text-white font-extrabold text-sm">{totalDailySequestration.toFixed(2)} kg/day</strong>
            </div>
            <div>
              <span>Active Sinks count: </span>
              <strong className="text-white font-extrabold text-sm">{items.length} units</strong>
            </div>
          </div>
        </div>

        {/* Ledger XP points balance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-slate-400 font-black tracking-widest uppercase leading-none">LEDGER WALLET</span>
            <h3 className="text-sm font-bold text-slate-800 pt-1">Offset Transaction Capital</h3>
            <p className="text-[11px] text-slate-500 font-sans leading-relaxed">Spend your earned XP points here to invest in active nature-restoration, carbon-sink seeds, or high-tech filtering projects.</p>
          </div>

          <div className="py-4 border-t border-b border-slate-100 my-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold font-sans">Available Ledger Balance:</span>
            <div className="flex items-center gap-1.5">
              <Flame className="h-5 w-5 text-amber-500 animate-pulse fill-amber-100" />
              <div className="font-mono font-black text-2xl text-amber-600 tracking-tight">
                {userPoints.toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase font-sans">XP</span>
              </div>
            </div>
          </div>

          <a href="#daily-log-tab" className="text-center text-[10px] font-mono uppercase bg-slate-105 hover:bg-slate-200 text-slate-650 font-black py-2.5 rounded-xl block transition-all">
            + Earn more XP in daily logs
          </a>
        </div>
      </div>

      {/* SUCCESS & ERROR MESSAGE BANNERS */}
      <div className="space-y-3">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-xs text-emerald-800 animate-fade-in font-medium shadow-xs">
            <CheckCircle className="h-5 w-5 text-emerald-600 animate-pulse flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {localError && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-xs text-rose-850 animate-fade-in font-medium shadow-xs">
            <HelpCircle className="h-5 w-5 text-rose-500 animate-bounce flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}
      </div>

      {/* CONSERVATORY & STORE GRID DIVISION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPASS: LIVE ACTIVE GARDEN */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/40">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Trees className="h-4.5 w-4.5 text-emerald-600" />
                Conservatory Sinks ({items.length})
              </h3>
              <p className="text-[10px] text-slate-450 font-mono mt-0.5 uppercase tracking-wide">Cultivating ecosystem capture engines</p>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-wrap gap-1">
              {["all", "flora", "marine", "tech", "soil"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                    activeFilter === cat 
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Core Content Body */}
          <div className="p-5 min-h-[360px] flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <Sprout className="h-9 w-9 text-emerald-500 animate-spin" />
                <p className="text-xs font-mono text-slate-450 animate-pulse uppercase">Retrieving Conservatory registry...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 max-w-md mx-auto">
                <div className="h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-2xl animate-pulse">
                  🌱
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">My Sanctuary Pasture Bed</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    You currently do not have any active biological or mechanical carbon-absorbing nodes. Use your accumulated XP ledger points in the **Sprout Store** on the right to grow trees, algae, biochar injectors or direct air absorbers!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items
                  .filter(item => {
                    if (activeFilter === "all") return true;
                    const type = SANCTUARY_TYPES.find(t => t.id === item.typeId);
                    return type?.category === activeFilter;
                  })
                  .map((item) => {
                    const type = SANCTUARY_TYPES.find(t => t.id === item.typeId);
                    if (!type) return null;

                    const growthFactor = 0.5 + (0.5 * (item.growth / 100));
                    const currentAbsorptionRate = type.co2AbsorptionDaily * growthFactor;
                    const isNurtureFeedActive = nurtureFeed?.id === item.id;

                    return (
                      <div 
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs hover:border-emerald-300 hover:shadow-xs hover:scale-[1.01] transition-all"
                      >
                        {/* Floating growth particle feedback */}
                        {isNurtureFeedActive && (
                          <div className="absolute inset-x-0 top-0 bg-emerald-50 text-emerald-800 text-[10px] font-mono py-1 text-center font-bold z-10 animate-fade-in flex items-center justify-center gap-1 shadow-xs">
                            <Sparkles className="h-3 w-3 text-emerald-600 animate-spin" />
                            {nurtureFeed.text}
                          </div>
                        )}

                        {/* Plant Visual Block */}
                        <div className="p-4 bg-gradient-to-b from-slate-50/50 to-transparent">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              {/* Big animated emoji frame */}
                              <div className={`h-11 w-11 rounded-lg bg-gradient-to-tr ${type.color} text-white flex items-center justify-center text-xl shadow-xs flex-shrink-0 animate-pulse`}>
                                {type.emoji}
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[8px] font-mono text-slate-400 font-extrabold uppercase bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded tracking-wider">
                                  {type.category}
                                </span>
                                <h4 className="text-xs font-black text-slate-800 tracking-tight leading-none mt-1">{item.name}</h4>
                                <span className="text-[9px] text-[#888888] font-mono uppercase font-semibold block pt-0.5">
                                  Age: {new Date(item.purchasedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Salvage Dismantle Pin */}
                            <button 
                              onClick={() => handleDeCultivate(item)}
                              title="Dismantle sink"
                              className="text-slate-350 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Growth & Yield metrics */}
                          <div className="space-y-1 mt-4">
                            <div className="flex justify-between text-[9px] font-mono uppercase font-black tracking-widest text-[#777777]">
                              <span>Growth Level</span>
                              <span className="text-emerald-600 font-bold">{item.growth}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${item.growth}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 font-mono italic">
                              {item.growth === 100 
                                ? "✨ Fully mature! Performing at max capacity." 
                                : `Nurture progress shifts performance to standard weight.`}
                            </p>
                          </div>
                        </div>

                        {/* Foot Action Buttons */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[8px] text-slate-400 block font-mono">SEQUESTRATION WEIGHT</span>
                            <span className="font-extrabold text-emerald-700 font-mono flex items-center gap-0.5">
                              {currentAbsorptionRate.toFixed(2)} kg/day
                            </span>
                          </div>

                          <button
                            onClick={() => handleNurture(item.id)}
                            disabled={item.growth >= 100}
                            className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                              item.growth >= 100 
                                ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95"
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${item.growth < 100 ? "text-rose-200 fill-rose-100" : ""}`} />
                            {item.growth >= 100 ? "MAXED" : "NURTURE"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Micro FAQ Ledger footer */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl text-[10px] text-indigo-700 flex gap-2.5 items-start mt-6">
              <Sprout className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-0.5">
                <span className="font-bold text-indigo-800 block">Sanctuary Climate Logic Link</span>
                <p className="text-indigo-650 leading-relaxed font-sans font-medium">
                  Your conservatory is dynamically feeding negative offsets to reduce your ledger twin metrics. This means your net emissions are actively being driven down below normal averages!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPASS: SPROUT STORE PURCHASING DEPOSIT */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Flame className="h-4 w-4 text-amber-500 fill-amber-100" />
              Sprout Store Sinks
            </h3>
            <p className="text-[9px] text-[#888888] font-mono uppercase font-semibold">Spend LEDGER XP to construct negative sinks</p>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {SANCTUARY_TYPES.map((type) => {
              const countOfOwn = items.filter(i => i.typeId === type.id).length;
              const hasPoints = userPoints >= type.cost;
              const hasRequiredXpLevel = userPoints >= type.unlockedAtXp; // Or general lifetime level check

              return (
                <div 
                  key={type.id}
                  className={`border p-3.5 rounded-xl flex flex-col justify-between transition-all ${
                    hasPoints && hasRequiredXpLevel
                      ? "bg-slate-50 border-slate-150 hover:bg-slate-100/40 hover:border-slate-300"
                      : "bg-slate-50/40 border-slate-100/50 pointer-events-none opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-extrabold tracking-wider border ${
                          type.category === "marine" ? "bg-cyan-50 border-cyan-100 text-cyan-700" :
                          type.category === "flora" ? "bg-green-50 border-green-100 text-green-700" :
                          type.category === "soil" ? "bg-amber-50 border-amber-100 text-amber-700" :
                          "bg-indigo-50 border-indigo-100 text-indigo-700"
                        }`}>
                          {type.category}
                        </span>
                        {countOfOwn > 0 && (
                          <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[8px] font-mono font-bold tracking-wider leading-none">
                            OWNED: {countOfOwn}
                          </span>
                        )}
                      </div>
                      <span className="text-amber-600 font-extrabold font-mono text-xs flex items-center gap-0.5">
                        {type.cost} XP
                      </span>
                    </div>

                    <div className="flex gap-2.5 pt-1 items-start bg-transparent">
                      <span className="text-2xl">{type.emoji}</span>
                      <div className="text-left bg-transparent">
                        <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-snug">{type.name}</h4>
                        <span className="text-[9px] text-emerald-700 font-mono uppercase font-black block tracking-wider pt-0.5">
                          -{type.co2AbsorptionDaily} kg CO₂ / day
                        </span>
                        <p className="text-[11px] text-slate-550 leading-normal font-sans pt-1 font-medium">{type.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Purchase button */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 bg-transparent flex justify-between items-center">
                    {!hasRequiredXpLevel ? (
                      <span className="w-full text-center text-[9px] font-mono uppercase py-1.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold tracking-widest leading-none">
                        ⚠️ Requires {type.unlockedAtXp} XP points to unlock
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePurchase(type)}
                        disabled={!hasPoints}
                        className={`w-full py-2 rounded-xl text-[10px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer ${
                          hasPoints 
                            ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xs active:scale-95" 
                            : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {hasPoints ? `Buy & Sprout (${type.cost} XP)` : "XP balance is insufficient"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CUSTOM ACCESSIBLE SALVAGE CONFIRMATION DIALOG MODAL */}
      {salvageTarget && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="salvage-modal-title"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in"
        >
          <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full p-6 space-y-5 shadow-2xl relative text-slate-800">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl animate-pulse">
                🍂
              </div>
              <h3 id="salvage-modal-title" className="text-base font-black tracking-tight text-slate-900">
                Confirm Node Salvaging
              </h3>
              <p className="text-xs text-slate-500 leading-normal font-sans pt-1">
                Are you sure you want to salvage <strong className="text-slate-800 font-bold">{salvageTarget.name}</strong>? This will dismantle this carbon-reclaiming node, but yields a <strong className="text-emerald-600 font-bold font-mono">+{Math.round((SANCTUARY_TYPES.find(t => t.id === salvageTarget.typeId)?.cost || 0) * 0.3)} XP</strong> salvage allowance refund!
              </p>
            </div>

            <div className="flex gap-2 font-sans">
              <button
                onClick={() => setSalvageTarget(null)}
                className="flex-1 py-3 text-xs font-bold font-sans text-slate-500 hover:text-slate-850 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-center focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              >
                Keep Active Node
              </button>
              <button
                onClick={() => executeSalvage(salvageTarget)}
                className="flex-1 py-3 text-xs font-extrabold font-sans text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all rounded-xl cursor-pointer text-center shadow-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                Yes, Salvage Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
