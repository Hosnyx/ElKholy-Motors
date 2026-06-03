/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, Printer, Shield, BadgeCheck, Zap, Gauge, Award, Eye } from 'lucide-react';
import { Motorcycle } from '../types';

interface PdfModalProps {
  bike: Motorcycle;
  onClose: () => void;
}

export default function PdfModal({ bike, onClose }: PdfModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    
    // Simulate high-speed military satellite downlink of document
    setTimeout(() => {
      // Build text catalog representation
      const fileContent = `========================================================================
            E L K H O L Y   M O T O R S   -   C A T A L O G   2 0 2 6
                      " R I D E   T H E   F U T U R E "
========================================================================

VEHICLE CLASSIFICATION: ${bike.categoryName.toUpperCase()} SERIES
MACHINE MODEL: ${bike.name.toUpperCase()}
SLOGAN DIRECTIVE: "${bike.tagline.toUpperCase()}"
ESTIMATED DEALER COST: ${bike.price}

------------------------------------------------------------------------
                       PRODUCT BRIEF & SYNOPSIS
------------------------------------------------------------------------
${bike.longDesc}

------------------------------------------------------------------------
                  ENGINE & PROPULSION SPECIFICATIONS
------------------------------------------------------------------------
* DRIVE POWERPLANT: ${bike.specs.engine}
* REGISTERED TOP SPEED: ${bike.specs.topSpeed}
* POWER CAP: ${bike.specs.power}
* HYBRID CO-PROPULSION FUEL / ELEC CONSUMPTION: ${bike.specs.fuelConsumption}
* CHASSIS KERB WEIGHT: ${bike.specs.weight}

------------------------------------------------------------------------
                       CHASSIS & INTEGRATIONS
------------------------------------------------------------------------
* High-integrity carbon-monocoque weight-distribution frame.
* Smart neural smartphone linkages and HUD helmet diagnostics.
* 3-Year Unlimited Mile Electric Powertrain Cairo-Warrantee.

========================================================================
REGISTER YOUR INTERACTIVE ORDER ONLINE OR VIA SECURE WHATSAPP PORTAL
              Plot 18, Royal Zone, Fifth Settlement, Cairo
========================================================================`;

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ElKholy_Motors_Catalog_${bike.name.replace(/\s+/g, '_')}.text`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloadComplete(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      
      {/* Outer wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl h-[90vh] glass-panel border border-brand-accent/30 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
      >
        
        {/* Glow halo header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5 bg-[#0B0F1A]/80 z-10">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-brand-accent animate-pulse" />
            <div>
              <h3 className="text-sm font-mono text-white tracking-widest font-bold uppercase">
                HOLOGRAPHIC <span className="text-brand-accent">PDF VIEWER</span>
              </h3>
              <p className="font-mono text-[10px] text-gray-500 uppercase">DOC ID: EM-CATALOG-{bike.id.toUpperCase()}-2026</p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-widest cursor-pointer hover:brightness-110 active:scale-95 transition-all text-black bg-brand-accent flex items-center gap-2 ${
                downloading ? 'opacity-80 animate-pulse' : ''
              }`}
            >
              {downloading ? (
                <span>DOWNLOADING...</span>
              ) : downloadComplete ? (
                <span className="text-[#0B0F1A] flex items-center gap-1">✔ DOWNLOADED</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD CATALOG</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Virtual PDF Paper Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#0F172A]/40 flex justify-center items-start">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl p-6 md:p-12 shadow-2xl relative border border-slate-300 font-sans overflow-hidden min-h-[900px] flex flex-col justify-between">
            
            {/* Holographic grid scan lines on paper */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-slate-100/50 rounded-2xl" />
            
            {/* watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 font-mono text-[4rem] text-slate-100 font-black tracking-[0.5em] select-none pointer-events-none uppercase">
              ELKHOLY
            </div>

            {/* Document Header */}
            <div>
              <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-8">
                <div>
                  <h4 className="text-2xl font-black tracking-tight text-slate-800">ELKHOLY MOTORS</h4>
                  <p className="text-[9px] font-mono tracking-[0.3em] font-bold text-indigo-600 uppercase">Ride the Future</p>
                  <p className="text-xs text-slate-400 mt-1">Plot 18, Fifth Settlement, New Cairo, Egypt</p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-tight">
                  <p className="font-bold text-slate-800">SPEC SUMMARY</p>
                  <p>CLASS: {bike.categoryName.toUpperCase()}</p>
                  <p>YEAR CODE: 2026-SYS</p>
                  <p>STATUS: VERIFIED</p>
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-3 mb-8">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-mono font-bold tracking-widest uppercase">
                  TECHNICAL SPECIFICATION BROCHURE
                </span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight mt-1">
                  {bike.name}
                </h1>
                <p className="text-sm font-semibold italic text-indigo-600 font-mono">
                  "{bike.tagline}"
                </p>
              </div>

              {/* Photo representation in catalog */}
              <div className="w-full h-56 bg-slate-50 rounded-xl mb-8 flex items-center justify-center border border-slate-200 p-4 relative overflow-hidden group">
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-mono rounded">
                  HOLOGRAPHIC VECTOR EMBED
                </div>
                <img
                  src={bike.image}
                  alt={bike.name}
                  referrerPolicy="no-referrer"
                  className="h-full object-contain filter grayscale saturate-50 contrast-125"
                />
              </div>

              {/* Specs detailed grid */}
              <div className="space-y-4 mb-8">
                <h5 className="font-mono text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-1">
                  1. PROPULSION & ENGINES MATRIX
                </h5>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div className="flex border-b border-slate-100 py-1.5 justify-between pr-3">
                    <span className="text-slate-500 font-medium">Core Drive Engine:</span>
                    <span className="font-mono font-bold text-slate-800">{bike.specs.engine}</span>
                  </div>
                  <div className="flex border-b border-slate-100 py-1.5 justify-between">
                    <span className="text-slate-500 font-medium">Guaranteed Top Velocity:</span>
                    <span className="font-mono font-bold text-slate-800">{bike.specs.topSpeed}</span>
                  </div>
                  <div className="flex border-b border-slate-100 py-1.5 justify-between pr-3">
                    <span className="text-slate-500 font-medium">Power Rating / Torque:</span>
                    <span className="font-mono font-bold text-slate-800">{bike.specs.power}</span>
                  </div>
                  <div className="flex border-b border-slate-100 py-1.5 justify-between">
                    <span className="text-slate-500 font-medium">Fuel / Energy Cost:</span>
                    <span className="font-mono font-bold text-slate-800">{bike.specs.fuelConsumption}</span>
                  </div>
                  <div className="col-span-2 flex border-b border-slate-100 py-1.5 justify-between">
                    <span className="text-slate-500 font-medium">Net Vehicle Chassis Mass:</span>
                    <span className="font-mono font-bold text-slate-800">{bike.specs.weight}</span>
                  </div>
                </div>
              </div>

              {/* Long Description and Brand Warranty summary */}
              <div className="space-y-3 mb-8">
                <h5 className="font-mono text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-1">
                  2. DESIGN OBJECTIVES & CORE UTILITY
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {bike.longDesc}
                </p>
              </div>

              {/* Guarantees row in grid */}
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-800">3-Year Cyber Warrantee</span>
                    <span>Guarantees complete state-of-the-art power pack replacements.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BadgeCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-800">Holographic Telemetry</span>
                    <span>Fully synced telemetry telemetry system with legal HUD display link.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-5 mt-8 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>ELKHOLY MOTORS INC. 2026</span>
              <span>PAGE 1 OF 1 SPEC SHEET</span>
              <span className="text-indigo-600 font-bold">STAMP SIGNED OFF</span>
            </div>

          </div>
        </div>

        {/* Floating print simulation prompt header */}
        <div className="bg-[#070A11] p-4 text-center text-xs font-mono border-t border-white/[0.08] text-gray-500 flex justify-between items-center px-6">
          <span>* Specifications list represents simulated 2026 technical guidelines.</span>
          <button
            onClick={() => window.print()}
            className="text-brand-accent hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT THIS HOLOGRAPHE</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
