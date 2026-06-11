/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Patient, WardBed, Staff, Prescription, DiagnosticTest, 
  TheatreCase, Invoice, AuditLog, VitalSign, MedicalRecord 
} from "./types/hospital";
import { 
  initialPatients, initialBeds, initialStaff, initialVitals, 
  initialNotes, initialPrescriptions, initialDiagnostics, 
  initialTheatreCases, initialInvoices, initialAuditLogs 
} from "./data/mockData";

// Import modules
import PASModule from "./modules/PASModule";
import EHRModule from "./modules/EHRModule";
import WardModule from "./modules/WardModule";
import MedicationModule from "./modules/MedicationModule";
import DiagnosticsModule from "./modules/DiagnosticsModule";
import TheatreModule from "./modules/TheatreModule";
import BillingModule from "./modules/BillingModule";
import StaffModule from "./modules/StaffModule";
import GovernanceModule from "./modules/GovernanceModule";
import DashboardModule from "./modules/DashboardModule";
import ArchModule from "./modules/ArchModule";

// UI Layout Icons
import { 
  LayoutDashboard, UserPlus, FileText, BedDouble, Pill, 
  FlaskConical, Scissors, Landmark, Briefcase, KeyRound, 
  Cpu, HeartPulse, ShieldAlert, LogOut, Activity 
} from "lucide-react";

type ActiveView = 
  | "Dashboard" | "PAS" | "EHR" | "Ward" | "Medication" 
  | "Diagnostics" | "Theatre" | "Billing" | "Staff" 
  | "Governance" | "Architecture";

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveView>("Dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-1");

  // Main synchronized medical databases
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [beds, setBeds] = useState<WardBed[]>(initialBeds);
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff);
  const [vitals, setVitals] = useState<VitalSign[]>(initialVitals);
  const [notes, setNotes] = useState<MedicalRecord[]>(initialNotes);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>(initialDiagnostics);
  const [theatreCases, setTheatreCases] = useState<TheatreCase[]>(initialTheatreCases);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Helper: Append cryptographic mock audit trails
  const handleAddAuditLog = (actionType: AuditLog["actionType"], moduleName: string, details: string) => {
    const timestampStr = new Date().toISOString();
    const hashSeed = `${actionType}-${moduleName}-${details}-${timestampStr}`;
    
    // Simulate SHA-256 local hash algorithm
    let hash = 0;
    for (let i = 0; i < hashSeed.length; i++) {
      const char = hashSeed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const finalHash = Math.abs(hash).toString(16).padStart(16, "f") + "7d9a11ef";

    const newLog: AuditLog = {
      id: "aud-" + Date.now(),
      timestamp: timestampStr,
      userId: "tom@ahyx.org",
      userName: "Director Tom (Administrator)",
      userRole: "System Admin",
      actionType,
      moduleName,
      details,
      hash: finalHash
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper: Quick navigation link with chart pointer
  const handleSelectPatientAndView = (patientId: string, targetModule?: string) => {
    setSelectedPatientId(patientId);
    if (targetModule) {
      setActiveModule(targetModule as ActiveView);
    }
    handleAddAuditLog("READ", "EHR", `Accessed EHR clinical charts for Patient ID: ${patientId}.`);
  };

  // PAS Module Handlers
  const handleAddPatient = (newPat: Patient) => {
    setPatients(prev => [...prev, newPat]);
  };

  const handleMergePatients = (idToKeep: string, idToRemove: string, mergedData: Patient) => {
    setPatients(prev => prev.filter(p => p.id !== idToRemove).map(p => p.id === idToKeep ? mergedData : p));
  };

  // EHR Observation Handlers
  const handleAddVital = (newV: VitalSign) => {
    setVitals(prev => [newV, ...prev]);
  };

  const handleAddNote = (newN: MedicalRecord) => {
    setNotes(prev => [newN, ...prev]);
  };

  // Ward & Bed Management Handlers
  const handleUpdateBeds = (updatedBeds: WardBed[]) => {
    setBeds(updatedBeds);
  };

  const handleUpdatePatientTimeline = (patientId: string, timelineItem: { id: string; timestamp: string; type: any; description: string; author: string }) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          timeline: [timelineItem, ...p.timeline]
        };
      }
      return p;
    }));
  };

  // Discharge billing: Raise structured private invoice dynamically based on inpatient record details
  const handleInitiateDischargeInvoice = (patientId: string) => {
    const p = patients.find(pat => pat.id === patientId);
    if (!p) return;

    // Simulate itemized private healthcare billing totals
    const draftInvoice: Invoice = {
      id: "inv-" + Date.now(),
      patientId: p.id,
      billingRef: "HOS-2026-" + Math.floor(1000 + Math.random() * 9000),
      status: "Draft",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days
      insurerName: p.insurance.provider as any,
      items: [
        { description: "Standard Private Ward Bed Day Surcharge (3 Inpatient Nights @ £650/night)", grossCost: 1950, vatRate: 0, vatAmount: 0 },
        { description: "Total Theatre Surcharge: Anaesthetics & Consultant Surgeons list dues", grossCost: 2850, vatRate: 0, vatAmount: 0 },
        { description: "Clinical GPhC Pharmacy dispensing and medication reconciliation charges", grossCost: 320, vatRate: 0, vatAmount: 0 }
      ],
      payments: []
    };

    setInvoices(prev => [draftInvoice, ...prev]);
    handleAddAuditLog("CREATE", "Billing & Finance", `Created dynamic ledger invoice ${draftInvoice.billingRef} for patient ${p.fullName} post operational discharge.`);
  };

  // Medication Handlers
  const handleAddPrescription = (rx: Prescription) => {
    setPrescriptions(prev => [rx, ...prev]);
  };

  const handleAdministerPrescription = (rxId: string, log: { administeredAt: string; administeredBy: string; status: "Administered" | "Refused" | "Omitted" }) => {
    setPrescriptions(prev => prev.map(r => {
      if (r.id === rxId) {
        return {
          ...r,
          administrationLogs: [...r.administrationLogs, log]
        };
      }
      return r;
    }));
  };

  // Diagnostics Handlers
  const handleAddDiagnostic = (test: DiagnosticTest) => {
    setDiagnostics(prev => [test, ...prev]);
  };

  const handleUpdateDiagnostics = (tests: DiagnosticTest[]) => {
    setDiagnostics(tests);
  };

  // Theatre Handlers
  const handleAddTheatreCase = (tcase: TheatreCase) => {
    setTheatreCases(prev => [tcase, ...prev]);
  };

  const handleUpdateTheatreCases = (tcases: TheatreCase[]) => {
    setTheatreCases(tcases);
  };

  // Billing Handlers
  const handleUpdateInvoices = (invs: Invoice[]) => {
    setInvoices(invs);
  };

  // HR Staff Handlers
  const handleUpdateStaff = (list: Staff[]) => {
    setStaffList(list);
  };

  // Financial aggregates
  const totalBilledGross = invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + item.grossCost + item.vatAmount, 0);
  }, 0);
  const totalCollected = invoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((paySum, p) => paySum + p.amount, 0);
  }, 0);

  return (
    <div className="flex h-screen bg-[#050505] text-[#e5e7eb] overflow-hidden font-sans select-none" id="hospitalos-root-shell">
      {/* LEFT PRIMARY SYSTEM SIDEBAR */}
      <aside className="w-64 bg-[#0a0a0a] text-white flex flex-col justify-between hidden md:flex border-r border-white/10">
        <div>
          {/* Brand block header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-teal-500 rounded-sm flex items-center justify-center font-bold text-black font-serif italic">
              H
            </div>
            <div>
              <h1 className="text-sm font-serif italic tracking-tight text-white leading-none">HOSPITALOS</h1>
              <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider block mt-1">EHR-HIS Command Center</span>
            </div>
          </div>

          {/* Module Nav Links */}
          <nav className="px-4 py-2 space-y-4 overflow-y-auto max-h-[72vh]">
            <div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 pl-3">Standard Operations</div>
              <div className="space-y-1">
                <button 
                  id="sidebar-dashboard"
                  onClick={() => setActiveModule("Dashboard")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Dashboard" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Command Center</span>
                </button>
                
                <button 
                  id="sidebar-pas"
                  onClick={() => setActiveModule("PAS")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "PAS" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Patient Admin (PAS)</span>
                </button>

                <button 
                  id="sidebar-ehr"
                  onClick={() => setActiveModule("EHR")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "EHR" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Clinical Records (EHR)</span>
                </button>

                <button 
                  id="sidebar-ward"
                  onClick={() => setActiveModule("Ward")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Ward" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <BedDouble className="h-4 w-4" />
                  <span>Ward & Bed Control</span>
                </button>

                <button 
                  id="sidebar-theatre"
                  onClick={() => setActiveModule("Theatre")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Theatre" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <Scissors className="h-4 w-4" />
                  <span>Operating Theatres</span>
                </button>

                <button 
                  id="sidebar-diagnostics"
                  onClick={() => setActiveModule("Diagnostics")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Diagnostics" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <FlaskConical className="h-4 w-4" />
                  <span>Diagnostics & Lab</span>
                </button>

                <button 
                  id="sidebar-medication"
                  onClick={() => setActiveModule("Medication")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Medication" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <Pill className="h-4 w-4" />
                  <span>Pharmacy & eMAR</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 pl-3">Corporate & Governance</div>
              <div className="space-y-1">
                <button 
                  id="sidebar-billing"
                  onClick={() => setActiveModule("Billing")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Billing" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <Landmark className="h-4 w-4" />
                  <span>Finance & Claims</span>
                </button>

                <button 
                  id="sidebar-staff"
                  onClick={() => setActiveModule("Staff")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Staff" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>HR & Staff Rotas</span>
                </button>

                <button 
                  id="sidebar-governance"
                  onClick={() => setActiveModule("Governance")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Governance" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Compliance & Audit</span>
                </button>

                <button 
                  id="sidebar-architecture"
                  onClick={() => setActiveModule("Architecture")}
                  className={`w-full py-1.5 text-xs transition-all text-left flex items-center gap-3 ${activeModule === "Architecture" ? "text-teal-400 border-l-2 border-teal-400 pl-3 font-medium bg-transparent" : "text-gray-400 pl-3.5 hover:text-white cursor-pointer bg-transparent"}`}
                >
                  <Cpu className="h-4 w-4" />
                  <span>System Architecture</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer profile area */}
        <div className="mt-auto p-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-teal-700 to-slate-900 border border-white/20 flex items-center justify-center font-bold text-teal-200 text-sm">
              DS
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Dr. Tom Sinclair</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider truncate">Chief Medical Officer</p>
            </div>
          </div>
          <button id="btn-logout-mock" title="Logout session" className="hover:text-rose-400 transition ml-2">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE / CONTENT PANEL */}
      <main className="flex-grow flex flex-col h-full overflow-hidden bg-[#050505]">
        {/* TOP SYSTEM CONTROL HEADER */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-[0.2em]">Private Facility ID:</span> <span className="text-xs font-mono text-white">UK-WAL-100-B</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex items-center gap-2 hidden lg:flex">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs font-mono text-gray-400 uppercase tracking-tighter">System Sync: 0.2ms</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-[11px] text-gray-400 font-semibold hidden md:flex items-center gap-3 font-mono">
              <span>Census: <span className="text-white">{patients.length}</span></span>
              <span>• Active: <span className="text-teal-400">{beds.filter(b=>b.status==="Occupied").length}/100</span></span>
            </div>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-teal-400">
              {activeModule}
            </span>
          </div>
        </header>

        {/* INNER DYNAMIC SCROLL CONTAINER */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
          {/* Main conditional module router */}
          {activeModule === "Dashboard" && (
            <DashboardModule 
              totalPatients={patients.length} 
              occupancyBedsCount={beds.filter(b => b.status === "Occupied").length}
              totalBedsCount={beds.length}
              totalBilledGross={totalBilledGross}
              totalCollected={totalCollected}
            />
          )}

          {activeModule === "PAS" && (
            <PASModule 
              patients={patients} 
              onAddPatient={handleAddPatient} 
              onSelectPatient={handleSelectPatientAndView}
              onAddAuditLog={handleAddAuditLog}
              onMergePatients={handleMergePatients}
            />
          )}

          {activeModule === "EHR" && (
            <EHRModule 
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={(id) => setSelectedPatientId(id)}
              vitals={vitals}
              onAddVital={handleAddVital}
              notes={notes}
              onAddNote={handleAddNote}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Ward" && (
            <WardModule 
              patients={patients}
              beds={beds}
              onUpdateBeds={handleUpdateBeds}
              onAddAuditLog={handleAddAuditLog}
              onUpdatePatientTimeline={handleUpdatePatientTimeline}
              onInitiateDischargeInvoice={handleInitiateDischargeInvoice}
            />
          )}

          {activeModule === "Medication" && (
            <MedicationModule 
              patients={patients}
              selectedPatientId={selectedPatientId}
              prescriptions={prescriptions}
              onAddPrescription={handleAddPrescription}
              onAdministerPrescription={handleAdministerPrescription}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Diagnostics" && (
            <DiagnosticsModule 
              patients={patients}
              selectedPatientId={selectedPatientId}
              diagnostics={diagnostics}
              onAddDiagnostic={handleAddDiagnostic}
              onUpdateDiagnostics={handleUpdateDiagnostics}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Theatre" && (
            <TheatreModule 
              patients={patients}
              theatreCases={theatreCases}
              onAddTheatreCase={handleAddTheatreCase}
              onUpdateTheatreCases={handleUpdateTheatreCases}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Billing" && (
            <BillingModule 
              patients={patients}
              invoices={invoices}
              onUpdateInvoices={handleUpdateInvoices}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Staff" && (
            <StaffModule 
              staffList={staffList}
              onUpdateStaff={handleUpdateStaff}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Governance" && (
            <GovernanceModule 
              auditLogs={auditLogs}
              onAddAuditLog={handleAddAuditLog}
            />
          )}

          {activeModule === "Architecture" && (
            <ArchModule />
          )}
        </div>
      </main>
    </div>
  );
}
