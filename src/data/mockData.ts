import { Patient, WardBed, Staff, Prescription, DiagnosticTest, TheatreCase, Invoice, AuditLog, VitalSign, MedicalRecord } from "../types/hospital";

export const initialPatients: Patient[] = [
  {
    id: "pat-1",
    nhsNumber: "673 892 4110",
    fullName: "Arthur Pendleton",
    firstName: "Arthur",
    lastName: "Pendleton",
    dob: "1948-11-23",
    gender: "Male",
    address: "12 Queen's Gate, Kensington, London, SW7 5EH",
    phone: "07700 900077",
    email: "arthur.pendleton@example.co.uk",
    emergencyContact: {
      name: "Eleanor Pendleton",
      relationship: "Spouse",
      phone: "07700 900081"
    },
    insurance: {
      provider: "Bupa",
      policyNumber: "BUPA-992-1029",
      status: "Verified"
    },
    gpDetails: "Dr. James Vance, Chelsea Medical Centre",
    allergies: ["Penicillin", "Sulfonamides"],
    flags: ["Infection Risk", "Neutropenic Sepsis Advisory"],
    alerts: ["High Falls Risk", "Do Not Resuscitate (DNACPR) in place"],
    timeline: [
      {
        id: "t-1",
        timestamp: "2026-06-10T09:15:00Z",
        type: "Admission",
        description: "Admitted to Ward 3 (Oncology) for management of neutropenic pyrexia post-cycle 3 chemotherapy.",
        author: "Dr. Alastair Sterling (Consultant)"
      },
      {
        id: "t-2",
        timestamp: "2026-06-10T11:30:00Z",
        type: "Clinical Note",
        description: "Intravenous access secured. Broad-spectrum antibiotics (Tazocin) commenced.",
        author: "Sister Fiona Higgins"
      },
      {
        id: "t-3",
        timestamp: "2026-06-11T08:00:00Z",
        type: "Lab Result",
        description: "Neutrophilic count returns extremely low (0.3 x 10^9/L). Neutropenic precautions maintained.",
        author: "Pathology Team"
      }
    ]
  },
  {
    id: "pat-2",
    nhsNumber: "412 890 3215",
    fullName: "Sarah Jenkins",
    firstName: "Sarah",
    lastName: "Jenkins",
    dob: "1982-04-14",
    gender: "Female",
    address: "44 Llandaff Road, Cardiff, CF11 9XF",
    phone: "07700 900142",
    email: "sjenkins@example.co.uk",
    emergencyContact: {
      name: "Marcus Jenkins",
      relationship: "Brother",
      phone: "07700 900143"
    },
    insurance: {
      provider: "AXA",
      policyNumber: "AXA-PP-32910-A",
      status: "Verified"
    },
    gpDetails: "Dr. Lowri Davies, Cardiff Bay Health Centre",
    allergies: ["NSAIDs", "Aspirin"],
    flags: ["Day Surgery Unit"],
    alerts: [],
    timeline: [
      {
        id: "t-4",
        timestamp: "2026-06-11T07:00:00Z",
        type: "Admission",
        description: "Admitted to Day Surgery Unit for scheduled Right Knee Arthroscopy and Meniscal repair.",
        author: "Sister Fiona Higgins"
      }
    ]
  },
  {
    id: "pat-3",
    nhsNumber: "882 119 5432",
    fullName: "David Cooper",
    firstName: "David",
    lastName: "Cooper",
    dob: "1961-08-05",
    gender: "Male",
    address: "22 Pen-Y-Peel Road, Llandaff, Cardiff, CF5 2EU",
    phone: "07700 900728",
    email: "d.cooper@example.co.uk",
    emergencyContact: {
      name: "Gillian Cooper",
      relationship: "Wife",
      phone: "07700 900730"
    },
    insurance: {
      provider: "Self-Pay",
      policyNumber: "N/A",
      status: "Verified"
    },
    gpDetails: "Dr. Nigel Sterling, Llandaff Village surgery",
    allergies: [],
    flags: [],
    alerts: ["Urgent Ward Review Triggered - Elevating NEWS2 Score"],
    timeline: [
      {
        id: "t-5",
        timestamp: "2026-06-09T22:30:00Z",
        type: "Admission",
        description: "Admitted via Urgent Care Centre following acute onset of sub-sternal chest discomfort.",
        author: "Dr. Marcus Vance (Registrar)"
      }
    ]
  },
  {
    id: "pat-4",
    nhsNumber: "991 228 3341",
    fullName: "Aisha Begum",
    firstName: "Aisha",
    lastName: "Begum",
    dob: "1975-02-18",
    gender: "Female",
    address: "109 Corporation Road, Newport, NP19 0AB",
    phone: "07700 900452",
    email: "aisha.b@example.org.uk",
    emergencyContact: {
      name: "Mohammed Begum",
      relationship: "Spouse",
      phone: "07700 900459"
    },
    insurance: {
      provider: "Bupa",
      policyNumber: "BUPA-987-2104",
      status: "Verified"
    },
    gpDetails: "Dr. Fiona Patel, St. Julian's GP Clinic",
    allergies: ["Latex"],
    flags: [],
    alerts: ["Requires translation assistance"],
    timeline: [
      {
        id: "t-6",
        timestamp: "2026-06-08T10:00:00Z",
        type: "Admission",
        description: "Admitted to General Ward for Elective Left Hip Replacement under Mr. Jonathan Carter.",
        author: "Mr. Jonathan Carter (Consultant Surgeon)"
      }
    ]
  }
];

export const initialBeds: WardBed[] = [
  // Intensive Care (ICU)
  { id: "bed-1", bedNumber: "ICU-01", wardName: "Intensive Care", status: "Occupied", patientId: "pat-3" },
  { id: "bed-2", bedNumber: "ICU-02", wardName: "Intensive Care", status: "Available", patientId: null },
  { id: "bed-3", bedNumber: "ICU-03", wardName: "Intensive Care", status: "Cleaning Required", patientId: null },
  { id: "bed-4", bedNumber: "ICU-04", wardName: "Intensive Care", status: "Available", patientId: null },
  { id: "bed-5", bedNumber: "ICU-05", wardName: "Intensive Care", status: "Maintenance", patientId: null },

  // Urgent Care Ward
  { id: "bed-6", bedNumber: "UCC-01", wardName: "Urgent Care", status: "Available", patientId: null },
  { id: "bed-7", bedNumber: "UCC-02", wardName: "Urgent Care", status: "Available", patientId: null },
  { id: "bed-8", bedNumber: "UCC-03", wardName: "Urgent Care", status: "Available", patientId: null },

  // Oncology Ward
  { id: "bed-9", bedNumber: "ONC-01", wardName: "Oncology", status: "Available", patientId: null },
  { id: "bed-10", bedNumber: "ONC-02", wardName: "Oncology", status: "Available", patientId: null },
  { id: "bed-11", bedNumber: "ONC-03", wardName: "Oncology", status: "Available", patientId: null },
  { id: "bed-12", bedNumber: "ONC-04", wardName: "Oncology", status: "Occupied", patientId: "pat-1" },
  { id: "bed-13", bedNumber: "ONC-05", wardName: "Oncology", status: "Available", patientId: null },

  // Orthopaedics Ward
  { id: "bed-14", bedNumber: "ORTH-01", wardName: "Orthopaedics", status: "Occupied", patientId: "pat-4" },
  { id: "bed-15", bedNumber: "ORTH-02", wardName: "Orthopaedics", status: "Available", patientId: null },
  { id: "bed-16", bedNumber: "ORTH-03", wardName: "Orthopaedics", status: "Cleaning Required", patientId: null },

  // Day Surgery Ward
  { id: "bed-17", bedNumber: "DSU-01", wardName: "Day Surgery", status: "Occupied", patientId: "pat-2" },
  { id: "bed-18", bedNumber: "DSU-02", wardName: "Day Surgery", status: "Available", patientId: null },
  { id: "bed-19", bedNumber: "DSU-03", wardName: "Day Surgery", status: "Available", patientId: null },

  // Isolation Rooms
  { id: "bed-20", bedNumber: "ISO-01", wardName: "Isolation Room", status: "Occupied", patientId: null, isolationReason: "Norovirus Precaution" },
  { id: "bed-21", bedNumber: "ISO-02", wardName: "Isolation Room", status: "Available", patientId: null },

  // Fill out the remaining to hit some nice 100-bed scale simulation
];

// Re-generate a full list of 100 beds automatically!
for (let i = 22; i <= 100; i++) {
  const wards: WardBed["wardName"][] = ["General Ward", "Cardiology", "Oncology", "Orthopaedics", "Day Surgery"];
  const ward = wards[i % wards.length];
  const prefix = ward.substring(0, 4).toUpperCase();
  const numStr = i < 10 ? `0${i}` : `${i}`;
  initialBeds.push({
    id: `bed-${i}`,
    bedNumber: `${prefix}-${numStr}`,
    wardName: ward,
    status: Math.random() > 0.65 ? "Occupied" : "Available",
    patientId: null
  });
}

// Assign randomized visual occupied signals to keep UI feeling alive and heavily populated
for (let b of initialBeds) {
  if (b.status === "Occupied" && !b.patientId) {
    // Generate simulated anonymous patients for background occupancy
    b.patientId = `bg-${b.bedNumber}`;
  }
}

export const initialStaff: Staff[] = [
  {
    id: "staff-1",
    fullName: "Dr. Alastair Sterling",
    role: "Consultant",
    specialty: "Oncology",
    gmcNumber: "GMC8219024",
    trainingCompliance: [
      { topic: "Basic Life Support (BLS)", dueDate: "2026-11-12", status: "Valid" },
      { topic: "Information Governance", dueDate: "2026-12-01", status: "Valid" },
      { topic: "Adult Safeguarding Level 3", dueDate: "2026-08-20", status: "Valid" }
    ],
    shifts: [
      { date: "2026-06-11", type: "Day", hours: "08:00 - 17:00" },
      { date: "2026-06-12", type: "Day", hours: "08:00 - 17:00" }
    ]
  },
  {
    id: "staff-2",
    fullName: "Mr. Jonathan Carter",
    role: "Consultant",
    specialty: "Orthopaedics",
    gmcNumber: "GMC4910248",
    trainingCompliance: [
      { topic: "Advanced Trauma Life Support", dueDate: "2026-10-30", status: "Valid" },
      { topic: "Radiation Protection", dueDate: "2026-05-15", status: "Expired" } // Alert trigger
    ],
    shifts: [
      { date: "2026-06-11", type: "On-Call", hours: "24 Hours" }
    ]
  },
  {
    id: "staff-3",
    fullName: "Sister Fiona Higgins",
    role: "Sister/Charge Nurse",
    specialty: "Inpatient Ward Management",
    nmcPin: "NMC83A9201B",
    trainingCompliance: [
      { topic: "Infection Prevention & Control", dueDate: "2027-02-14", status: "Valid" },
      { topic: "Controlled Drug Administration", dueDate: "2027-04-10", status: "Valid" }
    ],
    shifts: [
      { date: "2026-06-11", type: "Day", hours: "07:30 - 20:30" },
      { date: "2026-06-12", type: "Day", hours: "07:30 - 20:30" }
    ]
  },
  {
    id: "staff-4",
    fullName: "Dr. Marcus Vance",
    role: "Registrar",
    specialty: "Cardiology",
    gmcNumber: "GMC7349105",
    trainingCompliance: [
      { topic: "Adult ALS", dueDate: "2026-07-22", status: "Valid" }
    ],
    shifts: [
      { date: "2026-06-11", type: "Night", hours: "20:00 - 08:30" }
    ]
  }
];

export const initialClinicians = initialStaff.filter(s => s.role === "Consultant" || s.role === "Registrar");

export const initialVitals: VitalSign[] = [
  {
    id: "v-1",
    patientId: "pat-1",
    timestamp: "2026-06-11T09:30:00Z",
    systolicBP: 104,
    diastolicBP: 62,
    pulseRate: 94,
    temperature: 38.3, // Pyrexia
    respRate: 19,
    spO2: 96,
    newsScore: 3, // Medium-low (Temp elevated, low BP)
    clinicalResponse: "Monitor closely: Continue 4-hourly observations.",
    recordedBy: "Sister Fiona Higgins"
  },
  {
    id: "v-2",
    patientId: "pat-3",
    timestamp: "2026-06-11T10:15:00Z",
    systolicBP: 88, // Shock / Hypotension (NEWS Score triggers!)
    diastolicBP: 54,
    pulseRate: 118, // Tachycardia
    temperature: 36.8,
    respRate: 24, // Tachypnoea
    spO2: 92, // Hypoxia
    newsScore: 8, // Extreme NEWS Score (>7 is critical!)
    clinicalResponse: "URGENT ESCALATION: 15-Min Continuous Monitoring, Emergency Medical Team & Cardiology Consultant Alerted.",
    recordedBy: "Nurse Deborah Snape"
  }
];

export const initialNotes: MedicalRecord[] = [
  {
    id: "note-1",
    patientId: "pat-1",
    noteType: "Ward Round",
    timestamp: "2026-06-11T08:30:00Z",
    clinicianName: "Dr. Alastair Sterling",
    clinicianRole: "Consultant Oncologist",
    diagnoses: ["C34.9 - Malignant neoplasm of respiratory system, unspecified", "D70 - Neutropenia due to compounding chemotherapy"],
    procedures: ["U05.1 - Administration of cytotoxic chemotherapy"],
    content: `SBAR SUMMARY REPORT
S (Situation): Patient admitted overnight with temperature of 38.3°C, post Cycle 3 Chemotherapy. Neutropenic Pyrexia suspected.
B (Background): Arthur is standard Stage III Lung Non-Small Cell oncology case. Active therapeutic regimens. Fully conscious. 
A (Assessment): Clinically stable but hemodynamically at risk. Neutrophilic count 0.3 x 10^9/L. IV Tazocin administered.
R (Recommendation): Regular sepsis observation charts. Isolate in Single room. Keep Oncology Consultant in touch. Hold chemotherapy cycle 4 temporarily.`
  }
];

export const initialPrescriptions: Prescription[] = [
  {
    id: "rx-1",
    patientId: "pat-1",
    drugName: "Piperacillin / Tazobactam (Tazocin)",
    dosage: "4.5g",
    frequency: "Every 6 Hours",
    route: "IV",
    prescribedBy: "Dr. Alastair Sterling",
    prescribedAt: "2026-06-10T10:00:00Z",
    status: "Active",
    controlledDrug: false,
    notes: "Prophylactic and broad treatment of suspected neutropenic sepsis.",
    administrationLogs: [
      { administeredAt: "2026-06-10T12:00:00Z", administeredBy: "Sister Fiona Higgins", status: "Administered" },
      { administeredAt: "2026-06-10T18:00:00Z", administeredBy: "Nurse David Tennant", status: "Administered" }
    ]
  },
  {
    id: "rx-2",
    patientId: "pat-1",
    drugName: "Co-codamol (Paracetamol / Codeine Phosphate)",
    dosage: "30mg/500mg - 2 Tablets",
    frequency: "Every 4 Hours (PRN - As Required)",
    route: "Oral",
    prescribedBy: "Dr. Alastair Sterling",
    prescribedAt: "2026-06-10T10:15:00Z",
    status: "Active",
    controlledDrug: true,
    notes: "For systemic pain management and headache post-chemo.",
    administrationLogs: []
  },
  {
    id: "rx-3",
    patientId: "pat-3",
    drugName: "Amiodarone Infusion",
    dosage: "300mg",
    frequency: "STAT",
    route: "IV",
    prescribedBy: "Dr. Marcus Vance",
    prescribedAt: "2026-06-11T10:20:00Z",
    status: "Active",
    controlledDrug: false,
    notes: "Urgent anti-arrhythmic coverage following acute tachy-arrhythmia event.",
    administrationLogs: []
  }
];

export const initialDiagnostics: DiagnosticTest[] = [
  {
    id: "test-1",
    patientId: "pat-1",
    testName: "Full Blood Count (FBC) with differential",
    type: "Pathology",
    department: "Haematology",
    orderedBy: "Dr. Alastair Sterling",
    orderedAt: "2026-06-10T09:30:00Z",
    status: "Result Completed",
    category: "Haematology",
    priority: "Urgent",
    resultReport: "WBC: 1.2 x 10^9/L (LOW), Neutrophils: 0.3 x 10^9/L (CRITICAL LOW), Platelets: 140 x 10^9/L, Hb: 104 g/L.",
    criticalResult: true,
    clinicalFindings: "Profound neutropenia requiring immediate barrier nursing isolation."
  },
  {
    id: "test-2",
    patientId: "pat-3",
    testName: "12-Lead Electrocardiogram (ECG)",
    type: "Radiology", // Visual imaging/traces
    department: "X-Ray",
    orderedBy: "Dr. Marcus Vance",
    orderedAt: "2026-06-11T09:00:00Z",
    status: "Result Completed",
    category: "Imaging",
    priority: "STAT",
    resultReport: "ECG shows ST-Segment elevation in leads V2-V5. Significant T-wave inversion in Lead I. Pulse fluctuating.",
    criticalResult: true,
    clinicalFindings: "Anterolateral Myocardial Infarction. Cardiology Specialist emergency notification sent."
  },
  {
    id: "test-3",
    patientId: "pat-4",
    testName: "Left Hip Post-Op X-Ray",
    type: "Radiology",
    department: "X-Ray",
    orderedBy: "Mr. Jonathan Carter",
    orderedAt: "2026-06-09T14:00:00Z",
    status: "Result Completed",
    category: "Imaging",
    priority: "Routine",
    resultReport: "Demonstrates anatomical alignment of the total hip arthroplasty prosthetics. No early dislocation.",
    criticalResult: false,
    clinicalFindings: "Solid arthroplasty prosthesis position is documented. Fully consistent with therapeutic plan.",
    metadata: {
      imageResolution: "2048 x 2048px",
      scannerModel: "Siemens Multix Impact",
      radiationDose: "0.08 mSv"
    }
  }
];

export const initialTheatreCases: TheatreCase[] = [
  {
    id: "tc-1",
    patientId: "pat-2",
    surgeonName: "Mr. Jonathan Carter",
    anaesthetistName: "Dr. Simon Rattle",
    procedureName: "Right Knee Diagnostic Arthroscopy & Partial Meniscectomy",
    theatreName: "Day Surgery Suite",
    timestamp: "2026-06-11T08:30:00Z",
    durationMins: 45,
    status: "Recovery",
    anaestheticType: "General",
    implantTracked: "Meniscal Dart anchor 2.7mm (Ref: MDS-238-X)",
    consumablesUsed: ["Disposable arthroscopic blade", "Knee sterile drapery pack", "2L Saline Irrigation bagsx4"]
  },
  {
    id: "tc-2",
    patientId: "pat-4",
    surgeonName: "Mr. Jonathan Carter",
    anaesthetistName: "Dr. Simon Rattle",
    procedureName: "Left Total Hip Replacement",
    theatreName: "Operating Theatre 1",
    timestamp: "2026-06-08T11:00:00Z",
    durationMins: 90,
    status: "Discharged to Ward",
    anaestheticType: "Spinal",
    implantTracked: "Stryker Trident II Acetabular System & Accolade II Stem (Lot #4829103)",
    consumablesUsed: ["Surgical bone cement", "Drape set", "Skin staples"]
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: "inv-1",
    patientId: "pat-1",
    billingRef: "HOS-2026-0129",
    status: "Issued",
    dueDate: "2026-07-11",
    insurerName: "Bupa",
    items: [
      { description: "Inpatient Bed Day Charge - Oncology Ward (2 Nights @ £650/night)", grossCost: 1300, vatRate: 0, vatAmount: 0 },
      { description: "Oncology Drug Management Fee: Piperacillin Admin Fee", grossCost: 210, vatRate: 0, vatAmount: 0 },
      { description: "Laboratory Fee: FBC, CRP, Blood Cultures Panels", grossCost: 185, vatRate: 0, vatAmount: 0 }
    ],
    payments: []
  },
  {
    id: "inv-2",
    patientId: "pat-2",
    billingRef: "HOS-2026-0130",
    status: "Draft",
    dueDate: "2026-07-11",
    insurerName: "AXA",
    items: [
      { description: "Day Surgery Unit Theatre Surcharge - Standard Band 4 Procedure", grossCost: 1950, vatRate: 0, vatAmount: 0 },
      { description: "Implant Charge: Meniscal Anchor 2.7mm", grossCost: 350, vatRate: 0, vatAmount: 0 },
      { description: "Anaesthetic Administration & Consultation Fee", grossCost: 450, vatRate: 0, vatAmount: 0 }
    ],
    payments: []
  },
  {
    id: "inv-3",
    patientId: "pat-3",
    billingRef: "HOS-2026-0122",
    status: "Settled",
    dueDate: "2026-06-09",
    insurerName: "Self-Pay",
    items: [
      { description: "Executive Health Cardiology Baseline Screening Surcharge", grossCost: 850, vatRate: 20, vatAmount: 170 }, // Some screening/preventative care in the UK has standard 20% VAT
      { description: "Urgent Care Centre Consultant Assessment and Triage", grossCost: 350, vatRate: 0, vatAmount: 0 }
    ],
    payments: [
      { amount: 1020, paymentDate: "2026-06-09", method: "Card", reference: "TXN-9810481" }
    ]
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "aud-1",
    timestamp: "2026-06-11T07:15:22Z",
    userId: "user-dr-sterling",
    userName: "Dr. Alastair Sterling",
    userRole: "Consultant",
    actionType: "READ",
    moduleName: "PAS",
    details: "Accessed medical record summary and NHS details for patient Arthur Pendleton (pat-1).",
    hash: "6e0ffc7d9a117d65"
  },
  {
    id: "aud-2",
    timestamp: "2026-06-11T08:31:05Z",
    userId: "user-dr-sterling",
    userName: "Dr. Alastair Sterling",
    userRole: "Consultant",
    actionType: "CREATE",
    moduleName: "EHR",
    details: "Created clinical note 'Ward Round' with ICD-10 diagnoses for patient Arthur Pendleton (pat-1).",
    hash: "8a1b2c4d5e6f77cc"
  }
];
