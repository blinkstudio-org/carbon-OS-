/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { ReceiptScannerResult } from "../types";
import { 
  Scan, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  Leaf, 
  RotateCcw, 
  Receipt,
  FileText
} from "lucide-react";

export default function ReceiptScanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptScannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startAnalysis = async (payload: { image?: string; textInput?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ocr-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Failed to process receipt on carbonOS servers.");
      }
      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred during OCR recognition.");
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
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const runSimulation = (receiptType: "grocery" | "retail" | "commute") => {
    let mockText = "";
    if (receiptType === "grocery") {
      mockText = "WHOLE FOODS\nDATE: 06/08/2026\n1x Imported Ribeye Beef Steak $18.50\n2x Organic Fuji Apples $4.98\n1x Bottle Cabernet Sauvignon $14.99\n12x Pack Plastic Bottled Water $6.99";
    } else if (receiptType === "retail") {
      mockText = "PATAGONIA RECYCLED COTTON\nDATE: 05/12/2026\n1x Cotton Recycled Synchilla Fleece Jacket $139.00\n1x Polyester Outdoor Running shirt $45.00";
    } else if (receiptType === "commute") {
      mockText = "CORRIDOR GASOLINE DEPOT\nDATE: 06/01/2026\n12.5 Gallons Unleaded Gasoline 87 octane $48.20";
    }
    startAnalysis({ textInput: mockText });
  };

  return (
    <div id="receipt_scanner_panel" className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm relative">
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      
      <div className="flex items-center space-x-2.5 mb-4">
        <span className="h-9 w-9 rounded-xl bg-cyan-50 border border-cyan-150 flex items-center justify-center text-cyan-600">
          <Scan className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">AI Receipt Scanner</h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">OCR EMISSIONS ESTIMATE PIPELINE</p>
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
            aria-label="Upload receipt image. Drag your receipt file here or click to browse and select files"
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col justify-center items-center text-center transition-all min-h-[140px] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
              dragActive 
                ? "border-cyan-400 bg-cyan-50 shadow-inner" 
                : "border-slate-200 hover:border-slate-350 bg-slate-50 focus:border-slate-350"
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
            />
            <Upload className="h-8 w-8 text-cyan-600 mb-2 animate-bounce" />
            <span className="text-xs font-bold text-slate-700">Drag receipt photo, or tap to choose file</span>
            <span className="text-[10px] text-slate-450 mt-1">Supports PNG, JPG, or PDF</span>
          </div>

          {/* Test Simulation trigger options */}
          <div className="space-y-1.5 pt-1.5">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Sandbox Fast Testing simulations</span>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => runSimulation("grocery")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] py-2 px-2.5 rounded-xl font-medium cursor-pointer transition-all active:scale-95 text-center flex flex-col items-center gap-1"
              >
                <span>🥩</span>
                Grocery Beef
              </button>
              <button 
                onClick={() => runSimulation("retail")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] py-2 px-2.5 rounded-xl font-medium cursor-pointer transition-all active:scale-95 text-center flex flex-col items-center gap-1"
              >
                <span>🧥</span>
                Cotton Jacket
              </button>
              <button 
                onClick={() => runSimulation("commute")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] py-2 px-2.5 rounded-xl font-medium cursor-pointer transition-all active:scale-95 text-center flex flex-col items-center gap-1"
              >
                <span>⛽</span>
                Gas Fillup
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 space-y-3">
          <div className="relative flex justify-center">
            <span className="animate-spin text-2xl h-8 w-8 rounded-full border-t-2 border-cyan-500 flex items-center justify-center text-cyan-500">
              <Scan className="h-4 w-4 animate-pulse" />
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider animate-pulse">Scanning receipts via OCR & model scoring...</p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Execution feedback limit:</span>
            <p className="font-sans leading-relaxed text-[11px]">{error}</p>
            <button 
              onClick={() => setResult(null)} 
              className="mt-1 text-[10px] font-mono uppercase bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded transition-all cursor-pointer font-bold"
            >
              Reset Scanner
            </button>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5 animate-fade-in text-xs">
          <div className="flex justify-between items-start border-b border-slate-200/60 pb-2.5">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">ESTIMATION INDEX</span>
              <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1 mt-0.5">
                <Receipt className="h-3.5 w-3.5 text-cyan-600" />
                {(result as any).storeName || (result as any).merchant || "Extracted Receipt"}
              </h4>
              <p className="text-[9px] text-[#888888] font-mono mt-0.5">{result.date || "Unknown cycle"}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-mono">EMISSIONS WEIGHT</span>
              <span className="text-cyan-600 font-extrabold text-sm font-mono">{result.totalCo2 ?? (result as any).co2SavedEstimate ?? 0} kg CO₂</span>
            </div>
          </div>

          <div className="space-y-1.5 font-sans">
            <h5 className="text-[10px] uppercase font-mono font-extrabold text-slate-450 tracking-wider">Identified items and weights</h5>
            <div className="space-y-1 text-[11px] max-h-[140px] overflow-y-auto pr-1">
              {(result.items || []).map((item, i) => (
                <div key={i} className="flex justify-between bg-white border border-slate-100 p-2.5 rounded-lg font-sans">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 font-bold">{item.name}</span>
                    <span className="text-[9px] text-slate-400 block font-mono">
                      Intensity: <strong className="text-xs uppercase font-extrabold text-slate-500">{item.carbonIntensity || (item as any).category || "low"}</strong>
                    </span>
                  </div>
                  <div className="text-right font-mono font-semibold">
                    <span className="text-slate-700">{item.estimatedCo2 ?? (item as any).weightCo2 ?? 0} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-lg text-[11px] flex gap-2.5 items-start">
            <Leaf className="h-4 w-4 text-cyan-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 rounded-sm">
              <span className="font-bold text-cyan-800 block">AI Recommendation</span>
              <p className="text-cyan-700 leading-relaxed font-sans font-medium">{result.aiFootprintAnalysis || (result as any).advice || "No suggestion found."}</p>
              {result.sustainableAlternatives && (
                <p className="text-cyan-600 leading-relaxed font-sans text-[10px] mt-1 italic border-t border-cyan-100 pt-1">{result.sustainableAlternatives}</p>
              )}
            </div>
          </div>

          <button 
            onClick={() => setResult(null)} 
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-250 text-slate-700 font-bold rounded-xl transition-all font-mono text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset & Scan another receipt
          </button>
        </div>
      )}
    </div>
  );
}
