import React, { useState } from "react";
import { Patient, DiagnosticTest, AuditLog } from "../types/hospital";
import { 
  Dna, Image, Send, ShieldAlert, CheckCircle, Hourglass, 
  ChevronRight, Clipboard, HelpCircle, RefreshCw, Layers 
} from "lucide-react";

interface DiagnosticsProps {
  patients: Patient[];
  selectedPatientId: string;
  diagnostics: DiagnosticTest[];
  onAddDiagnostic: (test: DiagnosticTest) => void;
  onUpdateDiagnostics: (tests: DiagnosticTest[]) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

const SAMPLE_TEMPLATES = [
  { name: "Full Blood Count (FBC)", type: "Pathology", dept: "Haematology", tube: "EDTA Purple Tube", desc: "Checks hemoglobin, white cell differentials, platelets." },
  { name: "Urea & Electrolytes (U&Es)", type: "Pathology", dept: "Biochemistry", tube: "Serum Ochre Tube", desc: "Evaluates kidney function, sodium, potassium values." },
  { name: "CT Abdomen & Pelvis", type: "Radiology", dept: "CT", tube: "N/A", desc: "Renders spatial slices of intra-abdominal anatomy." },
  { name: "Chest X-Ray (A/P view)", type: "Radiology", dept: "X-Ray", tube: "N/A", desc: "Inspects lungs, thoracic borders, pleural cavities." },
  { name: "MRI Brain with Contrast", type: "Radiology", dept: "MRI", tube: "N/A", desc: "High-resolution axial and sagittal neurologic maps." }
];

export default function DiagnosticsModule({ 
  patients, 
  selectedPatientId, 
  diagnostics, 
  onAddDiagnostic, 
  onUpdateDiagnostics,
  onAddAuditLog
}: DiagnosticsProps) {
  
  const [activePatientId, setActivePatientId] = useState(selectedPatientId || patients[0]?.id || "");
  const [activeFilter, setActiveFilter] = useState<"All" | "Pathology" | "Radiology">("All");

  // Order Form
  const [templateIndex, setTemplateIndex] = useState(0);
  const [priority, setPriority] = useState<DiagnosticTest["priority"]>("Routine");
  const [clinicalBrief, setClinicalBrief] = useState("");

  const currentPatient = patients.find(p => p.id === activePatientId) || patients[0];

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;

    const chosenTemp = SAMPLE_TEMPLATES[templateIndex];

    const newTest: DiagnosticTest = {
      id: "diag-" + Date.now(),
      patientId: currentPatient.id,
      testName: chosenTemp.name,
      type: chosenTemp.type as DiagnosticTest["type"],
      department: chosenTemp.dept as DiagnosticTest["department"],
      orderedBy: "Dr. Alastair Sterling",
      orderedAt: new Date().toISOString(),
      status: "Ordered",
      category: chosenTemp.type === "Pathology" ? "Biochemistry" : "Imaging",
      priority,
      criticalResult: false,
      clinicalFindings: clinicalBrief,
      metadata: chosenTemp.type === "Pathology" ? { tubeType: chosenTemp.tube } : { scannerModel: "General Electric Medical", imageResolution: "1024x1024px" }
    };

    onAddDiagnostic(newTest);

    // timeline log
    currentPatient.timeline.unshift({
      id: "t-diag-" + Date.now(),
      timestamp: new Date().toISOString(),
      type: "Clinical Note",
      description: `Diagnostic test ordered: ${newTest.testName}. Priority: ${newTest.priority}`,
      author: "Dr. Alastair Sterling"
    });

    onAddAuditLog("CREATE", "Diagnostics", `Ordered Diagnostic testing: ${newTest.testName} (Priority: ${priority}) for patient ${currentPatient.fullName}`);

    // Reset Form
    setClinicalBrief("");
    alert("Diagnostic request successfully registered and dispatched to technical ward systems.");
  };

  const handleAdvanceStatus = (testId: string, nextStatus: DiagnosticTest["status"]) => {
    // We will simulate generating some results when status transitions to "Result Completed"
    const updated = diagnostics.map(d => {
      if (d.id === testId) {
        let updateObj: Partial<DiagnosticTest> = { status: nextStatus };
        
        if (nextStatus === "Result Completed") {
          // Generate a synthetic mock result depending on test name
          if (d.testName.includes("Blood Count")) {
            updateObj.resultReport = "Hb: 142 g/L (Normal), WBC: 7.8 x 10^9/L (Normal), Platelets: 230 x 10^9/L (Normal).";
            updateObj.criticalResult = false;
          } else if (d.testName.includes("Urea")) {
            // Check if patient David Cooper (usually cardiac) to trigger simulated high potassium critical
            updateObj.resultReport = "Sodium: 139 mmol/L, Potassium: 5.9 mmol/L (ELEVATED), Creatinine: 110 umol/L (Mild elevation).";
            updateObj.criticalResult = true; // Alerts clinician!
            updateObj.clinicalFindings = "Mild acute kidney injury profile with hyperkalemia traits. Suggest review therapeutics.";
          } else if (d.testName.includes("X-Ray")) {
            updateObj.resultReport = "Chest film shows clear lung fields, normal cardiothoracic ratio, no focal consolidations or effusion.";
            updateObj.criticalResult = false;
          } else {
            updateObj.resultReport = "Synthesized Diagnostic Study returns normal physiological spectrum. Slice parameters verified.";
            updateObj.criticalResult = false;
          }
        }
        return { ...d, ...updateObj };
      }
      return d;
    });

    onUpdateDiagnostics(updated);
    
    const targetTest = diagnostics.find(t => t.id === testId);
    onAddAuditLog("UPDATE", "Diagnostics", `Advanced Diagnostic status for test ${targetTest?.testName} to status '${nextStatus}'`);
  };

  const filteredDiagnostics = diagnostics.filter(d => {
    const matchesPatient = d.patientId === currentPatient.id;
    const matchesType = activeFilter === "All" || d.type === activeFilter;
    return matchesPatient && matchesType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans" id="diag-module-grid">
      {/* COLUMN 1: PATIENT & ORDER CONSOLE */}
      <div className="lg:col-span-1 space-y-4">
        {/* Patient Selection Box */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 font-sans">Patient Diagnostics Chart</label>
          <select 
            id="diag-patient-select"
            value={activePatientId}
            onChange={(e) => setActivePatientId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white font-semibold text-slate-800"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName} (NHS: {p.nhsNumber})</option>
            ))}
          </select>
        </div>

        {/* ORDER FORM */}
        <form onSubmit={handleOrderSubmit} className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center space-x-1.5">
            <Clipboard className="h-4 w-4 text-cyan-600" />
            <span>Order Lab / Radiology Test</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Diagnostic Catalog</label>
            <select
              id="diag-catalog-select"
              value={templateIndex}
              onChange={(e) => setTemplateIndex(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 bg-white rounded outline-none"
            >
              {SAMPLE_TEMPLATES.map((t, idx) => (
                <option key={idx} value={idx}>{t.name} ({t.type})</option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
              {SAMPLE_TEMPLATES[templateIndex].desc}
              {SAMPLE_TEMPLATES[templateIndex].tube !== "N/A" && (
                <span className="block font-bold text-cyan-700 mt-0.5">Collect: {SAMPLE_TEMPLATES[templateIndex].tube}</span>
              )}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Clinical Priority</label>
            <select
              id="diag-priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as DiagnosticTest["priority"])}
              className="w-full px-3 py-1.5 text-xs text-slate-800 border border-slate-200 bg-white rounded outline-none"
            >
              <option value="Routine">Routine Elective</option>
              <option value="Urgent">Urgent Ward</option>
              <option value="STAT">STAT Emergency (15-min TAT)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Clinical Brief / Indications</label>
            <textarea
              id="diag-indications"
              rows={3}
              value={clinicalBrief}
              onChange={(e) => setClinicalBrief(e.target.value)}
              placeholder="e.g. Rule out deep tissue collection, neutrophil check post oncology chemotherapy round..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded outline-none"
            />
          </div>

          <button
            id="btn-order-submit"
            type="submit"
            className="w-full py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded shadow-xs transition flex items-center justify-center space-x-1"
          >
            <Send className="h-3 w-3" />
            <span>Transmit Diagnostic Order</span>
          </button>
        </form>
      </div>

      {/* COLUMN 2 & 3: LIVE TESTS VIEW & PACS SIMULATOR */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-base font-bold text-slate-900">Diagnostic Order Board</h3>
            {/* Filter */}
            <div className="flex space-x-1.5 text-xs">
              {["All", "Pathology", "Radiology"].map((type) => (
                <button
                  id={`btn-diag-filter-${type}`}
                  key={type}
                  onClick={() => setActiveFilter(type as any)}
                  className={`px-2 py-1 rounded font-semibold border transition ${activeFilter === type ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white text-slate-500"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {filteredDiagnostics.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No active diagnostic orders recorded for this patient file yet.
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {filteredDiagnostics.map((d, index) => (
                <div key={d.id} className={`pt-4 first:pt-0 space-y-3 ${d.criticalResult ? "bg-rose-50/20 px-3 py-2 rounded-xl border border-rose-100" : ""}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 flex-wrap">
                        {d.type === "Pathology" ? <Dna className="h-4 w-4 text-indigo-600" /> : <Image className="h-4 w-4 text-emerald-600" />}
                        <span>{d.testName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          d.priority === "STAT" ? "bg-rose-100 text-rose-800 animate-pulse" :
                          d.priority === "Urgent" ? "bg-amber-100 text-amber-800" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {d.priority}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        UID: {d.id} • Dept: {d.department} • Ordered: {new Date(d.orderedAt).toLocaleTimeString("en-GB")}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      d.status === "Ordered" ? "bg-slate-50 text-slate-600 ring-slate-500/10" :
                      d.status === "Sample Collected" ? "bg-blue-50 text-blue-700 ring-blue-700/10" :
                      d.status === "In Laboratory" ? "bg-amber-50 text-amber-700 ring-amber-700/10" :
                      "bg-emerald-50 text-emerald-700 ring-emerald-700/10"
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  {/* Clinical Indications Brief */}
                  {d.clinicalFindings && (
                    <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-50">
                      Indications: "{d.clinicalFindings}"
                    </div>
                  )}

                  {/* Technical result output */}
                  {d.status === "Result Completed" && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center border-b pb-1.5 border-slate-200">
                        <span className="text-xs font-bold text-slate-800 font-sans uppercase">Pathological Findings Summary</span>
                        {d.criticalResult && (
                          <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase animate-bounce">
                            CRITICAL VALUE ALERT
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-700 leading-relaxed">{d.resultReport}</p>
                      {d.clinicalFindings && <p className="text-[11px] text-slate-400 italic">Interp: {d.clinicalFindings}</p>}
                      
                      {/* Technical metadata scanner details for PACS validation */}
                      {d.metadata && (
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1.5 border-t border-slate-150">
                          {d.metadata.tubeType && <div><span className="font-semibold text-slate-500">Tube:</span> {d.metadata.tubeType}</div>}
                          {d.metadata.scannerModel && <div><span className="font-semibold text-slate-500">Scanner:</span> {d.metadata.scannerModel}</div>}
                          {d.metadata.radiationDose && <div><span className="font-semibold text-slate-500">Dose:</span> {d.metadata.radiationDose}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Simulator buttons */}
                  {d.status !== "Result Completed" && (
                    <div className="flex justify-end space-x-1.5 text-xs font-semibold">
                      {d.status === "Ordered" && d.type === "Pathology" && (
                        <button
                          id={`btn-collect-${d.id}`}
                          onClick={() => handleAdvanceStatus(d.id, "Sample Collected")}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Collect Sample (Tube)
                        </button>
                      )}
                      {(d.status === "Ordered" || d.status === "Sample Collected") && (
                        <button
                          id={`btn-process-${d.id}`}
                          onClick={() => handleAdvanceStatus(d.id, "In Laboratory")}
                          className="px-2.5 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
                        >
                          {d.type === "Pathology" ? "Process in Lab" : "Perform scan"}
                        </button>
                      )}
                      {d.status === "In Laboratory" && (
                        <button
                          id={`btn-report-${d.id}`}
                          onClick={() => handleAdvanceStatus(d.id, "Result Completed")}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          Publish Finding Reports
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
