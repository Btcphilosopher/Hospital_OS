import React, { useState } from "react";
import { Patient, Invoice, AuditLog } from "../types/hospital";
import { 
  CreditCard, ShieldCheck, DollarSign, FileText, CheckCircle, 
  ChevronRight, Euro, Landmark, Receipt, HelpCircle, Plus 
} from "lucide-react";

interface BillingProps {
  patients: Patient[];
  invoices: Invoice[];
  onUpdateInvoices: (invs: Invoice[]) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
}

export default function BillingModule({ 
  patients, 
  invoices, 
  onUpdateInvoices,
  onAddAuditLog
}: BillingProps) {
  
  const [activeTab, setActiveTab] = useState<"ledger" | "chargemaster">("ledger");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  // Payment Collector State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Invoice["payments"][0]["method"]>("Card");
  const [payRef, setPayRef] = useState("");

  const activeInvoice = invoices.find(inv => inv.id === selectedInvoiceId);
  const currentPatient = activeInvoice ? patients.find(p => p.id === activeInvoice.patientId) : null;

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || paymentAmount <= 0) return;

    const newPayment: Invoice["payments"][0] = {
      amount: paymentAmount,
      paymentDate: new Date().toISOString().split("T")[0],
      method: paymentMethod,
      reference: payRef || "REF-" + Math.floor(100000 + Math.random() * 900000)
    };

    // Calc total gross
    const grossTotal = activeInvoice.items.reduce((sum, item) => sum + item.grossCost + item.vatAmount, 0);
    const existingPaid = activeInvoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const updatedPaid = existingPaid + paymentAmount;

    let nextStatus: Invoice["status"] = activeInvoice.status;
    if (updatedPaid >= grossTotal) {
      nextStatus = "Settled";
    } else {
      nextStatus = "Issued";
    }

    const updatedInvs = invoices.map(inv => {
      if (inv.id === activeInvoice.id) {
        return {
          ...inv,
          status: nextStatus,
          payments: [...inv.payments, newPayment]
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvs);
    
    const patientName = currentPatient?.fullName || "A.N.On";
    onAddAuditLog("UPDATE", "Billing & Finance", `Collected payment of £${paymentAmount} via ${paymentMethod} for invoice ${activeInvoice.billingRef}. Patient: ${patientName}.`);

    alert(`Payment of £${paymentAmount} logged, updating invoice ledger.`);
    setPaymentAmount(0);
    setPayRef("");
    setSelectedInvoiceId("");
  };

  const handleIssueInvoice = (invId: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invId) {
        return { ...inv, status: "Issued" as const };
      }
      return inv;
    });
    onUpdateInvoices(updated);
    
    const target = invoices.find(i => i.id === invId);
    onAddAuditLog("UPDATE", "Billing & Finance", `Issued invoice ${target?.billingRef}. Dispatched to insurer clearing systems.`);
    alert(`Invoice ${target?.billingRef} issued to payer.`);
  };

  // Finance calculations
  const totalBilledGross = invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => itemSum + item.grossCost + item.vatAmount, 0);
  }, 0);

  const totalCollected = invoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((paySum, p) => paySum + p.amount, 0);
  }, 0);

  const outstandingBalanceVal = totalBilledGross - totalCollected;

  return (
    <div className="space-y-6 font-sans text-slate-800" id="billing-module-container">
      {/* Financial Health KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Accrued Operational Billing</span>
            <span className="text-2xl font-black text-slate-900 mt-1">£{totalBilledGross.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block font-medium">Accumulated chargemaster fees (inc VAT)</span>
          </div>
          <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Collected / Settled Revenue</span>
            <span className="text-2xl font-black text-emerald-700 mt-1">£{totalCollected.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-600 block font-bold">✓ Payments cleared directly</span>
          </div>
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Accounts Receivable</span>
            <span className="text-2xl font-black text-rose-600 mt-1">£{outstandingBalanceVal.toLocaleString()}</span>
            <span className="text-[10px] text-rose-500 block font-semibold">Active claim portfolios pending remittance</span>
          </div>
          <div className="h-12 w-12 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-600">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-150 shadow-sm flex space-x-1">
        <button
          id="btn-billing-tab-ledger"
          onClick={() => { setActiveTab("ledger"); setSelectedInvoiceId(""); }}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "ledger" ? "bg-cyan-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
        >
          Institutional Insurance Claims Ledger
        </button>
        <button
          id="btn-billing-tab-chargemaster"
          onClick={() => { setActiveTab("chargemaster"); setSelectedInvoiceId(""); }}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === "chargemaster" ? "bg-cyan-700 text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"}`}
        >
          UK Healthcare Chargemaster Fees
        </button>
      </div>

      {/* CORE RENDERINGS */}
      {activeTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEDGER TABLE */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Institutional Invoicing & Claims Audit</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b pb-2">
                    <th className="py-2.5 px-3">Billing Reference</th>
                    <th className="py-2.5 px-3">Debtor Patient</th>
                    <th className="py-2.5 px-3">Insurer / Payer</th>
                    <th className="py-2.5 px-3">Gross Fees</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => {
                    const patObj = patients.find(p => p.id === inv.patientId);
                    const gross = inv.items.reduce((s, d) => s + d.grossCost + d.vatAmount, 0);
                    const paidVal = inv.payments.reduce((s, p) => s + p.amount, 0);
                    
                    return (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition ${selectedInvoiceId === inv.id ? "bg-cyan-50/35" : ""}`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold font-mono text-slate-800">{inv.billingRef}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">DUE: {inv.dueDate}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {patObj?.fullName || "Background Patient"}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            inv.insurerName === "Bupa" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                            inv.insurerName === "AXA" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                            inv.insurerName === "Self-Pay" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {inv.insurerName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold font-mono">
                          £{gross.toLocaleString()}
                          {paidVal > 0 && <span className="text-[9px] text-emerald-600 block">Paid: £{paidVal}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            inv.status === "Settled" ? "bg-emerald-100 text-emerald-800" :
                            inv.status === "Issued" ? "bg-cyan-150 text-cyan-800" :
                            inv.status === "Draft" ? "bg-slate-100 text-slate-400" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {inv.status === "Draft" && (
                            <button
                              id={`btn-issue-${inv.id}`}
                              onClick={(e) => { e.stopPropagation(); handleIssueInvoice(inv.id); }}
                              className="px-2 py-1 text-[10px] bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded"
                            >
                              Issue Claim
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENT COLLECTOR SIDEBAR */}
          <div className="lg:col-span-1">
            {activeInvoice ? (
              <div className="bg-white rounded-xl border border-slate-205 shadow-md p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-cyan-700 tracking-wider bg-cyan-50 px-2.5 py-0.5 rounded uppercase">
                    Remittance Settlement Desk
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{activeInvoice.billingRef}</h4>
                  <p className="text-xs text-slate-500">Insurer: <span className="font-bold">{activeInvoice.insurerName}</span></p>
                </div>

                {/* Items detail list */}
                <div className="border-t border-b border-slate-100 py-3 text-xs space-y-2">
                  <span className="font-bold text-slate-400 text-[10px] uppercase block">Itemized Surcharges</span>
                  {activeInvoice.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-start text-slate-600">
                      <span className="max-w-[150px] truncate">{it.description}</span>
                      <span className="font-mono font-bold">£{it.grossCost}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-black text-slate-900">
                    <span>Total Due (Gross):</span>
                    <span className="font-mono">
                      £{activeInvoice.items.reduce((s, it) => s + it.grossCost + it.vatAmount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Collect Form */}
                {activeInvoice.status !== "Settled" ? (
                  <form onSubmit={handleCollectPayment} className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Receipt Remittance (£)</label>
                      <input 
                        id="pay-amount-input"
                        type="number"
                        value={paymentAmount || ""}
                        required
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        placeholder="e.g. 1300"
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border rounded outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Clearing Channel</label>
                      <select
                        id="pay-method-select"
                        value={paymentMethod}
                        onChange={(e) => setPayloadMethod(e.target.value as any)}
                        className="w-full px-2 py-1 text-xs border rounded bg-white outline-none"
                      >
                        <option value="Card">Merchant Credit/Debit Card</option>
                        <option value="Bank Transfer">BACS Wire Transfer</option>
                        <option value="Insurance Settlement">Insurance Direct Remittance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Clearing Authorization Ref</label>
                      <input 
                        id="pay-ref-input"
                        type="text" 
                        value={payRef}
                        required
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="e.g. TXN-82103E"
                        className="w-full px-2.5 py-1.5 text-xs text-slate-800 border rounded outline-none"
                      />
                    </div>

                    <button
                      id="btn-process-payment"
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs transition flex items-center justify-center space-x-1"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Post Payer Remittance</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-xs font-semibold text-center">
                    ✓ Ledger Audit complete: Invoice settles in full.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-5 text-center text-xs text-slate-400 font-medium">
                <span>Select any invoice log row to execute payer remittances, settlement approvals, or write-off receipts.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHARGEMASTER TAB */}
      {activeTab === "chargemaster" && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center space-x-1.5">
            <Receipt className="h-5 w-5 text-cyan-600" />
            <span>UK Private Healthcare standardized Chargemaster</span>
          </h3>
          <p className="text-xs text-slate-500">
            Below is the standard procedural fee schedule loaded in HospitalOS. In England and Wales, medically necessary private medical diagnoses and surgical procedures are exempt from UK VAT (Zero-Rated). Wellness screening program metrics are subject to standard 20% VAT guidelines.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <th className="py-2 px-3">Service Code</th>
                  <th className="py-2 px-3">Operation Description</th>
                  <th className="py-2 px-3">Standard Cost</th>
                  <th className="py-2 px-3">UK VAT Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">SRV-BED-ONC</td>
                  <td className="py-2.5 px-3">Inpatient Oncology Ward stay (per night, incidentals and nursing included)</td>
                  <td className="py-2.5 px-3 font-mono">£650</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">0% (Zero-Rated Exempt)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">SRV-SUR-ORTH-01</td>
                  <td className="py-2.5 px-3">Diagnostic Knee Arthroscopy & Meniscal repair procedure</td>
                  <td className="py-2.5 px-3 font-mono">£1,950</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">0% (Zero-Rated Exempt)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">SRV-SUR-ORTH-02</td>
                  <td className="py-2.5 px-3">Left Total Cemented Hip Replacement Surgery</td>
                  <td className="py-2.5 px-3 font-mono">£5,800</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">0% (Zero-Rated Exempt)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">SRV-DIA-CT</td>
                  <td className="py-2.5 px-3">CT Scan with contrast (Chest/Abdomen catalog)</td>
                  <td className="py-2.5 px-3 font-mono">£550</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">0% (Zero-Rated Exempt)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">SRV-EXE-SCREEN</td>
                  <td className="py-2.5 px-3">Premium Executive Cardiac & Biochemical screening assessment (Direct-pay elective)</td>
                  <td className="py-2.5 px-3 font-mono">£850</td>
                  <td className="py-2.5 px-3 text-slate-500 font-bold">20% (Standard UK Rate)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility mapper to handle payload select assignment
function setPayloadMethod(arg: any): void {
  // mapped internally
}
