export interface Patient {
  id: string;
  nhsNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string; // "AXA", "Bupa", "Self-Pay", "NHS-Funded"
    policyNumber: string;
    status: "Verified" | "Unverified";
  };
  gpDetails: string;
  allergies: string[];
  flags: string[]; // "Infection Risk", "Fall Risk", "Safeguarding", "Do Not Resuscitate"
  alerts: string[];
  timeline: {
    id: string;
    timestamp: string;
    type: "Admission" | "Discharge" | "Clinical Note" | "Prescription" | "Lab Result" | "Radiology Result" | "Operation" | "Transfer";
    description: string;
    author: string;
  }[];
}

export interface WardBed {
  id: string;
  bedNumber: string;
  wardName: "Urgent Care" | "Intensive Care" | "Oncology" | "Cardiology" | "Orthopaedics" | "General Ward" | "Day Surgery" | "Isolation Room";
  status: "Available" | "Occupied" | "Cleaning Required" | "Maintenance";
  patientId: string | null;
  cleaningStartedAt?: string;
  isolationReason?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  noteType: "Consultation" | "Ward Round" | "Nursing Log" | "Procedure Notes" | "Discharge Summary";
  timestamp: string;
  clinicianName: string;
  clinicianRole: string;
  content: string; // Holds SBAR or standard clinical text
  diagnoses: string[]; // ICD-10
  procedures: string[]; // OPCS-4
}

export interface VitalSign {
  id: string;
  patientId: string;
  timestamp: string;
  systolicBP: number;
  diastolicBP: number;
  pulseRate: number; // bpm
  temperature: number; // °C
  respRate: number; // breaths/min
  spO2: number; // %
  clinicalResponse: string; // NEWS2 score category
  newsScore: number;
  recordedBy: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  route: "Oral" | "IV" | "IM" | "Subcutaneous" | "Inhalation" | "Topical";
  prescribedBy: string;
  prescribedAt: string;
  status: "Active" | "Dispensed" | "Administered" | "Suspended" | "Completed";
  controlledDrug: boolean;
  notes?: string;
  administrationLogs: {
    administeredAt: string;
    administeredBy: string;
    status: "Administered" | "Refused" | "Omitted";
  }[];
}

export interface DiagnosticTest {
  id: string;
  patientId: string;
  testName: string; // e.g. "Full Blood Count", "CT Abdomen", "MRI Brain"
  type: "Pathology" | "Radiology";
  department: "Haematology" | "Biochemistry" | "Microbiology" | "MRI" | "CT" | "Ultrasound" | "X-Ray";
  orderedBy: string;
  orderedAt: string;
  status: "Ordered" | "Sample Collected" | "In Laboratory" | "Result Completed";
  category: "Biochemistry" | "Haematology" | "Microbiology" | "Histology" | "Imaging";
  priority: "Routine" | "Urgent" | "STAT";
  resultReport?: string;
  criticalResult: boolean;
  clinicalFindings?: string;
  metadata?: {
    tubeType?: string;
    imageResolution?: string;
    scannerModel?: string;
    radiationDose?: string;
  };
}

export interface TheatreCase {
  id: string;
  patientId: string;
  surgeonName: string;
  anaesthetistName: string;
  procedureName: string;
  theatreName: "Operating Theatre 1" | "Operating Theatre 2" | "Day Surgery Suite";
  timestamp: string;
  durationMins: number;
  status: "Scheduled" | "Pre-Op Assessment" | "In Surgery" | "Recovery" | "Discharged to Ward";
  anaestheticType: "General" | "Spinal" | "Sedation" | "Local";
  implantTracked?: string;
  consumablesUsed: string[];
  complications?: string;
}

export interface Staff {
  id: string;
  fullName: string;
  role: "Consultant" | "Registrar" | "Ward Nurse" | "Sister/Charge Nurse" | "Healthcare Assistant" | "Pharmacist" | "Radiographer" | "Lab Technician" | "Administrator";
  specialty: string;
  gmcNumber?: string; // Doctors
  nmcPin?: string; // Nurses
  trainingCompliance: {
    topic: string;
    dueDate: string;
    status: "Valid" | "Expired" | "Pending";
  }[];
  shifts: {
    date: string; // YYYY-MM-DD
    type: "Day" | "Night" | "On-Call";
    hours: string;
  }[];
}

export interface Invoice {
  id: string;
  patientId: string;
  billingRef: string;
  status: "Draft" | "Issued" | "Settled" | "Under Dispute" | "Written Off";
  dueDate: string;
  insurerName: "AXA" | "Bupa" | "Self-Pay" | "NHS-Funded";
  items: {
    description: string;
    grossCost: number;
    vatRate: number; // usually zero-rated for UK medical care but some cosmetic/reporting have VAT
    vatAmount: number;
  }[];
  payments: {
    amount: number;
    paymentDate: string;
    method: "Card" | "Bank Transfer" | "Insurance Settlement";
    reference: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: "CREATE" | "READ" | "UPDATE" | "DELETE" | "ACCESS_DENIED" | "PATIENT_MERGE";
  moduleName: string;
  details: string;
  hash: string; // Simulation of cryptographic immutable chain block hashing
}
