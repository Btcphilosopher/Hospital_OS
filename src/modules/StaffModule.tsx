import React, { useState } from "react";
import { Staff, AuditLog } from "../types/hospital";
import { 
  Users, Award, Calendar, AlertTriangle, ShieldCheck, 
  Clock, Plus, HelpCircle, GraduationCap, CheckCircle2 
} from "lucide-react";

interface StaffProps {
  staffList: Staff[];
  onUpdateStaff: (list: Staff[]) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

export default function StaffModule({ staffList, onUpdateStaff, onAddAuditLog }: StaffProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"directory" | "rota" | "training">("directory");

  // Rota Form State
  const [shiftDate, setShiftDate] = useState("");
  const [shiftType, setShiftType] = useState<"Day" | "Night" | "On-Call">("Day");
  const [shiftHours, setShiftHours] = useState("08:00 - 17:00");

  const currentStaff = staffList.find(s => s.id === selectedStaffId) || staffList[0];

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff || !shiftDate || !shiftHours) return;

    // Verify mandatory training compliance. If they have an EXPIRED training, alert but log with warning!
    const hasExpiredTraining = currentStaff.trainingCompliance.some(t => t.status === "Expired");
    if (hasExpiredTraining) {
      const confirmShift = window.confirm(
        `WARNING Compliance Alert: ${currentStaff.fullName} has an EXPIRED certification (e.g. Radiation Protection or Lifesaving). Assigning a shift violates GPhC/CQC staffing regulations. Proceed under emergency override?`
      );
      if (!confirmShift) return;
    }

    const newShift = { date: shiftDate, type: shiftType, hours: shiftHours };
    
    const updated = staffList.map(s => {
      if (s.id === currentStaff.id) {
        return {
          ...s,
          shifts: [...s.shifts, newShift].sort((a,b) => a.date.localeCompare(b.date))
        };
      }
      return s;
    });

    onUpdateStaff(updated);
    onAddAuditLog(
      hasExpiredTraining ? "UPDATE" : "UPDATE", 
      "Staff & HR", 
      `Assigned ${shiftType} shift (${shiftDate}, ${shiftHours}) to ${currentStaff.fullName}. ${hasExpiredTraining ? "[TRAINING COMPLIANCE OVERRIDE]" : ""}`
    );

    alert(`Shift assigned successfully to ${currentStaff.fullName}.`);
    setShiftDate("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800" id="staff-module-container">
      {/* COLUMN 1: DIR / ACTIVE SELECTOR */}
      <div className="lg:col-span-1 space-y-4">
        {/* Navigation Tabs */}
        <div className="bg-white border rounded-xl p-2 flex flex-col space-y-1 shadow-xs">
          <button
            id="btn-staff-tab-directory"
            onClick={() => setActiveTab("directory")}
            className={`w-full py-2 px-3 text-xs font-semibold text-left rounded-lg transition-all ${activeTab === "directory" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Staff Registry List
          </button>
          <button
            id="btn-staff-tab-rota"
            onClick={() => setActiveTab("rota")}
            className={`w-full py-2 px-3 text-xs font-semibold text-left rounded-lg transition-all ${activeTab === "rota" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Duty Rota Planner
          </button>
          <button
            id="btn-staff-tab-training"
            onClick={() => setActiveTab("training")}
            className={`w-full py-2 px-3 text-xs font-semibold text-left rounded-lg transition-all ${activeTab === "training" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Credential Compliance
          </button>
        </div>

        {/* Directory Search Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Select Staff Member</label>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {staffList.map((s) => {
              const hasExpiry = s.trainingCompliance.some(t => t.status === "Expired");
              return (
                <div
                  id={`staff-row-${s.id}`}
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer hover:bg-slate-50 transition flex items-center justify-between ${s.id === selectedStaffId ? "border-cyan-500 bg-cyan-50/15" : "border-slate-100"}`}
                >
                  <div>
                    <div className="font-bold text-slate-800">{s.fullName}</div>
                    <div className="text-[10px] text-slate-500">{s.role} • {s.specialty}</div>
                  </div>
                  {hasExpiry && (
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" title="Compliance Deficit" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLUMNS 2 & 3: DETAIL AND FORMS */}
      <div className="lg:col-span-2">
        {currentStaff ? (
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6">
            {/* Header profile card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="text-xl font-bold text-slate-900">{currentStaff.fullName}</div>
                <div className="text-sm font-semibold text-slate-500">{currentStaff.role} ({currentStaff.specialty})</div>
                <div className="text-xs font-mono text-slate-400">
                  {currentStaff.gmcNumber ? `GMC Register: ${currentStaff.gmcNumber}` : currentStaff.nmcPin ? `NMC Registrar: ${currentStaff.nmcPin}` : "ID: " + currentStaff.id}
                </div>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-black uppercase ${
                currentStaff.trainingCompliance.some(t => t.status === "Expired") 
                ? "bg-rose-50 text-rose-700 border border-rose-200" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {currentStaff.trainingCompliance.some(t => t.status === "Expired") ? "⛔ compliance Expelled" : "✓ Active Compliant"}
              </span>
            </div>

            {/* DIRECTORY VIEW */}
            {activeTab === "directory" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 pt-2">
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Credential verification</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-semibold text-slate-400">Employment Ref:</span> {currentStaff.id}</div>
                    <div><span className="font-semibold text-slate-400">Specialty Scope:</span> {currentStaff.specialty}</div>
                    {currentStaff.gmcNumber && <div><span className="font-semibold text-slate-400">GMC License:</span> Yes</div>}
                    {currentStaff.nmcPin && <div><span className="font-semibold text-slate-400">NMC Pin:</span> Yes</div>}
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mandatory training Summary</span>
                  <div className="space-y-1">
                    {currentStaff.trainingCompliance.map((topic, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px]">
                        <span>{topic.topic}</span>
                        <span className={`font-bold uppercase text-[9px] ${topic.status === "Valid" ? "text-emerald-700" : "text-rose-600 font-extrabold"}`}>
                          {topic.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ROTA PLANNER VIEW */}
            {activeTab === "rota" && (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shifts logged */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed & Scheduled Shifts</span>
                    {currentStaff.shifts.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded text-xs text-slate-400">No shifts scheduled.</div>
                    ) : (
                      <div className="space-y-2 max-h-[254px] overflow-y-auto pr-1">
                        {currentStaff.shifts.map((sh, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 border rounded-lg text-xs flex justify-between items-center">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-700">{sh.date}</div>
                              <div className="text-slate-400">Type: <span className="font-semibold text-slate-600">{sh.type}</span></div>
                            </div>
                            <span className="font-mono bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded font-bold">{sh.hours}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Shift form */}
                  <form onSubmit={handleAddShift} className="bg-slate-50 border p-4 rounded-xl space-y-3.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block border-b pb-1.5 border-slate-200">
                      Issue Rota Shift
                    </span>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift Calendar Date</label>
                      <input 
                        id="shift-date-input"
                        type="date" 
                        required
                        value={shiftDate}
                        onChange={(e) => setShiftDate(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border rounded outline-none bg-white font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift Category</label>
                      <select
                        id="shift-type-select"
                        value={shiftType}
                        onChange={(e) => setShiftType(e.target.value as any)}
                        className="w-full px-2 py-1 text-xs border rounded bg-white outline-none"
                      >
                        <option value="Day">Standard Day Shift</option>
                        <option value="Night">Long Night Shift</option>
                        <option value="On-Call">24-Hour Consultant On-Call</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift Hours Spectrum</label>
                      <input 
                        id="shift-hours-input"
                        type="text" 
                        required
                        value={shiftHours} 
                        onChange={(e) => setShiftHours(e.target.value)}
                        placeholder="e.g. 08:00 - 17:00, 20:00 - 08:30"
                        className="w-full px-2.5 py-1 text-xs border rounded outline-none bg-white"
                      />
                    </div>

                    <button
                      id="btn-add-shift"
                      type="submit"
                      className="w-full py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded transition uppercase tracking-wider shadow-sm"
                    >
                      Authenticate Shift Allocation
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TRAINING VIEW */}
            {activeTab === "training" && (
              <div className="space-y-4 pt-2 text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Training Certifications Checklist</span>
                
                <div className="space-y-3">
                  {currentStaff.trainingCompliance.map((tc, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{tc.topic}</div>
                        <div className="text-slate-400 mt-0.5">Expires date: <span className="font-semibold text-slate-600">{tc.dueDate}</span></div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {tc.status === "Valid" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>APPROVED</span>
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 border border-rose-250 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            <span>EXPIRED</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 border border-dashed rounded-xl">
            Select a staff practitioner to view profiles.
          </div>
        )}
      </div>
    </div>
  );
}
