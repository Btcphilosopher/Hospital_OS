import React, { useState } from "react";
import { AuditLog } from "../types/hospital";
import { 
  ShieldCheck, Lock, Activity, RefreshCw, KeyRound, 
  CheckCircle2, AlertOctagon, HelpCircle, GraduationCap, ServerCrash 
} from "lucide-react";

interface GovernanceProps {
  auditLogs: AuditLog[];
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

export default function GovernanceModule({ auditLogs, onAddAuditLog }: GovernanceProps) {
  const [activeTab, setActiveTab] = useState<"cqc" | "audit" | "gdpr">("audit");

  const [cqcChecklist, setCqcChecklist] = useState([
    { id: "cqc-1", domain: "SAFE", task: "Daily resuscitation crash-carts fully checked and stocked", done: true },
    { id: "cqc-2", domain: "SAFE", task: "Controlled Drug (CD) pharmacy double-signature audits complete", done: true },
    { id: "cqc-3", domain: "EFFECTIVE", task: "NEWS2 scoring automated alerts configured in patient wards", done: true },
    { id: "cqc-4", domain: "CARING", task: "Safeguarding Level 3 training completed for senior charge ward nurses", done: true },
    { id: "cqc-5", domain: "RESPONSIVE", task: "Urgent Care ER wait time telemetry reports synced with national registries", done: false },
    { id: "cqc-6", domain: "WELL-LED", task: "Duty of Candour disclosure guidelines active in adverse event policies", done: true }
  ]);

  const [gdprConsents, setGdprConsents] = useState([
    { id: "g-1", subject: "NHS Spine demographic matching authorization", active: true },
    { id: "g-2", subject: "Direct Care Electronic Summary Care Record integration", active: true },
    { id: "g-3", subject: "Anonymized Medical Research data mining contribution (Optional)", active: false },
    { id: "g-4", subject: "Private Insurance AXA/Bupa direct automated billing release", active: true }
  ]);

  const handleToggleCqc = (id: string) => {
    const updated = cqcChecklist.map(item => {
      if (item.id === id) {
        const nextState = !item.done;
        onAddAuditLog("UPDATE", "Clinical Governance", `CQC Compliance check '${item.task}' toggled to state: ${nextState ? "APPROVED" : "PENDING"}`);
        return { ...item, done: nextState };
      }
      return item;
    });
    setCqcChecklist(updated);
  };

  const handleToggleGdpr = (id: string) => {
    const updated = gdprConsents.map(item => {
      if (item.id === id) {
        const nextState = !item.active;
        onAddAuditLog("UPDATE", "GDPR Compliance", `GDPR Consent release '${item.subject}' toggled to: ${nextState ? "CONSENT_GIVEN" : "CONSENT_WITHDRAWN"}`);
        return { ...item, active: nextState };
      }
      return item;
    });
    setGdprConsents(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800" id="governance-module-grid">
      {/* COLUMN 1: CONTROL SELECTION */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Internal Audits</label>
          <div className="space-y-1 pt-1.5">
            <button
              id="btn-gov-tab-audit"
              onClick={() => setActiveTab("audit")}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-left flex items-center justify-between ${activeTab === "audit" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>Immutable System Audit Trail</span>
              <Lock className="h-4 w-4" />
            </button>
            <button
              id="btn-gov-tab-cqc"
              onClick={() => setActiveTab("cqc")}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-left flex items-center justify-between ${activeTab === "cqc" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>CQC Quality Assurance</span>
              <ShieldCheck className="h-4 w-4" />
            </button>
            <button
              id="btn-gov-tab-gdpr"
              onClick={() => setActiveTab("gdpr")}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-left flex items-center justify-between ${activeTab === "gdpr" ? "bg-cyan-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span>UK GDPR & Patient Consents</span>
              <KeyRound className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Security / System compliance summary block */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs space-y-3 text-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">System Security Credentials</span>
          <div className="space-y-1.5 text-slate-600 font-medium">
            <div className="flex justify-between"><span>JWT Session Status:</span> <span className="text-emerald-700 font-bold">✓ Secured Active</span></div>
            <div className="flex justify-between"><span>E2E Transit Encryption:</span> <span className="text-emerald-700 font-bold">✓ TLS v1.3</span></div>
            <div className="flex justify-between"><span>At-Rest Storage Encryption:</span> <span className="text-emerald-700 font-bold">✓ AES-256</span></div>
            <div className="flex justify-between"><span>CQC Rating Baseline:</span> <span className="font-extrabold text-cyan-700">✓ Outstanding</span></div>
          </div>
        </div>
      </div>

      {/* COLUMNS 2 & 3: DETAILS */}
      <div className="lg:col-span-2">
        {/* AUDIT LOG TAB */}
        {activeTab === "audit" && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
                <Lock className="h-4.5 w-4.5 text-cyan-600" />
                <span>Immutable Cryptographic Audit Trail Ledger</span>
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                Chain height: {auditLogs.length} Blocks
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500">
              In accordance with UK GDPR and CQC clinical guidelines, all system transactions within HospitalOS are permanently sealed into an immutable, cryptographic chronological audit trail. Record creations, viewings, merges, and prescriptions cannot be overwritten or deleted.
            </p>

            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-200/50 p-1 px-2.5 rounded-md font-mono text-[10px]">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-slate-700">SHA-256:</span>
                      <span className="text-cyan-700 font-semibold">{log.hash}</span>
                    </div>
                    <span className="text-emerald-700 font-extrabold flex items-center space-x-0.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>VALIDATED</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">
                        Module action: <span className="text-cyan-700">{log.actionType}</span> in <span className="font-semibold text-slate-700">{log.moduleName}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px] mt-1 italic">"{log.details}"</p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <span className="font-semibold text-slate-600 block">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-bold block">{log.userRole}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono text-right border-t border-slate-150 pt-1.5 mt-1.5">
                    Sealed Timestamp: {new Date(log.timestamp).toLocaleTimeString("en-GB")} {new Date(log.timestamp).toLocaleDateString("en-GB")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CQC TAB */}
        {activeTab === "cqc" && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Care Quality Commission (CQC) Compliance Board</h3>
            <p className="text-xs text-slate-500">
              The CQC regulates health care providers in England. Our built-in whiteboard lists the necessary safety assertions, daily logs, and revalidation benchmarks required to maintain the hospital's 'Outstanding' baseline rating.
            </p>

            <div className="space-y-2 text-xs">
              {cqcChecklist.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                      item.domain === "SAFE" ? "bg-rose-50 border-rose-200 text-rose-700" :
                      item.domain === "EFFECTIVE" ? "bg-cyan-50 border-cyan-200 text-cyan-700" :
                      "bg-indigo-50 border-indigo-200 text-indigo-700"
                    }`}>
                      {item.domain}
                    </span>
                    <div className="font-semibold text-slate-700 mt-1">{item.task}</div>
                  </div>

                  <button
                    id={`btn-cqc-toggle-${item.id}`}
                    onClick={() => handleToggleCqc(item.id)}
                    className={`px-3 py-1 font-bold whitespace-nowrap rounded text-[10px] transition ${item.done ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 text-slate-500"}`}
                  >
                    {item.done ? "✓ Compliant" : "⛔ PENDING"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GDPR TAB */}
        {activeTab === "gdpr" && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">UK GDPR Data Controllership and Releases</h3>
            <p className="text-xs text-slate-500">
              Under the Data Protection Act (DPA 2108), medical entities must maintain explicit controllership consent maps. Patients can opt out of electronic summaries or research panels as requested during admissions.
            </p>

            <div className="space-y-2 text-xs">
              {gdprConsents.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-700">{item.subject}</span>
                  <button
                    id={`btn-gdpr-toggle-${item.id}`}
                    onClick={() => handleToggleGdpr(item.id)}
                    className={`px-3 py-1 font-bold rounded text-[10px] transition ${item.active ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}
                  >
                    {item.active ? "CONSENT ACTIVE" : "OPTED OUT"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
