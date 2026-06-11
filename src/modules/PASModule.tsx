import React, { useState } from "react";
import { Patient, AuditLog } from "../types/hospital";
import { 
  Search, UserPlus, ShieldAlert, AlertCircle, RefreshCw, 
  UserCheck, Layers, ArrowRight, CheckCircle, HelpCircle, FileText 
} from "lucide-react";

interface PASProps {
  patients: Patient[];
  onAddPatient: (p: Patient) => void;
  onSelectPatient: (id: string, module: string) => void;
  onAddAuditLog: (action: AuditLog["actionType"], module: string, details: string) => void;
  onMergePatients: (idToKeep: string, idToRemove: string, mergedData: Patient) => void;
}

export default function PASModule({ patients, onAddPatient, onSelectPatient, onAddAuditLog, onMergePatients }: PASProps) {
  const [activeTab, setActiveTab] = useState<"search" | "register" | "duplicates">("search");
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState("");

  // New Patient state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [nextOfKinRel, setNextOfKinRel] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("Self-Pay");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [gpDetails, setGpDetails] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [flagSelection, setFlagSelection] = useState<string[]>([]);

  // Duplicate detection states
  const [selectedParent, setSelectedParent] = useState<Patient | null>(null);
  const [selectedChild, setSelectedChild] = useState<Patient | null>(null);

  // Generate a mock UK NHS Number (3-3-4 format)
  const generateNHSNumber = () => {
    const r1 = Math.floor(100 + Math.random() * 900);
    const r2 = Math.floor(100 + Math.random() * 900);
    const r3 = Math.floor(1000 + Math.random() * 9000);
    return `${r1} ${r2} ${r3}`;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !dob) {
      alert("First Name, Last Name and Date of Birth are mandatory.");
      return;
    }

    const newPat: Patient = {
      id: "pat-" + (patients.length + 1) + "-" + Math.floor(Math.random() * 1000),
      nhsNumber: generateNHSNumber(),
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      dob,
      gender,
      address,
      phone,
      email,
      emergencyContact: {
        name: nextOfKinName,
        relationship: nextOfKinRel,
        phone: nextOfKinPhone
      },
      insurance: {
        provider: insuranceProvider,
        policyNumber: insurancePolicy || "N/A",
        status: "Verified"
      },
      gpDetails: gpDetails || "NHS GP Local Practice",
      allergies: allergiesInput ? allergiesInput.split(",").map(s => s.trim()).filter(Boolean) : [],
      flags: flagSelection,
      alerts: [],
      timeline: [
        {
          id: "t-reg-" + Date.now(),
          timestamp: new Date().toISOString(),
          type: "Admission",
          description: "Patient registered on HospitalOS. Identity checks verified via NHS Spine search.",
          author: "PAS Administration"
        }
      ]
    };

    onAddPatient(newPat);
    onAddAuditLog("CREATE", "PAS", `Registered new patient ${newPat.fullName} (ID: ${newPat.id}, NHS: ${newPat.nhsNumber})`);
    
    // Reset fields
    setFirstName("");
    setLastName("");
    setDob("");
    setAddress("");
    setPhone("");
    setEmail("");
    setNextOfKinName("");
    setNextOfKinPhone("");
    setNextOfKinRel("");
    setInsurancePolicy("");
    setGpDetails("");
    setAllergiesInput("");
    setFlagSelection([]);
    
    setActiveTab("search");
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.nhsNumber.replace(/\s/g, "").includes(searchTerm.replace(/\s/g, "")) ||
                          p.dob.includes(searchTerm);
    const matchesGender = genderFilter ? p.gender === genderFilter : true;
    const matchesInsurance = insuranceFilter ? p.insurance.provider === insuranceFilter : true;
    return matchesSearch && matchesGender && matchesInsurance;
  });

  // Simple duplicate detection algorithm (simulate)
  // For demonstration, let's offer to create a mock duplicate "Arthur P. Pendleton" if it doesn't exist
  const triggerSimulatedDuplicate = () => {
    const extraDuplicate: Patient = {
      id: "pat-dup-arthur",
      nhsNumber: "673 892 4110", // Shared NHS number!
      fullName: "Arthur P. Pendleton",
      firstName: "Arthur P.",
      lastName: "Pendleton",
      dob: "1948-11-23", // Exact same DOB!
      gender: "Male",
      address: "12 Queen's Gate Flats, Kensington, SW7 5EH",
      phone: "07700 900077",
      email: "arthur.pendleton@example.co.uk",
      emergencyContact: {
        name: "Eleanor Pendleton",
        relationship: "Wife",
        phone: "07700 900081"
      },
      insurance: {
        provider: "Bupa",
        policyNumber: "BP-992-10",
        status: "Unverified"
      },
      gpDetails: "Chelsea Medical Practice",
      allergies: ["Penicillin"],
      flags: ["Infection Risk"],
      alerts: [],
      timeline: [
        {
          id: "t-dup-1",
          timestamp: "2026-06-11T05:22:00Z",
          type: "Clinical Note",
          description: "Patient self-registered via Emergency Lobby tablet as Arthur P Pendleton.",
          author: "Pre-Reg Terminal"
        }
      ]
    };
    
    if (!patients.some(p => p.id === "pat-dup-arthur")) {
      onAddPatient(extraDuplicate);
      onAddAuditLog("CREATE", "PAS", "Simulated Duplicate patient Arthur P. Pendleton injected system-side to trigger detection protocols.");
    }
  };

  // Find duplicates
  const detectDuplicates = () => {
    const dups: { p1: Patient; p2: Patient; score: number }[] = [];
    for (let i = 0; i < patients.length; i++) {
      for (let j = i + 1; j < patients.length; j++) {
        const p1 = patients[i];
        const p2 = patients[j];
        if (p1.id === p2.id) continue;
        
        let score = 0;
        if (p1.nhsNumber === p2.nhsNumber && p1.nhsNumber !== "N/A") score += 50;
        if (p1.lastName.toLowerCase() === p2.lastName.toLowerCase()) score += 20;
        if (p1.dob === p2.dob) score += 20;
        if (p1.firstName.toLowerCase().substring(0, 3) === p2.firstName.toLowerCase().substring(0, 3)) score += 10;
        
        if (score >= 40) {
          dups.push({ p1, p2, score });
        }
      }
    }
    return dups;
  };

  const activeDuplicates = detectDuplicates();

  const handleExecuteMerge = () => {
    if (!selectedParent || !selectedChild) return;

    // Construct merged patient
    const mergedPatient: Patient = {
      ...selectedParent,
      // Union of timelines, sorted by time
      timeline: [...selectedParent.timeline, ...selectedChild.timeline].sort((a,b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      // Union of allergies
      allergies: Array.from(new Set([...selectedParent.allergies, ...selectedChild.allergies])),
      // Union of flags
      flags: Array.from(new Set([...selectedParent.flags, ...selectedChild.flags])),
      alerts: Array.from(new Set([...selectedParent.alerts, ...selectedChild.alerts])),
    };

    onMergePatients(selectedParent.id, selectedChild.id, mergedPatient);
    onAddAuditLog("PATIENT_MERGE", "PAS", `Merged patient '${selectedChild.fullName}' (ID: ${selectedChild.id}) into master patient record '${selectedParent.fullName}' (ID: ${selectedParent.id}). Unified Clinical Timelines.`);
    
    setSelectedParent(null);
    setSelectedChild(null);
    alert("Merge Completed Successfully! Records have been unified and indexed under NHS Spine registries.");
  };

  return (
    <div className="space-y-6" id="pas-module-container">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 font-sans">Patient Administration System (PAS)</h2>
          <p className="text-sm text-slate-500 mt-1">Manage NHS and Private records, identity verification, waiting lists, and de-duplication engines.</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button 
            id="tab-search"
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "search" ? "bg-cyan-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            Search Patients
          </button>
          <button 
            id="tab-register"
            onClick={() => setActiveTab("register")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "register" ? "bg-cyan-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            Register Patient
          </button>
          <button 
            id="tab-duplicates"
            onClick={() => setActiveTab("duplicates")}
            className={`px-4 py-2 text-sm font-medium rounded-lg relative transition-all ${activeTab === "duplicates" ? "bg-cyan-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            Merge Engine
            {activeDuplicates.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {activeDuplicates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SEARCH TAB */}
      {activeTab === "search" && (
        <div className="space-y-4 font-sans">
          {/* Filtering controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                id="pas-text-search"
                type="text"
                placeholder="Search by name, NHS number, DOB (e.g. FBC)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <select
                id="pas-gender-filter"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <select
                id="pas-insurance-filter"
                value={insuranceFilter}
                onChange={(e) => setInsuranceFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
              >
                <option value="">All Invoices / Payers</option>
                <option value="Bupa">Bupa</option>
                <option value="AXA">AXA</option>
                <option value="Self-Pay">Self-Pay</option>
                <option value="NHS-Funded">NHS-Funded</option>
              </select>
            </div>
          </div>

          {/* Quick inject duplicate button for demo */}
          {!patients.some(p => p.id === "pat-dup-arthur") && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>Simulate a patient collision alert to demonstrate duplicate detection and clinical merging?</span>
              </div>
              <button 
                id="btn-simulate-dup"
                onClick={triggerSimulatedDuplicate}
                className="bg-amber-600 text-white font-medium px-3 py-1 rounded hover:bg-amber-700 transition"
              >
                Inject Duplicate
              </button>
            </div>
          )}

          {/* Patient list */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">NHS Number / Unified ID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Date of Birth (Age)</th>
                    <th className="py-3 px-4">Active Flags & Safety</th>
                    <th className="py-3 px-4">Primary Payer</th>
                    <th className="py-3 px-4 text-right">Clinical Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active registered patient files found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map(p => {
                      const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 font-mono">{p.nhsNumber}</div>
                            <div className="text-slate-400 text-xs font-mono">ID: {p.id}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {p.fullName}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-700">{p.dob}</div>
                            <div className="text-slate-400 text-xs">{age} years • {p.gender}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {p.flags.map((fl, idx) => (
                                <span key={idx} className="bg-cyan-50 text-cyan-700 border border-cyan-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {fl}
                                </span>
                              ))}
                              {p.alerts.map((al, idx) => (
                                <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                                  <AlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                                  <span>{al}</span>
                                </span>
                              ))}
                              {p.allergies.length > 0 && (
                                <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  ALLERGIES: {p.allergies.join(", ")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              p.insurance.provider === "Bupa" ? "bg-blue-50 text-blue-700 ring-blue-700/10" :
                              p.insurance.provider === "AXA" ? "bg-purple-50 text-purple-700 ring-purple-700/10" :
                              p.insurance.provider === "Self-Pay" ? "bg-amber-50 text-amber-700 ring-amber-700/10" :
                              "bg-emerald-50 text-emerald-700 ring-emerald-700/10"
                            }`}>
                              {p.insurance.provider}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => onSelectPatient(p.id, "EHR")}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-cyan-700 border border-cyan-200 hover:bg-cyan-50 shadow-2xs"
                              >
                                EHR Chart
                              </button>
                              <button
                                onClick={() => onSelectPatient(p.id, "Ward")}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-cyan-700 text-white hover:bg-cyan-800 shadow-2xs"
                              >
                                Allocate Bed
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER TAB */}
      {activeTab === "register" && (
        <form onSubmit={handleRegister} className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6 font-sans">
          <div>
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">NHS Spine Matching & Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">First Name *</label>
                <input 
                  id="reg-first-name"
                  type="text" 
                  value={firstName} 
                  required
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Arthur"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Last Name *</label>
                <input 
                  id="reg-last-name"
                  type="text" 
                  value={lastName} 
                  required
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Pendleton"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date of Birth *</label>
                <input 
                  id="reg-dob"
                  type="date" 
                  value={dob} 
                  required
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gender Identity</label>
                <select 
                  id="reg-gender"
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 bg-white outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Not Declared</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Home Address (Wales & England Registries)</label>
                <input 
                  id="reg-address"
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 12 Queen's Gate, London, SW7 5EH"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mobile Contact Phone</label>
                <input 
                  id="reg-phone"
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 07700 900123"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                <input 
                  id="reg-email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@example.co.uk"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Registered GP Medicine Practice</label>
                <input 
                  id="reg-gp"
                  type="text" 
                  value={gpDetails} 
                  onChange={(e) => setGpDetails(e.target.value)}
                  placeholder="e.g. Dr LOWRI DAVIES, Cardiff"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">Emergency Contacts & Private Healthcare Cover</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Next of Kin Name</label>
                <input 
                  id="reg-nok-name"
                  type="text" 
                  value={nextOfKinName} 
                  onChange={(e) => setNextOfKinName(e.target.value)}
                  placeholder="e.g. Eleanor Pendleton"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Relationship</label>
                <input 
                  id="reg-nok-rel"
                  type="text" 
                  value={nextOfKinRel} 
                  onChange={(e) => setNextOfKinRel(e.target.value)}
                  placeholder="e.g. Spouse"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">NOK Phone</label>
                <input 
                  id="reg-nok-phone"
                  type="text" 
                  value={nextOfKinPhone} 
                  onChange={(e) => setNextOfKinPhone(e.target.value)}
                  placeholder="e.g. 07700 900456"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Financing / Insurance Provider</label>
                <select 
                  id="reg-insurer"
                  value={insuranceProvider} 
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 bg-white outline-none"
                >
                  <option value="Self-Pay">Self-Pay</option>
                  <option value="Bupa">Bupa Private Health</option>
                  <option value="AXA">AXA PPP Healthcare</option>
                  <option value="NHS-Funded">NHS-Funded Private Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Policy / pre-auth Number</label>
                <input 
                  id="reg-insurance-policy"
                  type="text" 
                  value={insurancePolicy} 
                  onChange={(e) => setInsurancePolicy(e.target.value)}
                  placeholder="e.g. BUPA-987-992"
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2">Clinical Flags & Allergies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Allergies (comma-separated)</label>
                <input 
                  id="reg-allergies"
                  type="text" 
                  value={allergiesInput} 
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="e.g. Penicillin, Latex, Peanuts"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Urgent Safety Warning Flags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Infection Risk", "Fall Risk", "Safeguarding Concern", "Day Surgery Unit"].map((flag) => {
                    const isSel = flagSelection.includes(flag);
                    return (
                      <button
                        id={`btn-flag-${flag.replace(/\s+/g, '-')}`}
                        type="button"
                        key={flag}
                        onClick={() => {
                          if (isSel) {
                            setFlagSelection(flagSelection.filter(f => f !== flag));
                          } else {
                            setFlagSelection([...flagSelection, flag]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${isSel ? "bg-rose-50 border-rose-200 text-rose-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {flag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end space-x-3">
            <button
              id="btn-cancel-reg"
              type="button"
              onClick={() => setActiveTab("search")}
              className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-reg"
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-sm transition"
            >
              Create Complete Patient File
            </button>
          </div>
        </form>
      )}

      {/* MERGE ENGINE TAB */}
      {activeTab === "duplicates" && (
        <div className="space-y-6 font-sans">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Layers className="h-5 w-5 text-cyan-700" />
              <span>Collision Detection & Patient Merge Tool</span>
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              HospitalOS runs multi-factor fuzzy scans on incoming registrations. If multiple profiles match on Date of Birth and Surname, we trigger a safety alert. Unifying clinical profiles prevents fragmented charts, treatment failures, and medication prescription errors.
            </p>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Flagged Duplicate Groups</h4>
              {activeDuplicates.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  ✓ Excellent: No active duplicate records are currently flagged in the index.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-lg border border-slate-200">
                  {activeDuplicates.map((dup, idx) => (
                    <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {dup.score}% Match Score
                          </span>
                          <span className="text-xs font-medium text-slate-400">NHS Match Code: {dup.p1.nhsNumber}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800">
                          {dup.p1.fullName} ({dup.p1.gender}, born {dup.p1.dob})
                        </div>
                        <div className="text-xs text-slate-500">
                          Primary record: <span className="font-semibold text-slate-700 font-mono">{dup.p1.id}</span> • Duplicate block: <span className="font-semibold text-slate-700 font-mono">{dup.p2.id}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          id={`btn-compare-${idx}`}
                          onClick={() => {
                            setSelectedParent(dup.p1);
                            setSelectedChild(dup.p2);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-cyan-700 hover:bg-cyan-800 text-white shadow-xs transition"
                        >
                          Compare Side-By-Side
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedParent && selectedChild && (
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-md space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Clinical Side-by-Side Review</h3>
                <button 
                  id="btn-close-merge-preview"
                  onClick={() => { setSelectedParent(null); setSelectedChild(null); }}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parent (Keep) */}
                <div className="border border-cyan-200 bg-cyan-50/10 rounded-xl p-4 space-y-3 relative">
                  <div className="absolute top-3 right-3 bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    MASTER CHART (KEEP)
                  </div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Profile A</div>
                  <h4 className="text-base font-bold text-slate-800">{selectedParent.fullName}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><span className="font-medium text-slate-400">NHS Number:</span> <span className="font-mono">{selectedParent.nhsNumber}</span></div>
                    <div><span className="font-medium text-slate-400">DOB:</span> {selectedParent.dob}</div>
                    <div><span className="font-medium text-slate-400">Address:</span> {selectedParent.address}</div>
                    <div><span className="font-medium text-slate-400">Primary Insurer:</span> {selectedParent.insurance.provider}</div>
                    <div><span className="font-medium text-slate-400">Allergies:</span> {selectedParent.allergies.join(", ") || "None"}</div>
                  </div>
                  <div className="border-t border-slate-100 pt-2">
                    <span className="text-xs font-bold text-slate-500">Timeline Events ({selectedParent.timeline.length}):</span>
                    <ul className="text-xs text-slate-500 mt-1 list-disc pl-4 space-y-1">
                      {selectedParent.timeline.map((t, i) => (
                        <li key={i}>{t.type}: {t.description}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Child (Merge & Delete) */}
                <div className="border border-rose-200 bg-rose-50/10 rounded-xl p-4 space-y-3 relative">
                  <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    DUPLICATE CHART (DESTROY & UNIFY)
                  </div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Profile B</div>
                  <h4 className="text-base font-bold text-slate-800">{selectedChild.fullName}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><span className="font-medium text-slate-400">NHS Number:</span> <span className="font-mono">{selectedChild.nhsNumber}</span></div>
                    <div><span className="font-medium text-slate-400">DOB:</span> {selectedChild.dob}</div>
                    <div><span className="font-medium text-slate-400">Address:</span> {selectedChild.address}</div>
                    <div><span className="font-medium text-slate-400">Primary Insurer:</span> {selectedChild.insurance.provider}</div>
                    <div><span className="font-medium text-slate-400">Allergies:</span> {selectedChild.allergies.join(", ") || "None"}</div>
                  </div>
                  <div className="border-t border-slate-100 pt-2">
                    <span className="text-xs font-bold text-slate-500">Timeline Events ({selectedChild.timeline.length}):</span>
                    <ul className="text-xs text-slate-500 mt-1 list-disc pl-4 space-y-1">
                      {selectedChild.timeline.map((t, i) => (
                        <li key={i}>{t.type}: {t.description}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Merge warning */}
              <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Clinical Safety Protocol (CQC Duty of Candour):</span>
                  <p>
                    Performing a merge will permanently delete duplicate Profile B (<span className="font-mono">{selectedChild.id}</span>). All clinical timelines, allergies, notes, and diagnostics will be compiled and transferred into Profile A (<span className="font-mono">{selectedParent.id}</span>) in a single immutable transaction. A cryptographic action log will be linked to the auditing chain. This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  id="btn-cancel-merge"
                  onClick={() => { setSelectedParent(null); setSelectedChild(null); }}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Decline Merge
                </button>
                <button
                  id="btn-confirm-merge"
                  onClick={handleExecuteMerge}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center space-x-2"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Unify & Seal EHR Chart</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
