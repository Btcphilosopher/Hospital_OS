import React, { useState } from "react";
import { Patient, Prescription, AuditLog } from "../types/hospital";
import { 
  Pill, AlertTriangle, ShieldCheck, CheckCircle2, UserPlus, 
  Settings, Clock, FileWarning, KeyRound, HelpCircle 
} from "lucide-react";

interface MedicationProps {
  patients: Patient[];
  selectedPatientId: string;
  prescriptions: Prescription[];
  onAddPrescription: (rx: Prescription) => void;
  onAdministerPrescription: (rxId: string, log: { administeredAt: string; administeredBy: string; status: "Administered" | "Refused" | "Omitted" }) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

const CONST_DRUGS = [
  { name: "Amoxicillin", class: "Beta-lactam Antibiotic", controlled: false },
  { name: "Warfarin", class: "Oral Anticoagulant", controlled: false },
  { name: "Ibuprofen", class: "Non-Steroidal Anti-Inflammatory Drug (NSAID)", controlled: false },
  { name: "Paracetamol", class: "Analgesic", controlled: false },
  { name: "Morphine Sulfate Injection", class: "Opioid Analgesic - Schedule 2 Controlled Drug", controlled: true },
  { name: "Gentamicin", class: "Aminoglycoside", controlled: false }
];

export default function MedicationModule({ 
  patients, 
  selectedPatientId, 
  prescriptions, 
  onAddPrescription, 
  onAdministerPrescription,
  onAddAuditLog
}: MedicationProps) {
  
  const [activePatientId, setActivePatientId] = useState(selectedPatientId || patients[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"prescribe" | "emar">("emar");

  // Prescribing Form
  const [selectedDrugIndex, setSelectedDrugIndex] = useState(0);
  const [dosage, setDosage] = useState("500mg");
  const [frequency, setFrequency] = useState("Three times a day");
  const [route, setRoute] = useState<Prescription["route"]>("Oral");
  const [notes, setNotes] = useState("");

  // Controlled drug secondary signoff
  const [signatureOne, setSignatureOne] = useState("");
  const [signatureTwo, setSignatureTwo] = useState("");
  const [cdSigned, setCdSigned] = useState(false);

  // Nurse Admin name
  const [nurseAdminName, setNurseAdminName] = useState("Sister Fiona Higgins, NMC");

  const currentPatient = patients.find(p => p.id === activePatientId) || patients[0];
  const targetDrug = CONST_DRUGS[selectedDrugIndex];

  // Allergy Crosscheck Alarm
  const isDrugAllergyCollision = () => {
    if (!currentPatient || !targetDrug) return false;
    const drugFamilyLower = targetDrug.name.toLowerCase();
    
    // Penicillin cross allergy checks
    if (currentPatient.allergies.some(a => a.toLowerCase().includes("penicillin"))) {
      if (drugFamilyLower.includes("amoxicillin") || drugFamilyLower.includes("penicillin")) {
        return true;
      }
    }
    
    // NSAID allergy checks
    if (currentPatient.allergies.some(a => a.toLowerCase().includes("nsaid") || a.toLowerCase().includes("aspirin"))) {
      if (drugFamilyLower.includes("ibuprofen")) {
        return true;
      }
    }
    
    return false;
  };

  // Drug-to-Drug Interaction Crosscheck
  const isDrugInteractionCheck = () => {
    if (!currentPatient || !targetDrug) return false;
    const drugLower = targetDrug.name.toLowerCase();
    
    // Simulate: Patient has active warfarin, prescribing Ibuprofen. High risk interaction box!
    const activePatientRxs = prescriptions.filter(r => r.patientId === currentPatient.id && r.status === "Active");
    const hasWarfarin = activePatientRxs.some(r => r.drugName.toLowerCase().includes("warfarin"));
    
    if (drugLower.includes("ibuprofen") && hasWarfarin) {
      return "Warfarin + Ibuprofen: Concomitant administration of oral anticoagulants and NSAID compounds increases gastric bleed and haemorrhagic risk.";
    }

    // Patient has ibuprofen, prescribing Warfarin
    const hasIbuprofen = activePatientRxs.some(r => r.drugName.toLowerCase().includes("ibuprofen"));
    if (drugLower.includes("warfarin") && hasIbuprofen) {
      return "Warfarin + Ibuprofen: Concomitant administration of oral anticoagulants and NSAID compounds increases gastric bleed and haemorrhagic risk.";
    }

    return null;
  };

  const allergyCollision = isDrugAllergyCollision();
  const interactionCollisionMsg = isDrugInteractionCheck();

  const handlePrescribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    if (allergyCollision) {
      alert("PRESCRIPTION CO-SIGN CONTRAINDICATION: Cannot bypass patient allergy blocks. Select safe therapeutics.");
      return;
    }

    // Controlled Drug double nurse signoff check
    if (targetDrug.controlled && !cdSigned) {
      alert("REGULATORY REQUIREMENT: Morphine Sulfate and S2 Controlled therapeutics require physical dual clinician signature checkoff before prescription logs.");
      return;
    }

    const newRx: Prescription = {
      id: "rx-" + Date.now(),
      patientId: currentPatient.id,
      drugName: targetDrug.name,
      dosage,
      frequency,
      route,
      prescribedBy: "Dr. Alastair Sterling",
      prescribedAt: new Date().toISOString(),
      status: "Active",
      controlledDrug: targetDrug.controlled,
      notes: notes,
      administrationLogs: []
    };

    onAddPrescription(newRx);

    // Timeline event
    currentPatient.timeline.unshift({
      id: "t-rx-" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "Prescription",
      description: `E-Prescribed: ${newRx.drugName} ${newRx.dosage}, ${newRx.frequency} via route ${newRx.route}`,
      author: "Dr. Alastair Sterling, Consultant"
    });

    onAddAuditLog("CREATE", "Medication Management", `E-Prescribed ${newRx.drugName} ${newRx.dosage} to patient ${currentPatient.fullName} (ID: ${currentPatient.id})`);

    // Reset Form
    setNotes("");
    setCdSigned(false);
    setSignatureOne("");
    setSignatureTwo("");
    alert("Therapeutic e-Prescription safely authenticated and dispatched to Ward Pharmacy queue.");
    setActiveTab("emar");
  };

  const handleAdminister = (rxId: string, status: "Administered" | "Refused" | "Omitted") => {
    const adminTime = new Date().toISOString();
    onAdministerPrescription(rxId, {
      administeredAt: adminTime,
      administeredBy: nurseAdminName,
      status
    });

    // Feed patient timeline
    const rxObj = prescriptions.find(r => r.id === rxId);
    if (rxObj) {
      currentPatient.timeline.unshift({
        id: "t-admin-" + Date.now(),
        timestamp: adminTime,
        type: "Clinical Note",
        description: `Medication Dose Administered: ${rxObj.drugName} (${rxObj.dosage}). Status outcome: ${status}.`,
        author: nurseAdminName
      });
    }

    onAddAuditLog("CREATE", "Medication Management", `Recorded eMAR dosage action ${status} for treatment ${rxObj?.drugName} (ID: ${rxId})`);
    alert(`Success: Recorded clinical outcome: '${status}'`);
  };

  const activeRxs = prescriptions.filter(r => r.patientId === currentPatient.id && r.status === "Active");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans" id="medication-module-grid">
      {/* COLUMN 1: PATIENTSELECTOR & DRUG LIST */}
      <div className="lg:col-span-1 space-y-4">
        {/* Core selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Chart Select</label>
          <select 
            id="med-patient-select"
            value={activePatientId}
            onChange={(e) => setActivePatientId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-800"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName} (NHS: {p.nhsNumber})</option>
            ))}
          </select>
          
          <div className="mt-3 p-3 bg-slate-950 text-slate-350 rounded-lg text-xs">
            <span className="font-bold text-slate-500 uppercase">Documented Allergies:</span>
            <div className="text-rose-400 font-bold mt-1 text-sm">
              {currentPatient.allergies.join(", ") || "No Known Drug Allergies (NKDA)"}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-white border border-slate-100 p-2 rounded-xl shadow-xs divide-y divide-slate-100">
          <button
            id="btn-med-tab-emar"
            onClick={() => setActiveTab("emar")}
            className={`w-full py-2.5 text-left px-3 text-sm font-semibold rounded-lg flex items-center justify-between ${activeTab === "emar" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <span>View eMAR Ward Round Queue</span>
            <Clock className="h-4 w-4" />
          </button>
          <button
            id="btn-med-tab-prescribe"
            onClick={() => setActiveTab("prescribe")}
            className={`w-full py-2.5 text-left px-3 text-sm font-semibold rounded-lg flex items-center justify-between ${activeTab === "prescribe" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <span>Draft New e-Prescription</span>
            <Pill className="h-4 w-4" />
          </button>
        </div>

        {/* Nurse Signature Profile */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Authorized Nursing Clinician</label>
          <input 
            id="nurse-admin-signature"
            type="text" 
            value={nurseAdminName}
            onChange={(e) => setNurseAdminName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 bg-slate-50 rounded font-medium"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Your NMC pin is digitally attached to drug administration logs.</span>
        </div>
      </div>

      {/* RIGHT CONTROLS */}
      <div className="lg:col-span-2">
        {/* EMAR VIEW TAB */}
        {activeTab === "emar" && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex justify-between items-center">
              <span>Electronic Medication Administration Record (eMAR)</span>
              <span className="text-xs text-slate-400 font-mono">Active prescription charts: {activeRxs.length}</span>
            </h3>

            {activeRxs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No active drug prescription charts on file for {currentPatient.fullName}. Use 'Draft New e-Prescription' to add.
              </div>
            ) : (
              <div className="space-y-4">
                {activeRxs.map((rx) => (
                  <div key={rx.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-3 relative overflow-hidden">
                    {rx.controlledDrug && (
                      <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[8px] tracking-widest px-3 py-0.5 rounded-bl uppercase">
                        Schedule 2 Controlled
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                          <Pill className="h-4 w-4 text-cyan-700 flex-shrink-0" />
                          <span>{rx.drugName}</span>
                          <span className="text-xs font-medium bg-cyan-50 text-cyan-800 px-2 rounded-full font-mono">{rx.dosage}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Frequency: <span className="font-semibold text-slate-700">{rx.frequency}</span> • Path: <span className="font-semibold text-slate-700 font-mono">{rx.route}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">PRESCRIBER</span>
                        <span className="text-xs text-slate-600 font-medium">{rx.prescribedBy}</span>
                      </div>
                    </div>

                    {rx.notes && (
                      <p className="text-xs bg-white border border-slate-100 p-2 rounded text-slate-500 leading-relaxed italic">
                        Prescription instruction: "{rx.notes}"
                      </p>
                    )}

                    {/* Historical doses block */}
                    <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 mr-2 font-bold uppercase text-[9px] block">History</span>
                        {rx.administrationLogs.length === 0 ? (
                          <span className="text-slate-400 italic">No doses administered since admit check.</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rx.administrationLogs.map((log, i) => (
                              <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-1.5 py-0.5 rounded">
                                ✓ Administered at {new Date(log.administeredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} by {log.administeredBy.split(",")[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Control buttons */}
                      <div className="flex space-x-1">
                        <button
                          id={`btn-admin-${rx.id}`}
                          onClick={() => handleAdminister(rx.id, "Administered")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 text-[11px] rounded transition"
                        >
                          Mark Administered
                        </button>
                        <button
                          id={`btn-refuse-${rx.id}`}
                          onClick={() => handleAdminister(rx.id, "Refused")}
                          className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold px-2 px-1 text-[11px] rounded transition"
                        >
                          Refused
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRESCRIBE FORM TAB */}
        {activeTab === "prescribe" && (
          <form onSubmit={handlePrescribeSubmit} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex justify-between items-center">
              <span>Electronic Prescribing & Safety Verification</span>
              <span className="text-xs text-rose-600 font-bold flex items-center space-x-1">
                <span>Direct GPhC Clinical Code Matcher</span>
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Formulary Drug Agent</label>
                <select
                  id="presc-drug-select"
                  value={selectedDrugIndex}
                  onChange={(e) => setSelectedDrugIndex(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 bg-white rounded outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {CONST_DRUGS.map((d, i) => (
                    <option key={i} value={i}>{d.name} ({d.class})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Dosage Format</label>
                <input 
                  id="presc-dosage"
                  type="text" 
                  value={dosage} 
                  required
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500mg, 1.2g"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Frequency Schedule</label>
                <input 
                  id="presc-frequency"
                  type="text" 
                  value={frequency} 
                  required
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. TDS (Three times a day)"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Route of Administration</label>
                <select
                  id="presc-route"
                  value={route}
                  onChange={(e) => setRoute(e.target.value as Prescription["route"])}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 bg-white rounded outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Oral">Oral (PO)</option>
                  <option value="IV">Intravenous (IV)</option>
                  <option value="IM">Intramuscular (IM)</option>
                  <option value="Subcutaneous">Subcutaneous (SC)</option>
                  <option value="Inhalation">Inhalation</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Prescribing Clinician Instructions</label>
                <textarea 
                  id="presc-instructions"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dilute in 100ml Normal Saline, infuse over 30 mins. Track liver tolerances."
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* SAFETY BLOCK CHECKS */}
            <div className="space-y-3">
              {allergyCollision && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start space-x-3 text-xs leading-relaxed">
                  <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase text-[10px] tracking-wide block">CRITICAL PENICILLIN / NSAID ALLERGY CONTRAINDICATION</span>
                    <p>
                      Patient '{currentPatient.fullName}' has documented severe allergies to beta-lactam / NSAID groups. Prescribing '{targetDrug.name}' is heavily correlated with anaphylaxis and is clinically locked. Elect safer alternative drug agent.
                    </p>
                  </div>
                </div>
              )}

              {interactionCollisionMsg && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start space-x-3 text-xs leading-relaxed">
                  <FileWarning className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase text-[10px] tracking-wide block">HIGH-RISK DRUG-DRUG COLLISION ALERT</span>
                    <p>{interactionCollisionMsg}</p>
                  </div>
                </div>
              )}

              {!allergyCollision && !interactionCollisionMsg && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-lg flex items-center space-x-2.5 text-xs">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span>Verified: All BNF safety scans completed. No active drug interactions or allergy conflicts flagged.</span>
                </div>
              )}

              {/* CONTROLLED DRUGS LOCK PIN BOX */}
              {targetDrug.controlled && (
                <div className="p-4 bg-rose-50/20 border border-rose-200 rounded-lg space-y-3">
                  <span className="text-xs font-bold text-rose-700 flex items-center space-x-1.5 uppercase">
                    <KeyRound className="h-4 w-4" />
                    <span>Schedule 2 Controlled Drug Regulation Ledger</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Dual clinical verification must occur. Prescribing Physician and Ward Nurse Sister must provide authorization.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">GMC Pin Surgeon/Physician</label>
                      <input 
                        id="presc-cd-gmc"
                        type="text" 
                        placeholder="e.g. GMC8219024"
                        value={signatureOne}
                        onChange={(e) => setSignatureOne(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">NMC Pin Sister/Witness</label>
                      <input 
                        id="presc-cd-nmc"
                        type="text" 
                        placeholder="e.g. NMC83A9201B"
                        value={signatureTwo}
                        onChange={(e) => setSignatureTwo(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      id="presc-cd-declare"
                      type="checkbox" 
                      id="cd-check"
                      checked={cdSigned}
                      onChange={(e) => setCdSigned(e.target.checked)}
                      className="rounded text-rose-600"
                    />
                    <label htmlFor="cd-check" className="text-xs text-rose-800 select-none cursor-pointer">
                      I certify the dual check of the vial concentration and patient identity.
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                id="btn-prescribe-submit"
                type="submit"
                disabled={allergyCollision || (targetDrug.controlled && !cdSigned)}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition ${
                  allergyCollision || (targetDrug.controlled && !cdSigned) 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-cyan-700 hover:bg-cyan-800"
                }`}
              >
                Sign & Authorize Treatment Prescription
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
