import React, { useState } from "react";
import { Patient, WardBed, AuditLog } from "../types/hospital";
import { 
  Building2, Users, CheckCircle, RefreshCw, AlertOctagon, 
  UserMinus, Minimize2, Move, HelpCircle, Activity 
} from "lucide-react";

interface WardProps {
  patients: Patient[];
  beds: WardBed[];
  onUpdateBeds: (beds: WardBed[]) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
  onUpdatePatientTimeline: (id: string, event: { id: string; timestamp: string; type: "Admission" | "Discharge" | "Transfer"; description: string; author: string }) => void;
  onInitiateDischargeInvoice: (patientId: string) => void;
}

export default function WardModule({ 
  patients, 
  beds, 
  onUpdateBeds, 
  onAddAuditLog, 
  onUpdatePatientTimeline,
  onInitiateDischargeInvoice
}: WardProps) {
  
  const [selectedWard, setSelectedWard] = useState<WardBed["wardName"] | "All">("All");
  const [selectedBed, setSelectedBed] = useState<WardBed | null>(null);
  
  // Interactive forms state
  const [allocationPatientId, setAllocationPatientId] = useState("");
  const [transferTargetBedId, setTransferTargetBedId] = useState("");
  const [consultantName, setConsultantName] = useState("Dr. Alastair Sterling");
  const [expectedLos, setExpectedLos] = useState(3);

  // Grouped Wards definitions
  const wardsList: (WardBed["wardName"])[] = [
    "Urgent Care", "Intensive Care", "Oncology", "Cardiology", "Orthopaedics", "General Ward", "Day Surgery", "Isolation Room"
  ];

  // Filters beds
  const filteredBeds = beds.filter(b => selectedWard === "All" || b.wardName === selectedWard);

  // Calc metrics
  const totalBeds = beds.length;
  const occupiedBedsCount = beds.filter(b => b.status === "Occupied").length;
  const cleaningBedsCount = beds.filter(b => b.status === "Cleaning Required").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBedsCount / totalBeds) * 100) : 0;

  const handleBedSelect = (bed: WardBed) => {
    setSelectedBed(bed);
    // Reset secondary actions
    setAllocationPatientId("");
    setTransferTargetBedId("");
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !allocationPatientId) return;

    const chosenPat = patients.find(p => p.id === allocationPatientId);
    if (!chosenPat) return;

    // Mutate bed array
    const updatedBeds = beds.map(b => {
      if (b.id === selectedBed.id) {
        return { ...b, status: "Occupied" as const, patientId: chosenPat.id };
      }
      return b;
    });

    onUpdateBeds(updatedBeds);

    // Record admission on Patient timeline
    onUpdatePatientTimeline(chosenPat.id, {
      id: "adm-" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "Admission",
      description: `Formally admitted and allocated to Bed ${selectedBed.bedNumber} (${selectedBed.wardName}). Senior Consultant: ${consultantName}. Expected LoS: ${expectedLos} days.`,
      author: "Admissions Registrar"
    });

    onAddAuditLog("UPDATE", "Ward Management", `Admitted patient ${chosenPat.fullName} into Bed ${selectedBed.bedNumber} (${selectedBed.wardName})`);
    
    setSelectedBed(null);
    alert(`Patient ${chosenPat.fullName} has been checked into Bed ${selectedBed.bedNumber}.`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !transferTargetBedId || !selectedBed.patientId) return;

    const sourceBed = selectedBed;
    const destBed = beds.find(b => b.id === transferTargetBedId);
    if (!destBed || destBed.status !== "Available") {
      alert("Selected destination bed is not available or occupied.");
      return;
    }

    const patientId = sourceBed.patientId;
    const activePat = patients.find(p => p.id === patientId);

    // Mutate bed array: Source becomes "Cleaning Required", Destination becomes "Occupied"
    const updatedBeds = beds.map(b => {
      if (b.id === sourceBed.id) {
        return { ...b, status: "Cleaning Required" as const, patientId: null };
      }
      if (b.id === destBed.id) {
        return { ...b, status: "Occupied" as const, patientId: patientId };
      }
      return b;
    });

    onUpdateBeds(updatedBeds);

    if (activePat) {
      onUpdatePatientTimeline(activePat.id, {
        id: "trf-" + Date.now(),
        timestamp: new Date().toISOString(),
        type: "Transfer",
        description: `Transferred bedside ward control from Bed ${sourceBed.bedNumber} (${sourceBed.wardName}) to Bed ${destBed.bedNumber} (${destBed.wardName}) for care matching.`,
        author: "Ward Sister Higgins"
      });
    }

    onAddAuditLog("UPDATE", "Ward Management", `Initiated bed-transfer. Patient ${activePat?.fullName || "A.N.ON"} moved from ${sourceBed.bedNumber} to ${destBed.bedNumber}.`);
    
    setSelectedBed(null);
    alert("Hospital bed transfer successfully completed.");
  };

  const handleExecuteDischarge = () => {
    if (!selectedBed || !selectedBed.patientId) return;

    const patientId = selectedBed.patientId;
    const activePat = patients.find(p => p.id === patientId);

    // Source bed status changed to "Cleaning Required", patient evacuated
    const updatedBeds = beds.map(b => {
      if (b.id === selectedBed.id) {
        return { ...b, status: "Cleaning Required" as const, patientId: null };
      }
      return b;
    });

    onUpdateBeds(updatedBeds);

    if (activePat) {
      // 1. Log timeline Discharge summarizing
      onUpdatePatientTimeline(activePat.id, {
        id: "dis-" + Date.now(),
        timestamp: new Date().toISOString(),
        type: "Discharge",
        description: `Discharged from inpatient bed ${selectedBed.bedNumber}. Electronic Discharge Summary transmitted to registered GP lowri davies and patient portal.`,
        author: "Consultant of Record"
      });

      // 2. Draft patient discharge ledger bill
      onInitiateDischargeInvoice(activePat.id);
    }

    onAddAuditLog("UPDATE", "Ward Management", `Discharged patient ${activePat?.fullName || "Anonymous"} from bed ${selectedBed.bedNumber}. Initiating billing charges.`);
    
    setSelectedBed(null);
    alert("Patient has been formally discharged. Bed flagged for immediate housekeeping cycle, and a financial draft ledger has been raised.");
  };

  const handleHousekeepingDone = (bedId: string) => {
    const updatedBeds = beds.map(b => {
      if (b.id === bedId) {
        return { ...b, status: "Available" as const };
      }
      return b;
    });

    onUpdateBeds(updatedBeds);
    onAddAuditLog("UPDATE", "Ward Management", `Housekeeping cleared: Bed reset to AVAILABLE.`);
    if (selectedBed && selectedBed.id === bedId) {
      setSelectedBed(null);
    }
  };

  // Find patients not currently in a bed to populate waitlist selection
  const occupiedPatientIds = beds.filter(b => b.status === "Occupied").map(b => b.patientId).filter(Boolean);
  const admittedPatientsList = patients.filter(p => !occupiedPatientIds.includes(p.id));

  return (
    <div className="space-y-6 font-sans" id="ward-module-container">
      {/* Ward Dashboard Statistics summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Operational Scale</span>
            <span className="text-2xl font-black text-slate-900 mt-1">{totalBeds} Beds</span>
          </div>
          <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Active Occupancy</span>
            <span className="text-2xl font-black text-cyan-700 mt-1">{occupiedBedsCount} Beds</span>
          </div>
          <div className="h-10 w-10 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-700">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Sanitation Waitlist</span>
            <span className="text-2xl font-black text-amber-600 mt-1">{cleaningBedsCount} Beds</span>
          </div>
          <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Load Percentage</span>
            <span className={`text-2xl font-black mt-1 ${occupancyRate > 85 ? "text-rose-600 animate-pulse" : "text-emerald-700"}`}>{occupancyRate}%</span>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${occupancyRate > 85 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Ward Selection Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex flex-wrap gap-1.5 shadow-sm">
        <button
          id="btn-ward-all"
          onClick={() => setSelectedWard("All")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedWard === "All" ? "bg-cyan-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
        >
          All Departments ({beds.length})
        </button>
        {wardsList.map(ward => {
          const bedCount = beds.filter(b => b.wardName === ward).length;
          return (
            <button
              id={`btn-ward-${ward.replace(/\s+/g, '-')}`}
              key={ward}
              onClick={() => setSelectedWard(ward)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${selectedWard === ward ? "bg-cyan-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {ward} ({bedCount})
            </button>
          );
        })}
      </div>

      {/* BED WHITEBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 border-b pb-3 mb-4 flex items-center justify-between">
            <span>Ward Occupancy Whiteboard Matrix • ({selectedWard})</span>
            <span className="text-xs text-slate-400">Click any bed cell to manage admissions & sanitation</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {filteredBeds.map(b => {
              const patient = b.patientId ? patients.find(p => p.id === b.patientId) : null;
              
              let statusBg = "border-slate-200 bg-white hover:bg-slate-50 text-slate-800";
              let dotColor = "bg-emerald-500";
              if (b.status === "Occupied") {
                statusBg = "bg-rose-50/40 border-rose-100 hover:bg-rose-50 text-rose-900";
                dotColor = "bg-rose-500";
              } else if (b.status === "Cleaning Required") {
                statusBg = "bg-amber-50/40 border-amber-100 hover:bg-amber-50 text-amber-900";
                dotColor = "bg-amber-500";
              } else if (b.status === "Maintenance") {
                statusBg = "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed";
                dotColor = "bg-slate-400";
              }

              // Highlight matching selection
              const isSelected = selectedBed?.id === b.id;
              if (isSelected) {
                statusBg += " ring-2 ring-cyan-600 border-transparent shadow-xs";
              }

              return (
                <div
                  id={`bed-cell-${b.id}`}
                  key={b.id}
                  onClick={() => b.status !== "Maintenance" && handleBedSelect(b)}
                  className={`border rounded-lg p-3 cursor-pointer text-left transition-all max-h-24 overflow-hidden relative flex flex-col justify-between ${statusBg}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono tracking-tight">{b.bedNumber}</span>
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                  </div>
                  <div>
                    {b.status === "Occupied" ? (
                      <div className="text-[10px] font-semibold tracking-tight text-slate-800 truncate mt-1">
                        {patient ? patient.fullName : "Background Patient"}
                      </div>
                    ) : b.status === "Cleaning Required" ? (
                      <div className="text-[9px] font-bold tracking-tight text-amber-700 uppercase mt-1 animate-pulse">
                        SANI-WAIT
                      </div>
                    ) : (
                      <div className="text-[9px] font-semibold text-slate-400 mt-1 uppercase">
                        VACANT
                      </div>
                    )}
                  </div>
                  {b.wardName === "Isolation Room" && (
                    <div className="absolute top-1 right-5 text-[8px] font-bold bg-amber-500 text-white px-1 py-[1px] rounded scale-80">
                      ISO
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT DRAWER: BED CONTROL PANEL */}
        <div className="lg:col-span-1">
          {selectedBed ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 space-y-5">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 tracking-wider bg-cyan-50 px-2 py-0.5 rounded uppercase">
                  Bed Control Panel
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">{selectedBed.bedNumber}</h3>
                <p className="text-xs text-slate-500">{selectedBed.wardName}</p>
              </div>

              {/* ACTION A: BED IS VACANT - ADMIT PATIENT */}
              {selectedBed.status === "Available" && (
                <form onSubmit={handleAllocate} className="space-y-4">
                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Choose Patient (Waitlist/OPD Referral)
                    </label>
                    <select
                      id="alloc-patient-id"
                      value={allocationPatientId}
                      required
                      onChange={(e) => setAllocationPatientId(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-white outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">-- Choose Profile --</option>
                      {admittedPatientsList.map(p => (
                        <option key={p.id} value={p.id}>{p.fullName} (Born {p.dob})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Consultant in Charge
                    </label>
                    <select
                      id="alloc-consultant"
                      value={consultantName}
                      onChange={(e) => setConsultantName(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-white outline-none"
                    >
                      <option value="Dr. Alastair Sterling">Dr. Alastair Sterling (Oncology)</option>
                      <option value="Mr. Jonathan Carter">Mr. Jonathan Carter (Orthopaedics)</option>
                      <option value="Dr. Marcus Vance">Dr. Marcus Vance (Cardiology)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Expected LoS (Days)
                    </label>
                    <input
                      id="alloc-los"
                      type="number"
                      value={expectedLos}
                      onChange={(e) => setExpectedLos(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <button
                    id="btn-allocate-execute"
                    type="submit"
                    className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded shadow-sm transition"
                  >
                    Authorize Inpatient Admission
                  </button>
                </form>
              )}

              {/* ACTION B: BED OCCUPIED - ACTIONS: DISCHARGE, TRANSFER */}
              {selectedBed.status === "Occupied" && (
                <div className="space-y-4 divide-y divide-slate-100">
                  {/* Occupant Detail */}
                  <div className="pb-3 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Active Inpatient:</span>
                    {(() => {
                      const p = patients.find(p => p.id === selectedBed.patientId);
                      return p ? (
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{p.fullName}</div>
                          <div>NHS Number: <span className="font-mono">{p.nhsNumber}</span></div>
                          <div>Primary Payer: <span className="font-bold">{p.insurance.provider}</span></div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">Background/Simulated Patient</div>
                      );
                    })()}
                  </div>

                  {/* Discharge block */}
                  <div className="pt-4 space-y-2">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Clinical Discharge Panel</span>
                    <button
                      id="btn-discharge-execute"
                      onClick={handleExecuteDischarge}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded shadow-2xs transition flex items-center justify-center space-x-1"
                    >
                      <UserMinus className="h-4 w-4" />
                      <span>Formally Discharge Bed Occupant</span>
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Discharging ends ward occupancy, flags bed sanitization, and transfers clinical invoice details to AXA/Bupa billing ledger.
                    </p>
                  </div>

                  {/* Transfer block */}
                  <form onSubmit={handleExecuteTransfer} className="pt-4 space-y-2">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block mb-1">Ward-to-Ward Bed Transfer</span>
                    <select
                      id="transfer-target-bed"
                      value={transferTargetBedId}
                      required
                      onChange={(e) => setTransferTargetBedId(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-white outline-none"
                    >
                      <option value="">-- Select Vacant Bed --</option>
                      {beds.filter(b => b.status === "Available" && b.id !== selectedBed?.id).map(b => (
                        <option key={b.id} value={b.id}>{b.bedNumber} ({b.wardName})</option>
                      ))}
                    </select>
                    <button
                      id="btn-transfer-execute"
                      type="submit"
                      className="w-full py-2 bg-white border border-cyan-200 text-cyan-700 font-bold text-xs rounded hover:bg-cyan-50 transition flex items-center justify-center space-x-1"
                    >
                      <Move className="h-3.5 w-3.5" />
                      <span>Execute Bed Relocation</span>
                    </button>
                  </form>
                </div>
              )}

              {/* ACTION C: BED SANITATION PROTOCOLS */}
              {selectedBed.status === "Cleaning Required" && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs leading-relaxed">
                    <AlertOctagon className="h-4 w-4 text-amber-600 mb-1" />
                    <span className="font-bold">Sanitation Protocol Pending:</span> Discharge cycle complete. Environmental Services team must clean patient linens, wipe frame joints, and disinfect diagnostic fixtures before Bed OS returns to service.
                  </div>
                  <button
                    id="btn-housekeeping-done"
                    onClick={() => handleHousekeepingDone(selectedBed.id)}
                    className="w-full py-2 bg-amber-600 text-white hover:bg-amber-700 font-bold text-xs rounded uppercase tracking-wider shadow-sm"
                  >
                    Certify Sanitation Complete
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-400 font-medium">
              <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <span>Select any live bed matrix tile to manage hospital check-ins, transfers, housekeeping, or discharges.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
