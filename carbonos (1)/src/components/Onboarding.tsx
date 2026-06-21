/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { OnboardingMetrics, CarbonProfile } from "../types";
import { DEFAULT_PROFILE } from "../data/carbonMockData";
import { ShieldCheck, ArrowRight, Plane, Car, Leaf, Footprints, Zap, ShoppingBag } from "lucide-react";

interface OnboardingProps {
  onComplete: (profile: CarbonProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [metrics, setMetrics] = useState<OnboardingMetrics>({
    transportation: {
      carType: "gas_small",
      annualMileage: 8000,
      publicTransitHours: 2,
      flightsYear: 2
    },
    diet: {
      preference: "omnivore",
      localFoodRatio: 20,
      foodWasteRatio: "average"
    },
    housing: {
      energySource: "grid_standard",
      monthlyElectricityBill: 100,
      homeSizeSqFt: 1500,
      heatingSource: "gas"
    },
    consumer: {
      shoppingFrequency: "average",
      recycleHabits: "sometimes",
      deviceUpgrades: "biyearly"
    }
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => Math.max(1, prev - 1));

  const handleFinish = () => {
    // Perform elegant behavioral algorithms to calculate initial footprint
    // 1. Transport CO2 (kg/month):
    let carFactor = 0.354; // kg/mile
    if (metrics.transportation.carType === "none") carFactor = 0;
    else if (metrics.transportation.carType === "electric") carFactor = 0.082;
    else if (metrics.transportation.carType === "hybrid") carFactor = 0.181;
    else if (metrics.transportation.carType === "gas_large") carFactor = 0.490;
    
    const carMonthly = (metrics.transportation.annualMileage * carFactor) / 12;
    const flightsMonthly = (metrics.transportation.flightsYear * 450) / 12; // average flight factor
    const publicTransitSaved = metrics.transportation.publicTransitHours * 12; // offset estimation
    const transportCo2 = Math.max(30, Math.round(carMonthly + flightsMonthly - publicTransitSaved));

    // 2. Food CO2 (kg/month):
    let dietFactor = 150; // omnivore kg/month
    if (metrics.diet.preference === "vegan") dietFactor = 55;
    else if (metrics.diet.preference === "vegetarian") dietFactor = 80;
    else if (metrics.diet.preference === "pescatarian") dietFactor = 100;
    else if (metrics.diet.preference === "poultry") dietFactor = 115;
    else if (metrics.diet.preference === "meat_heavy") dietFactor = 240;

    const foodWasteAdjustment = metrics.diet.foodWasteRatio === "minimal" ? -15 : metrics.diet.foodWasteRatio === "high" ? 25 : 0;
    const localFoodSavings = (metrics.diet.localFoodRatio / 100) * -20;
    const foodCo2 = Math.round(dietFactor + foodWasteAdjustment + localFoodSavings);

    // 3. Housing CO2 (kg/month):
    let energyFactor = 0.85; // grid standard standard electricity co2 kg per USD
    if (metrics.housing.energySource === "grid_green") energyFactor = 0.25;
    else if (metrics.housing.energySource === "solar_private" || metrics.housing.energySource === "nuclear_wind") energyFactor = 0.05;

    let heatingFactor = 1.2;
    if (metrics.housing.heatingSource === "heat_pump") heatingFactor = 0.3;
    else if (metrics.housing.heatingSource === "electric") heatingFactor = 0.7;

    const electricityCo2 = metrics.housing.monthlyElectricityBill * energyFactor * 5;
    const heatingCo2 = (metrics.housing.homeSizeSqFt / 25) * heatingFactor;
    const housingCo2 = Math.round(electricityCo2 + heatingCo2);

    // 4. Shopping CO2 (kg/month):
    let shopFactor = 65;
    if (metrics.consumer.shoppingFrequency === "minimalist") shopFactor = 30;
    else if (metrics.consumer.shoppingFrequency === "frequent") shopFactor = 140;

    const recycleOffSet = metrics.consumer.recycleHabits === "always" ? -15 : metrics.consumer.recycleHabits === "rarely" ? 10 : 0;
    const shoppingCo2 = Math.round(shopFactor + recycleOffSet);

    const totalCo2 = transportCo2 + foodCo2 + housingCo2 + shoppingCo2;

    // We translate lower emissions into higher score (0 - 1000)
    const carbonScore = Math.min(995, Math.max(100, Math.round(1000 - (totalCo2 / 1.4))));

    const generatedProfile: CarbonProfile = {
      ...DEFAULT_PROFILE,
      onboarded: true,
      metrics,
      carbonScore,
      co2Breakdown: {
        transport: transportCo2,
        food: foodCo2,
        housing: housingCo2,
        shopping: shoppingCo2
      },
      weeklyProgress: [
        { week: "Week 1", score: Math.round(carbonScore * 0.9), co2: Math.round(totalCo2 * 1.1) },
        { week: "Week 2", score: Math.round(carbonScore * 0.94), co2: Math.round(totalCo2 * 1.05) },
        { week: "Week 3", score: Math.round(carbonScore * 0.97), co2: Math.round(totalCo2 * 1.02) },
        { week: "Week 4", score: carbonScore, co2: totalCo2 }
      ]
    };

    onComplete(generatedProfile);
  };

  return (
    <div id="onboarding_root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Soft warm gradients */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-teal-100 rounded-full blur-[120px] pointer-events-none opacity-50 font-sans" />

      {/* Top Brand Block */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-200/60 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold tracking-widest text-slate-500 uppercase text-xs">CARBONOS // ENGINE CALIBRATION</span>
        </div>
        <div className="text-slate-400 font-mono text-xs font-bold">
          STEP {step} OF 5
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8 relative z-10">
        {step === 1 && (
          <div className="space-y-6">
            <div className="inline-flex py-1 px-3 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-mono items-center gap-1.5 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> EMISSIONS SYSTEM READY
            </div>
            <h1 className="text-4xl font-sans font-extrabold tracking-tight text-slate-800 leading-tight">
              Calibrate your custom <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Carbon Twin</span>.
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-lg font-medium">
              We'll analyze 4 frictionless lifestyle indices to design your personal behavioral blueprint and discover practical emission savings.
            </p>
            <div className="pt-4 flex flex-col space-y-3">
              <button
                id="start_onboarding_btn"
                onClick={nextStep}
                className="w-fit flex items-center space-x-2 px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <span>Initialize Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-450 font-mono font-medium">Takes 45 seconds. Data is saved securely in your dynamic Firebase profile.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in bg-white rounded-[24px] border border-slate-100 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Car className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-bold tracking-widest text-slate-400 uppercase">METRIC 01 / TRANSPORTATION</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">How do you navigate your commute?</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Primary Ride Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "none", label: "No Car / Public Transit" },
                    { key: "electric", label: "Electric Vehicle (EV)" },
                    { key: "hybrid", label: "Hybrid Vehicle" },
                    { key: "gas_small", label: "Sedan / Small Car" },
                    { key: "gas_large", label: "SUV / Large Truck" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        transportation: { ...metrics.transportation, carType: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        metrics.transportation.carType === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              {metrics.transportation.carType !== "none" && (
                <div>
                  <label className="text-xs font-mono text-slate-500 block mb-2 uppercase font-bold">
                    Approx. Annual Mileage: <span className="text-emerald-600 font-bold">{metrics.transportation.annualMileage.toLocaleString()} miles</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="500"
                    value={metrics.transportation.annualMileage}
                    onChange={(e) => setMetrics({
                      ...metrics,
                      transportation: { ...metrics.transportation, annualMileage: Number(e.target.value) }
                    })}
                    className="w-full accent-emerald-500 bg-slate-100 h-1.5 rounded-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Public Transit (Hrs/Week)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={metrics.transportation.publicTransitHours}
                    onChange={(e) => setMetrics({
                      ...metrics,
                      transportation: { ...metrics.transportation, publicTransitHours: Number(e.target.value) }
                    })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Flights Per Year</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={metrics.transportation.flightsYear}
                    onChange={(e) => setMetrics({
                      ...metrics,
                      transportation: { ...metrics.transportation, flightsYear: Number(e.target.value) }
                    })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer">Back</button>
              <button onClick={nextStep} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-850 text-xs flex items-center space-x-2 cursor-pointer shadow-sm">
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in bg-white rounded-[24px] border border-slate-100 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-bold tracking-widest text-[#a3a3a3] uppercase">METRIC 02 / DIETARY PATTERNS</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Tell us about your culinary consumption</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1 uppercase font-bold">Diet Style preference</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "vegan", label: "Vegan" },
                    { key: "vegetarian", label: "Vegetarian" },
                    { key: "pescatarian", label: "Pescatarian" },
                    { key: "poultry", label: "Poultry Only" },
                    { key: "omnivore", label: "Omnivore" },
                    { key: "meat_heavy", label: "Meat Heavy" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        diet: { ...metrics.diet, preference: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        metrics.diet.preference === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-500 block mb-2 uppercase font-bold">
                  Sourced Local Ratio (percentage): <span className="text-emerald-600 font-bold">{metrics.diet.localFoodRatio}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={metrics.diet.localFoodRatio}
                  onChange={(e) => setMetrics({
                    ...metrics,
                    diet: { ...metrics.diet, localFoodRatio: Number(e.target.value) }
                  })}
                  className="w-full accent-emerald-500 bg-slate-100 h-1.5 rounded-full"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Household Food Waste</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "minimal", label: "Minimal (compost / zero waste)" },
                    { key: "average", label: "Average" },
                    { key: "high", label: "Frequent waste" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        diet: { ...metrics.diet, foodWasteRatio: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        metrics.diet.foodWasteRatio === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer">Back</button>
              <button onClick={nextStep} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-850 text-xs flex items-center space-x-2 cursor-pointer shadow-sm">
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in bg-white rounded-[24px] border border-slate-100 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Zap className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-bold tracking-widest text-[#a3a3a3] uppercase">METRIC 03 / RESIDENTIAL POWER</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Review your home footprint dynamics</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Grid Power Source</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "grid_standard", label: "Standard Coal/Gas Grid Utility" },
                    { key: "grid_green", label: "Opt-in Municipal Green Pricing" },
                    { key: "solar_private", label: "Private Rooftop Solar Photovoltaic" },
                    { key: "nuclear_wind", label: "Nuclear / Wind Direct Purchase" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        housing: { ...metrics.housing, energySource: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        metrics.housing.energySource === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Electricity Bill ($ / Mon)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={metrics.housing.monthlyElectricityBill}
                    onChange={(e) => setMetrics({
                      ...metrics,
                      housing: { ...metrics.housing, monthlyElectricityBill: Number(e.target.value) }
                    })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Home Size (Sq Ft)</label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={metrics.housing.homeSizeSqFt}
                    onChange={(e) => setMetrics({
                      ...metrics,
                      housing: { ...metrics.housing, homeSizeSqFt: Number(e.target.value) }
                    })}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Primary Heating Source</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { key: "gas", label: "Nat Gas" },
                    { key: "electric", label: "Electric" },
                    { key: "oil", label: "Heating Oil" },
                    { key: "heat_pump", label: "Heat Pump" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        housing: { ...metrics.housing, heatingSource: x.key as any }
                      })}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        metrics.housing.heatingSource === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer">Back</button>
              <button onClick={nextStep} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-850 text-xs flex items-center space-x-2 cursor-pointer shadow-sm">
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fade-in bg-white rounded-[24px] border border-slate-100 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-bold tracking-widest text-[#a3a3a3] uppercase">METRIC 04 / CONSUMER HABITS</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Calibrate shopping & manufacturing indices</h2>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Shopping Density</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "minimalist", label: "Minimalist (essential clothes/goods)" },
                    { key: "average", label: "Average retail frequency" },
                    { key: "frequent", label: "Frequent retail deliveries" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        consumer: { ...metrics.consumer, shoppingFrequency: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        metrics.consumer.shoppingFrequency === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Recyclable Separation Habits</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "always", label: "Rigorously Every item" },
                    { key: "sometimes", label: "Sometimes" },
                    { key: "rarely", label: "Seldom/never" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        consumer: { ...metrics.consumer, recycleHabits: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        metrics.consumer.recycleHabits === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-2 uppercase font-bold">Tech Upgrade intervals</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "rarely", label: "Only when broken (>3 yrs)" },
                    { key: "biyearly", label: "Every 2 years" },
                    { key: "yearly", label: "Annually / contract replacements" }
                  ].map((x) => (
                    <button
                      key={x.key}
                      onClick={() => setMetrics({
                        ...metrics,
                        consumer: { ...metrics.consumer, deviceUpgrades: x.key as any }
                      })}
                      className={`p-3.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        metrics.consumer.deviceUpgrades === x.key
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-slate-50 border-slate-200/60 text-slate-650 hover:bg-slate-100"
                      }`}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 font-sans">
              <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer">Back</button>
              <button onClick={handleFinish} className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-sm">
                <span>Compute Carbon Score</span>
                <ShieldCheck className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer stamp */}
      <footer className="max-w-2xl mx-auto w-full text-center py-4 text-[10px] font-mono text-slate-400 font-medium z-10">
        IPCC Climate Metrics Framework // Decoupled Sandbox API
      </footer>
    </div>
  );
}
