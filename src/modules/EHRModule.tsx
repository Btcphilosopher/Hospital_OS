import React, { useState } from "react";
import { Patient, MedicalRecord, VitalSign, AuditLog } from "../types/hospital";
import { 
  Heart, Activity, Plus, ShieldAlert, Check, Calendar, 
  ChevronRight, RefreshCw, FileText, Star, ShieldCheck, HeartPulse
} from "lucide-react";

interface EHRProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  vitals: VitalSign[];
  onAddVital: (v: VitalSign) => void;
  notes: MedicalRecord[];
  onAddNote: (n: MedicalRecord) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

// ICD-10 and OPCS-4 Common codes for simulation
const ICD10_CODES = [
  { code: "I21.9", desc: "Acute myocardial infarction, unspecified (AMI)" },
  { code: "C34.9", desc: "Malignant neoplasm of bronchus or lung" },
  { code: "M16.9", desc: "Coxarthrosis [hip osteoarthritis], unspecified" },
  { code: "J18.9", desc: "Pneumonia, unspecified organism" },
  { code: "A41.9", desc: "Sepsis, unspecified organism" },
  { code: "K56.6", desc: "Other and unspecified intestinal obstruction" }
];

const OPCS4_CODES = [
  { code: "W37.1", desc: "Primary total prosthetic replacement of hip joint using cement" },
  { code: "W82.1", desc: "Diagnostic endoscopic examination of knee joint (Arthroscopy)" },
  { code: "U05.1", desc: "Administration of cytotoxic chemotherapy" },
  { code: "K45.3", desc: "Coronary artery bypass graft (CABG)" },
  { code: "G45.1", desc: "Diagnostic fiberoptic endoscopy of upper gastrointestinal tract" }
];

export default function EHRModule({ 
  patients, 
  selectedPatientId, 
  onSelectPatient, 
  vitals, 
  onAddVital, 
  notes, 
  onAddNote, 
  onAddAuditLog 
}: EHRProps) {
  
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  
  // Tabs: "timeline" | "observations" | "new-note"
  const [activeSubTab, setActiveSubTab] = useState<"timeline" | "observations" | "new-note">("timeline");

  // Clinical note form
  const [noteType, setNoteType] = useState<MedicalRecord["noteType"]>("Consultation");
  const [sbarSituation, setSbarSituation] = useState("");
  const [sbarBackground, setSbarBackground] = useState("");
  const [sbarAssessment, setSbarAssessment] = useState("");
  const [sbarRecommendation, setSbarRecommendation] = useState("");
  const [selectedIcds, setSelectedIcds] = useState<string[]>([]);
  const [selectedOpcs, setSelectedOpcs] = useState<string[]>([]);

  // Vitals form
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [temp, setTemp] = useState(36.6);
  const [resp, setResp] = useState(14);
  const [spo2, setSpo2] = useState(98);

  const calculateNEWS2 = (
    systolic: number, 
    pulse: number, 
    temp: number, 
    resp: number, 
    spo2: number
  ) => {
    let score = 0;
    
    // Respiration Rate (breaths/min)
    if (resp <= 8 || resp >= 25) score += 3;
    else if (resp >= 21 && resp <= 24) score += 2;
    else if (resp >= 9 && resp <= 11) score += 1;
    // 12 to 20 is 0
    
    // Oxygen Saturation (%)
    if (spo2 <= 91) score += 3;
    else if (spo2 >= 92 && spo2 <= 93) score += 2;
    else if (spo2 >= 94 && spo2 <= 95) score += 1;
    // >= 96 is 0
    
    // Temperature (°C)
    if (temp <= 35.0) score += 3;
    else if (temp >= 39.1) score += 2;
    else if (temp <= 36.0 || (temp >= 38.1 && temp <= 39.0)) score += 1;
    // 36.1 to 38.0 is 0
    
    // Systolic Blood Pressure (mmHg)
    if (systolic <= 90 || systolic >= 220) score += 3;
    else if (systolic >= 91 && systolic <= 100) score += 2;
    else if (systolic >= 101 && systolic <= 110) score += 1;
    // 111 to 219 is 0
    
    // Pulse Rate (bpm)
    if (pulse <= 40 || pulse >= 131) score += 3;
    else if (pulse >= 111 && pulse <= 130) score += 2;
    else if (pulse <= 50 || (pulse >= 91 && pulse <= 110)) score += 1;
    // 51 to 90 is 0

    return score;
  };

  const currentNewsScore = calculateNEWS2(systolic, pulse, temp, resp, spo2);

  const getNewsSeverity = (score: number) => {
    if (score === 0) return { label: "No Warning (Low Risk)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score <= 4) return { label: "Low Ward-Level Alert", color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (score <= 6) return { label: "Medium Criticality - Nurse Review Required", color: "text-orange-700 bg-orange-50 border-orange-200" };
    return { label: "HIGH TRACING ALERT: Emergency Medical Escalation", color: "text-rose-700 bg-rose-50 border-rose-200 animate-pulse" };
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const score = calculateNEWS2(systolic, pulse, temp, resp, spo2);
    
    let escalationText = "Monitor closely: Continue routine ward observation schedule.";
    if (score >= 5 || (systolic <= 90 || resp <= 8 || spo2 <= 91 || temp <= 35 || pulse <= 40)) {
      escalationText = "URGENT CLINICAL ESCALATION: Mandatory medical team assessment and 15-min observation cycle established.";
    }

    const newV: VitalSign = {
      id: "v-" + Date.now(),
      patientId: currentPatient.id,
      timestamp: new Date().toISOString(),
      systolicBP: systolic,
      diastolicBP: diastolic,
      pulseRate: pulse,
      temperature: temp,
      respRate: resp,
      spO2: spo2,
      newsScore: score,
      clinicalResponse: escalationText,
      recordedBy: "Clinical Specialist (WardOS)"
    };

    onAddVital(newV);

    // Also push registration event to student's medical timeline
    const timelineEvent = {
      id: "t-v-" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "Clinical Note" as const,
      description: `Obs recorded: NEWS2 score of ${score}. Blood Pressure: ${systolic}/${diastolic}, Pulse: ${pulse}, Temp: ${temp}°C, Resp: ${resp}, SpO2: ${spo2}%.`,
      author: "Ward Nurse Team"
    };
    currentPatient.timeline.unshift(timelineEvent);

    onAddAuditLog("CREATE", "EHR", `Recorded Vital Signs & NEWS2 rating for ${currentPatient.fullName} (NEWS2 Score: ${score})`);
    
    // Reset inputs
    setSystolic(120);
    setDiastolic(80);
    setPulse(72);
    setTemp(36.6);
    setResp(14);
    setSpo2(98);
    
    setActiveSubTab("timeline");
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbarSituation && !sbarAssessment) {
      alert("Situation & Assessment content is required to commit EHR records.");
      return;
    }

    const fullSbarText = `SBAR CLINICAL SUMMARY NOTE
S (Situation): ${sbarSituation}
B (Background): ${sbarBackground || "N/A"}
A (Assessment): ${sbarAssessment}
R (Recommendation): ${sbarRecommendation || "N/A"}`;

    const newN: MedicalRecord = {
      id: "note-" + Date.now(),
      patientId: currentPatient.id,
      noteType: noteType,
      timestamp: new Date().toISOString(),
      clinicianName: "Dr. Alastair Sterling",
      clinicianRole: "Consultant Physician",
      diagnoses: selectedIcds,
      procedures: selectedOpcs,
      content: fullSbarText
    };

    onAddNote(newN);

    // Push to patient timeline
    currentPatient.timeline.unshift({
      id: "t-n-" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "Clinical Note" as const,
      description: `New ${noteType} note recorded. ICD-10 Codes: ${selectedIcds.join(", ") || "None"}`,
      author: "Dr. Alastair Sterling"
    });

    onAddAuditLog("CREATE", "EHR", `Added Clinical Note (${noteType}) with Diagnoses: ${selectedIcds.join(", ")} for patient ${currentPatient.fullName}`);

    // Reset notes input
    setSbarSituation("");
    setSbarBackground("");
    setSbarAssessment("");
    setSbarRecommendation("");
    setSelectedIcds([]);
    setSelectedOpcs([]);
    
    setActiveSubTab("timeline");
  };

  // Filter notes and vitals specific to active patient
  const patientNotes = notes.filter(n => n.patientId === currentPatient.id);
  const patientVitals = vitals.filter(v => v.patientId === currentPatient.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans" id="ehr-module-grid">
      {/* LEFT COLUMN: PATIENT SELECTION & QUICK STATS BAR */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Active Medical Chart</label>
          <select 
            id="ehr-patient-select"
            value={selectedPatientId}
            onChange={(e) => onSelectPatient(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white font-medium"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName} (NHS: {p.nhsNumber})</option>
            ))}
          </select>
        </div>

        {/* Patient Clinical Profile Summary */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="bg-slate-950 p-4 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">{currentPatient.fullName}</h3>
                <p className="text-xs text-slate-400 font-mono">NHS: {currentPatient.nhsNumber}</p>
              </div>
              <span className="text-[10px] bg-cyan-700 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                {currentPatient.gender}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
              <div><span className="text-slate-500">DOB:</span> {currentPatient.dob}</div>
              <div><span className="text-slate-500">Age:</span> {new Date().getFullYear() - new Date(currentPatient.dob).getFullYear()} yrs</div>
              <div className="col-span-2"><span className="text-slate-500">Allergies:</span> <span className="text-rose-400 font-semibold">{currentPatient.allergies.join(", ") || "No Known Allergies"}</span></div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Warning alerts */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Warnings & Flags</span>
              <div className="flex flex-wrap gap-1.5">
                {currentPatient.flags.length === 0 && currentPatient.alerts.length === 0 ? (
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>No safety warnings on file</span>
                  </span>
                ) : (
                  <>
                    {currentPatient.flags.map((cl, i) => (
                      <span key={i} className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-100">
                        {cl}
                      </span>
                    ))}
                    {currentPatient.alerts.map((al, i) => (
                      <span key={i} className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-100 flex items-center space-x-1">
                        <ShieldAlert className="h-3 w-3 text-rose-600 flex-shrink-0" />
                        <span>{al}</span>
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Latest NEWS Score summary */}
            {patientVitals.length > 0 && (
              <div className="border-t border-slate-50 pt-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Latest Observation NEWS2 Score</span>
                {(() => {
                  const latest = patientVitals[0]; // Desynchronized arrays
                  const sev = getNewsSeverity(latest.newsScore);
                  return (
                    <div className={`p-2.5 rounded-lg border text-xs ${sev.color} flex justify-between items-center`}>
                      <div className="font-semibold">{sev.label}</div>
                      <div className="text-lg font-extrabold font-mono text-right">{latest.newsScore}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT 2 COLUMNS: MEDICAL CHRONOLOGY / TOOLS */}
      <div className="lg:col-span-2 space-y-4">
        {/* Navigation within patient chart */}
        <div className="flex border-b border-slate-100 bg-white px-4 rounded-xl shadow-xs py-1">
          <button 
            id="sub-tab-timeline"
            onClick={() => setActiveTab && setActiveSubTab("timeline")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${activeSubTab === "timeline" ? "border-cyan-600 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Chronological Chart History
          </button>
          <button 
            id="sub-tab-observations"
            onClick={() => setActiveSubTab("observations")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${activeSubTab === "observations" ? "border-cyan-600 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Log Observations (NEWS2)
          </button>
          <button 
            id="sub-tab-new-note"
            onClick={() => setActiveSubTab("new-note")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${activeSubTab === "new-note" ? "border-cyan-600 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            Add Clinical SBAR Note
          </button>
        </div>

        {/* TIMELINE TAB */}
        {activeSubTab === "timeline" && (
          <div className="space-y-4">
            {/* Split view: Clinical notes + timelines combined */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-2">Active Medical File Chronology</h3>
              
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                {/* Simulated Timeline + Notes Interleaved */}
                {currentPatient.timeline.length === 0 && patientNotes.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm">No historical clinical events documented yet.</div>
                ) : (
                  currentPatient.timeline.map((item, idx) => {
                    const matchedNote = patientNotes.find(n => n.id === item.id || (item.type === "Clinical Note" && item.description.includes(n.id)));
                    
                    return (
                      <div key={idx} className="flex space-x-3 text-xs text-slate-600 relative">
                        <div className="h-8 w-8 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold flex items-center justify-center flex-shrink-0 z-10">
                          {item.type[0]}
                        </div>
                        <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100 flex-1 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span className="font-bold uppercase tracking-wide text-cyan-700">{item.type}</span>
                            <span className="font-mono">{new Date(item.timestamp).toLocaleString("en-GB")}</span>
                          </div>
                          <div className="text-slate-800 text-sm font-medium">{item.description}</div>
                          <div className="text-slate-400 italic">Author: {item.author}</div>

                          {/* Render associated Note content if present */}
                          {item.type === "Clinical Note" && idx === 0 && patientNotes.length > 0 && (
                            <div className="mt-3 bg-white p-3 rounded-md border border-slate-200 space-y-2 text-slate-700">
                              <div className="flex justify-between border-b pb-1">
                                <span className="font-bold text-slate-800 text-xs">SBAR Ward Assessment</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{patientNotes[0].noteType}</span>
                              </div>
                              <pre className="text-xs whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">
                                {patientNotes[0].content}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* OBSERVATIONS (NEWS) TAB */}
        {activeSubTab === "observations" && (
          <form onSubmit={handleSaveVitals} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">National Early Warning Score (NEWS2) Vital Signs Capture</h3>
              <div className="flex items-center space-x-2 text-xs font-semibold bg-cyan-50 text-cyan-700 px-3 py-1 rounded">
                <HeartPulse className="h-4 w-4 text-cyan-600" />
                <span>UK RCP Standards Compliant</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Systolic BP (mmHg)</label>
                <input 
                  id="vit-systolic"
                  type="number" 
                  value={systolic} 
                  required
                  onChange={(e) => setSystolic(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Diastolic BP (mmHg)</label>
                <input 
                  id="vit-diastolic"
                  type="number" 
                  value={diastolic} 
                  required
                  onChange={(e) => setDiastolic(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Pulse Heart Rate (bpm)</label>
                <input 
                  id="vit-pulse"
                  type="number" 
                  value={pulse} 
                  required
                  onChange={(e) => setPulse(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Temperature (°C)</label>
                <input 
                  id="vit-temp"
                  type="number" 
                  step="0.1"
                  value={temp} 
                  required
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Respiration Rate (rpm)</label>
                <input 
                  id="vit-resp"
                  type="number" 
                  value={resp} 
                  required
                  onChange={(e) => setResp(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Oxygen Saturation SpO2 (%)</label>
                <input 
                  id="vit-spo2"
                  type="number" 
                  value={spo2} 
                  required
                  onChange={(e) => setSpo2(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* LIVE NEWS GRAPH EVALUATION PANEL */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Live Algorithmic Assessment</span>
                <span className="text-xs text-slate-500">Real-time NEWS2 calculation</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">NEWS2 Score Outcome</div>
                  <div className="text-xs text-slate-500">Evaluating multi-parameter risk values...</div>
                </div>
                <div className={`text-4xl font-extrabold font-mono px-4 py-2 border rounded-xl shadow-xs ${
                  currentNewsScore === 0 ? "bg-emerald-50 border-emerald-300 text-emerald-700" :
                  currentNewsScore <= 4 ? "bg-amber-50 border-amber-300 text-amber-700" :
                  "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                }`}>
                  {currentNewsScore}
                </div>
              </div>
              {/* ESCALATION INSTRUCTION */}
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-500">Recommended Clinical Response Protocol:</span>
                <p className="text-slate-600">
                  {currentNewsScore === 0 && "Excellent status. Log standard 12-hourly ward round charts."}
                  {currentNewsScore > 0 && currentNewsScore <= 4 && "Elevated risk parameters. Re-measure vitals in 4-6 hours. Ward Nurse informed."}
                  {currentNewsScore >= 5 && "CRITICAL score trigger! Immediate escalation to Consultant. Retake observations in 15 mins. Prepare emergency airway/access cart."}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="btn-save-obs"
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-sm transition"
              >
                Log Observations & Calculate Score
              </button>
            </div>
          </form>
        )}

        {/* ADD SBAR CLINICAL NOTE TAB */}
        {activeSubTab === "new-note" && (
          <form onSubmit={handleSaveNote} className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">SBAR Structured Consultation Note Composer</h3>
              <select 
                id="note-type-select"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as MedicalRecord["noteType"])}
                className="text-xs px-2 py-1 font-semibold border rounded bg-white text-slate-600"
              >
                <option value="Consultation">Consultation Note</option>
                <option value="Ward Round">Ward Round note</option>
                <option value="Nursing Log">Nursing Handover Log</option>
                <option value="Procedure Notes">Surgical / Procedure Note</option>
                <option value="Discharge Summary">Discharge Summary Letter</option>
              </select>
            </div>

            {/* SBAR Form Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">S Situation *</label>
                <textarea 
                  id="sbar-situation"
                  rows={2}
                  required
                  placeholder="Identify patient, specify acute situation, current clinical crisis..."
                  value={sbarSituation}
                  onChange={(e) => setSbarSituation(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">B Background</label>
                <textarea 
                  id="sbar-background"
                  rows={2}
                  placeholder="Insert critical context, relevant comorbidities, recent surgeries, patient trajectory..."
                  value={sbarBackground}
                  onChange={(e) => setSbarBackground(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">A Assessment *</label>
                <textarea 
                  id="sbar-assessment"
                  rows={2}
                  required
                  placeholder="Document active clinical hypothesis, observation metrics, safety alerts..."
                  value={sbarAssessment}
                  onChange={(e) => setSbarAssessment(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">R Recommendation</label>
                <textarea 
                  id="sbar-recommendation"
                  rows={2}
                  placeholder="Outline immediate treatment path, drug reconciliations, clinician referrals, discharge planning..."
                  value={sbarRecommendation}
                  onChange={(e) => setSbarRecommendation(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-800 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Coding selection (ICD-10, OPCS-4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ICD-10 Diagnostic Codes</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                  {ICD10_CODES.map((item) => {
                    const isSel = selectedIcds.includes(item.code);
                    return (
                      <label key={item.code} className="flex items-center space-x-2 text-xs text-slate-700 select-none cursor-pointer">
                        <input 
                          id={`icd-${item.code}`}
                          type="checkbox"
                          checked={isSel}
                          onChange={() => {
                            if (isSel) {
                              setSelectedIcds(selectedIcds.filter(c => c !== item.code));
                            } else {
                              setSelectedIcds([...selectedIcds, item.code]);
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="font-mono font-bold text-cyan-700">{item.code}</span>
                        <span className="truncate text-slate-600">{item.desc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">OPCS-4 Surgical/Procedural Codes</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                  {OPCS4_CODES.map((item) => {
                    const isSel = selectedOpcs.includes(item.code);
                    return (
                      <label key={item.code} className="flex items-center space-x-2 text-xs text-slate-700 select-none cursor-pointer">
                        <input 
                          id={`opcs-${item.code}`}
                          type="checkbox"
                          checked={isSel}
                          onChange={() => {
                            if (isSel) {
                              setSelectedOpcs(selectedOpcs.filter(c => c !== item.code));
                            } else {
                              setSelectedOpcs([...selectedOpcs, item.code]);
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="font-mono font-bold text-purple-700">{item.code}</span>
                        <span className="truncate text-slate-600">{item.desc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-50">
              <button
                id="btn-save-note"
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-sm transition"
              >
                Sign & Lock Note to EHR Chart
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
