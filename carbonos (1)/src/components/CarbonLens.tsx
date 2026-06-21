/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { CarbonLensResult } from "../types";
import { 
  Camera, 
  Sparkles, 
  AlertOctagon, 
  Info, 
  RotateCcw, 
  CheckCircle,
  TrendingDown,
  Leaf
} from "lucide-react";

export default function CarbonLens() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CarbonLensResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [animateFlash, setAnimateFlash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysis = async (payload: { image?: string; guessedObject?: string }) => {
    setLoading(true);
    setAnimateFlash(true);
    setError(null);
    setTimeout(() => {
      setAnimateFlash(false);
    }, 600);

    try {
      const response = await fetch("/api/lens-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("carbonOS Vision servers failed to analyze product.");
      }
      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Visual analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        startAnalysis({ image: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const sampleProducts = [
    { label: "V8 Luxury SUV", imgName: "SUV Car" },
    { label: "Smart LED Bulb", imgName: "Smart Lightbulb" },
    { label: "Coffee Latte Cup", imgName: "Cardboard Coffee Cup" },
    { label: "E-Commuter Bicycle", imgName: "Electric Commute Bike" },
    { label: "Organic Avocado", imgName: "Organic Hass Avocado" }
  ];

  return (
    <div id="carbon_lens_wrapper" className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm relative">
      {/* Visual Camera lens flash simulation overlay */}
      {animateFlash && (
        <div className="absolute inset-0 bg-white/95 z-50 rounded-2xl transition-all duration-300 pointer-events-none flex items-center justify-center">
          <Camera className="h-10 w-10 text-emerald-400 animate-ping" />
        </div>
      )}

      <div className="flex items-center space-x-2.5 mb-4">
        <span className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600">
          <Camera className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Carbon Lens</h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Vision lifecycle analysis</p>
        </div>
      </div>

      {!result && !loading && (
        <div className="space-y-4">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Surgically classify custom product. Drag design files or click to configure choices"
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col justify-center items-center text-center transition-all min-h-[140px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              dragActive 
                ? "border-emerald-400 bg-emerald-50" 
                : "border-slate-200 hover:border-slate-350 bg-slate-50 focus:border-slate-350"
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              accept="image/*"
              className="hidden" 
            />
            <Camera className="h-8 h-8 text-emerald-600 mb-2 animate-bounce" />
            <span className="text-xs font-bold text-slate-700">Scan product image or tap to select</span>
            <span className="text-[10px] text-slate-450 mt-1">Evaluates total structural lifecycle offsets</span>
          </div>

          {/* Quick links */}
          <div className="space-y-1.5 pt-1.5">
            <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block">QUICK SIMULATED TARGETS</span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {sampleProducts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => startAnalysis({ guessedObject: p.imgName })}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans text-[10px] px-2.5 py-1 rounded-full font-bold cursor-pointer transition-all active:scale-95"
                >
                  🔍 {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 space-y-3">
          <div className="relative flex justify-center">
            <span className="animate-spin text-2xl h-8 w-8 rounded-full border-t-2 border-emerald-500 flex items-center justify-center text-emerald-500">
              <Camera className="h-4 w-4 animate-pulse" />
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider animate-pulse">Running smart item classification...</p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-700 flex gap-2.5 items-start">
          <AlertOctagon className="h-4.5 w-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Vision error feedback:</span>
            <p className="font-sans leading-relaxed text-[11px]">{error}</p>
            <button 
              onClick={() => setResult(null)} 
              className="mt-1 text-[10px] font-mono uppercase bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded transition-all cursor-pointer font-bold"
            >
              Reset Lens
            </button>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 animate-fade-in text-xs font-sans">
          <div className="flex justify-between items-start border-b border-slate-250/50 pb-2">
            <div>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">OBJECT IDENTIFIED</span>
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1 mt-0.5 whitespace-nowrap">
                <Leaf className="h-4 w-4 text-emerald-600 inline" />
                {result.detectedObject || (result as any).itemMatched || "Detected Item"}
              </h4>
              <p className="text-[9px] font-mono text-slate-400">Category: <strong className="uppercase font-bold text-slate-500">{result.carbonCategory || "shopping"}</strong></p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 font-mono block">Estimated Output</span>
              <span className="text-emerald-700 font-extrabold text-sm font-mono">{(result.estimatedCo2 !== undefined ? result.estimatedCo2 : (result as any).co2WeightKg) || 0} kg CO₂</span>
            </div>
          </div>

          <p className="text-slate-650 leading-relaxed text-[11px] font-sans">{result.environmentalAnalysis || (result as any).analysisSummary || "No lifecycle details found."}</p>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] space-y-1.5 flex gap-2.5 items-start">
            <TrendingDown className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-emerald-800 block uppercase font-mono text-[9px] tracking-wider">ECO OPTIMIZATION TARGETS</span>
              <h5 className="font-bold text-slate-850 text-xs mt-0.5">{result.carbonIntensity ? `Intensity: ${result.carbonIntensity.toUpperCase()}` : "Optimization Opportunity"}</h5>
              <p className="text-emerald-700 leading-relaxed font-sans text-[11px] font-medium mt-1">{result.alternativeText || (result as any).alternativeSavingDetail || "Provides significant reduction offsets."}</p>
            </div>
          </div>

          <button 
            onClick={() => setResult(null)} 
            className="w-full py-2.5 bg-slate-250 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all font-mono text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Camera Lens
          </button>
        </div>
      )}
    </div>
  );
}
