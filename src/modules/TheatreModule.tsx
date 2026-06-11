import React, { useState } from "react";
import { Patient, TheatreCase, AuditLog } from "../types/hospital";
import { 
  Activity, ClipboardList, PenTool, ShieldAlert, CheckCircle2, 
  Clock, Plus, ShieldCheck, ShoppingCart, HelpCircle 
} from "lucide-react";

interface TheatreProps {
  patients: Patient[];
  theatreCases: TheatreCase[];
  onAddTheatreCase: (tcase: TheatreCase) => void;
  onUpdateTheatreCases: (tcases: TheatreCase[]) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

export default function TheatreModule({ 
  patients, 
  theatreCases, 
  onAddTheatreCase, 
  onUpdateTheatreCases,
  onAddAuditLog
}: TheatreProps) {
  const [activeTab, setActiveTab] = useState<"whiteboard" | "schedule">("whiteboard");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  // Scheduling Form
  const [patientId, setPatientId] = useState("");
  const [surgeon, setSurgeon] = useState("Mr. Jonathan Carter");
  const [anaesthetist, setAnaesthetist] = useState("Dr. Simon Rattle");
  const [procedureName, setProcedureName] = useState("");
  const [theatreName, setTheatreName] = useState<TheatreCase["theatreName"]>("Operating Theatre 1");
  const [duration, setDuration] = useState(60);
  const [anaestheticType, setAnaestheticType] = useState<TheatreCase["anaestheticType"]>("General");

  // WHO Checklist State (Simulation)
  const [whoSignIn, setWhoSignIn] = useState(false);
  const [whoTimeOut, setWhoTimeOut] = useState(false);
  const [whoSignOut, setWhoSignOut] = useState(false);
  const [implantId, setImplantId] = useState("");
  const [surgicalComplications, setSurgicalComplications] = useState("");

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !procedureName) {
      alert("Please specify a patient and the planned surgical procedure.");
      return;
    }

    const newCase: TheatreCase = {
      id: "tc-" + Date.now(),
      patientId,
      surgeonName: surgeon,
      anaesthetistName: anaesthetist,
      procedureName,
      theatreName,
      timestamp: new Date().toISOString(),
      durationMins: duration,
      status: "Scheduled",
      anaestheticType,
      consumablesUsed: ["Surgical drape", "Saline wash 1L", "Skin prep solution"]
    };

    onAddTheatreCase(newCase);

    const pat = patients.find(p => p.id === patientId);
    if (pat) {
      pat.timeline.unshift({
        id: "t-tc-" + Date.now(),
        timestamp: new Date().toISOString(),
        type: "Clinical Note",
        description: `Surgical procedure scheduled: ${newCase.procedureName} (Theatre: ${newCase.theatreName}, Surgeon: ${newCase.surgeonName}).`,
        author: "Theatre Scheduling Office"
      });
    }

    onAddAuditLog("CREATE", "Theatre Management", `Scheduled operating list case for patient ${pat?.fullName}: ${procedureName}`);
    
    // Reset Form
    setPatientId("");
    setProcedureName("");
    alert("Surgical case successfully added to the operating slate.");
    setActiveTab("whiteboard");
  };

  const handleAdvanceState = (caseId: string, nextStatus: TheatreCase["status"]) => {
    const updated = theatreCases.map(tc => {
      if (tc.id === caseId) {
        let updates: Partial<TheatreCase> = { status: nextStatus };
        
        // Include implant logs if available on discharge/compliance seal
        if (nextStatus === "Discharged to Ward" && implantId) {
          updates.implantTracked = implantId;
        }
        if (surgicalComplications) {
          updates.complications = surgicalComplications;
        }

        return { ...tc, ...updates };
      }
      return tc;
    });

    onUpdateTheatreCases(updated);
    
    const target = theatreCases.find(tc => tc.id === caseId);
    const patObj = patients.find(p => p.id === target?.patientId);
    
    if (patObj && target) {
      patObj.timeline.unshift({
        id: "t-tcupd-" + Date.now(),
        timestamp: new Date().toISOString(),
        type: "Clinical Note",
        description: `Surgical case advanced to status: ${nextStatus}. Procedure: ${target.procedureName}.`,
        author: "Operating Room Coordinator"
      });
    }

    onAddAuditLog("UPDATE", "Theatre Management", `Advanced surgical case status to '${nextStatus}' for patient ${patObj?.fullName || "Anonymous"}`);
    
    // Reset WHO Checklist for next interactions
    if (nextStatus === "Discharged to Ward") {
      setWhoSignIn(false);
      setWhoTimeOut(false);
      setWhoSignOut(false);
      setImplantId("");
      setSurgicalComplications("");
      setSelectedCaseId("");
    }
  };

  const activeCase = theatreCases.find(tc => tc.id === selectedCaseId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800" id="theatre-module-grid">
      {/* COLUMN 1: CONTROLS & SCHEDULER */}
      <div className="lg:col-span-1 space-y-4">
        {/* Module Sidebar */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Theatre Slates</label>
          <div className="space-y-1.5 pt-1.5">
            <button
              id="btn-theatre-tab-whiteboard"
              onClick={() => { setActiveTab("whiteboard"); setSelectedCaseId(""); }}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-left flex items-center justify-between ${activeTab === "whiteboard" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>Operating Board</span>
              <Clock className="h-4 w-4" />
            </button>
            <button
              id="btn-theatre-tab-schedule"
              onClick={() => { setActiveTab("schedule"); setSelectedCaseId(""); }}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-left flex items-center justify-between ${activeTab === "schedule" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>Schedule Elective Case</span>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ACTIVE CASE SHORT SUMMARY */}
        {activeTab === "whiteboard" && activeCase && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-4">
            <div>
              <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded uppercase">
                Active Theatre Monitor
              </span>
              <h4 className="text-[15px] font-bold text-slate-900 mt-1.5 leading-tight">{activeCase.procedureName}</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Patient: {patients.find(p => p.id === activeCase.patientId)?.fullName || "Simulated Clinical Profile"}</p>
            </div>

            {/* WHO CHECKLIST PANELS */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">WHO Surgical Safety Checklist</span>
              
              <label className="flex items-center space-x-2 text-xs text-slate-700 select-none cursor-pointer">
                <input 
                  id="who-sign-in"
                  type="checkbox"
                  checked={whoSignIn}
                  disabled={activeCase.status !== "Scheduled" && activeCase.status !== "Pre-Op Assessment"}
                  onChange={(e) => setWhoSignIn(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className={whoSignIn ? "line-through text-slate-400 font-medium" : "font-bold text-slate-700"}>
                  1. Sign-In (Anesthesia Check)
                </span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 select-none cursor-pointer">
                <input 
                  id="who-time-out"
                  type="checkbox"
                  checked={whoTimeOut}
                  disabled={activeCase.status !== "In Surgery"}
                  onChange={(e) => setWhoTimeOut(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className={whoTimeOut ? "line-through text-slate-400 font-medium" : "font-bold text-slate-700"}>
                  2. Time-Out (Incision Pause)
                </span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 select-none cursor-pointer">
                <input 
                  id="who-sign-out"
                  type="checkbox"
                  checked={whoSignOut}
                  disabled={activeCase.status !== "Recovery"}
                  onChange={(e) => setWhoSignOut(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className={whoSignOut ? "line-through text-slate-400 font-medium" : "font-bold text-slate-700"}>
                  3. Sign-Out (Count Check)
                </span>
              </label>
            </div>

            {/* Surgical Implant Logs */}
            {activeCase.status === "Recovery" && (
              <div className="space-y-2 border-t pt-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Orthopaedic Implant Barcode</span>
                <input
                  id="theatre-implant-input"
                  type="text"
                  placeholder="e.g. Striker Lot #4829103"
                  value={implantId}
                  onChange={(e) => setImplantId(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs text-slate-800 border rounded outline-none"
                />
              </div>
            )}

            {/* Advance Case Stage Actions */}
            <div className="border-t border-slate-100 pt-3 flex justify-end">
              {activeCase.status === "Scheduled" && (
                <button
                  id="btn-theatre-preop"
                  onClick={() => handleAdvanceState(activeCase.id, "Pre-Op Assessment")}
                  className="w-full py-1.5 bg-cyan-700 text-white font-bold text-xs rounded shadow-xs"
                >
                  Initiate Pre-Op Assessment
                </button>
              )}
              {activeCase.status === "Pre-Op Assessment" && (
                <button
                  id="btn-theatre-surgery"
                  onClick={() => {
                    if (!whoSignIn) { alert("WHO Surgical Safety 'Sign-In' checklists must be certified before anesthesia induction."); return; }
                    handleAdvanceState(activeCase.id, "In Surgery");
                  }}
                  className="w-full py-1.5 bg-rose-600 text-white font-bold text-xs rounded shadow-xs"
                >
                  Induct Patient (To Theatre)
                </button>
              )}
              {activeCase.status === "In Surgery" && (
                <button
                  id="btn-theatre-recovery"
                  onClick={() => {
                    if (!whoTimeOut) { alert("WHO 'Time-Out' safety checks must be certified before surgical incision."); return; }
                    handleAdvanceState(activeCase.id, "Recovery");
                  }}
                  className="w-full py-1.5 bg-amber-600 text-white font-bold text-xs rounded shadow-xs"
                >
                  Transfer to PACU Recovery Rooms
                </button>
              )}
              {activeCase.status === "Recovery" && (
                <button
                  id="btn-theatre-discharge"
                  onClick={() => {
                    if (!whoSignOut) { alert("WHO safety count and instrument 'Sign-Out' checks must be confirmed."); return; }
                    handleAdvanceState(activeCase.id, "Discharged to Ward");
                  }}
                  className="w-full py-1.5 bg-emerald-600 text-white font-bold text-xs rounded shadow-xs"
                >
                  Seal & Discharge to Recovery Wards
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CORE INTERFACE PANELS (RIGHT 2 COLUMNS) */}
      <div className="lg:col-span-2">
        {/* TAB 1: OPERATING BOARD WHITEBOARD */}
        {activeTab === "whiteboard" && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Active Operating List Whiteboard</h3>
            
            {theatreCases.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No active surgeries scheduled for today.</div>
            ) : (
              <div className="space-y-3">
                {theatreCases.map((tc) => {
                  const patientObj = patients.find(p => p.id === tc.patientId);
                  const isSelected = selectedCaseId === tc.id;
                  
                  return (
                    <div 
                      key={tc.id} 
                      onClick={() => setSelectedCaseId(tc.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 ${isSelected ? "bg-cyan-50/20 border-cyan-300 ring-1 ring-cyan-200" : "bg-white border-slate-150"}`}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                          <span>{tc.procedureName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            tc.status === "Scheduled" ? "bg-slate-100 text-slate-600" :
                            tc.status === "Pre-Op Assessment" ? "bg-cyan-50 text-cyan-700" :
                            tc.status === "In Surgery" ? "bg-rose-50 text-rose-700 animate-pulse" :
                            tc.status === "Recovery" ? "bg-amber-50 text-amber-700" :
                            "bg-emerald-50 text-emerald-700"
                          }`}>
                            {tc.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Patient: <span className="font-semibold text-slate-700">{patientObj?.fullName || "Unscheduled Profile"}</span> • Suite: <span className="font-semibold text-slate-700">{tc.theatreName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Surgeon: {tc.surgeonName} • Anaesthetist: {tc.anaesthetistName} • Route: {tc.anaestheticType}
                        </div>
                        {tc.implantTracked && (
                          <div className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded inline-block mt-1">
                            Implant: {tc.implantTracked}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right text-xs">
                        <span className="text-[10px] text-slate-400 block font-bold">Planned Duration</span>
                        <span className="font-bold text-slate-700 mt-1 block">{tc.durationMins} Mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ELECTIVE CASE SCHEDULER FORM */}
        {activeTab === "schedule" && (
          <form onSubmit={handleCreateCase} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Schedule Surgical Operational Case</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Patient File</label>
                <select
                  id="sched-patient-select"
                  value={patientId}
                  required
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded outline-none font-sans"
                >
                  <option value="">-- Choose Profile --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} (Born {p.dob})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Planned Surgical Procedure (OPCS-4 matched)</label>
                <input 
                  id="sched-procedure"
                  type="text" 
                  value={procedureName} 
                  required
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="e.g. Left Total Hip Replacement, Right Knee Meniscectomy"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Lead Consultant Surgeon</label>
                <input 
                  id="sched-surgeon"
                  type="text" 
                  value={surgeon} 
                  required
                  onChange={(e) => setSurgeon(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Consultant Anaesthetist</label>
                <input 
                  id="sched-anaesthetist"
                  type="text" 
                  value={anaesthetist} 
                  required
                  onChange={(e) => setAnaesthetist(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-205 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Operating Suite Allocation</label>
                <select
                  id="sched-theatre-select"
                  value={theatreName}
                  onChange={(e) => setTheatreName(e.target.value as TheatreCase["theatreName"])}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded outline-none bg-none"
                >
                  <option value="Operating Theatre 1">Operating Theatre 1 (Laminar Flow)</option>
                  <option value="Operating Theatre 2">Operating Theatre 2 (General Surgery)</option>
                  <option value="Day Surgery Suite">Day Surgery Suite (Minor Ops)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expected Case Duration (Mins)</label>
                <input 
                  id="sched-duration"
                  type="number" 
                  value={duration} 
                  required
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Anaesthetic Mode</label>
                <select
                  id="sched-anaesthetic-mode"
                  value={anaestheticType}
                  onChange={(e) => setAnaestheticType(e.target.value as TheatreCase["anaestheticType"])}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded outline-none"
                >
                  <option value="General">General Anaesthesia (TIVA/Gas)</option>
                  <option value="Spinal">Spinal / Epidural block</option>
                  <option value="Sedation">Conscious Sedation</option>
                  <option value="Local">Local Infiltration</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                id="btn-sched-submit"
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-sm transition"
              >
                Sign Off & Authorize Operating Rota
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
