import React, { useState } from "react";
import { Copy, Check, Terminal, Database, Server, Cpu, FileJson, Layers } from "lucide-react";

export default function ArchModule() {
  const [activeSubTab, setActiveSubTab] = useState<"sql" | "rust" | "kotlin" | "docker">("sql");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sqlDDL = `-- HospitalOS PostgreSQL Database Schema Design
-- Production-Ready 100-Bed Private Hospital Core DDL
-- England & Wales Regulatory & Clinical Audit Compliant

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Type Enum
CREATE TYPE staff_role AS ENUM (
    'Consultant', 'Registrar', 'Ward Nurse', 'Sister/Charge Nurse', 
    'Healthcare Assistant', 'Pharmacist', 'Radiographer', 'Lab Technician', 'Administrator'
);

-- Insurance Provider Enum
CREATE TYPE insurance_provider AS ENUM (
    'AXA', 'Bupa', 'Self-Pay', 'NHS-Funded'
);

-- 1. Patients Table (PAS Core)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhs_number VARCHAR(12) UNIQUE NOT NULL CHECK (length(nhs_number) >= 10),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    nok_name VARCHAR(200) NOT NULL,
    nok_relationship VARCHAR(100) NOT NULL,
    nok_phone VARCHAR(30) NOT NULL,
    insurance_provider insurance_provider NOT NULL DEFAULT 'Self-Pay',
    insurance_policy VARCHAR(100) DEFAULT 'N/A',
    gp_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Staff Table (HR & Rota)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(200) NOT NULL,
    role staff_role NOT NULL,
    specialty VARCHAR(150) NOT NULL,
    gmc_number VARCHAR(20) UNIQUE, -- GMC code for doctors
    nmc_pin VARCHAR(20) UNIQUE, -- NMC pin for nursing
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bed Management
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bed_number VARCHAR(10) UNIQUE NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Cleaning Required', 'Maintenance')),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    isolation_reason VARCHAR(250)
);

-- 4. Inpatient Admissions
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    admitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMP WITH TIME ZONE,
    consultant_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    expected_los_days INT DEFAULT 3,
    discharge_summary TEXT
);

-- 5. Clinical Observation Vitals (NEWS2 Scoring)
CREATE TABLE observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    systolic_bp INT NOT NULL CHECK (systolic_bp > 0),
    diastolic_bp INT NOT NULL CHECK (diastolic_bp > 0),
    pulse_rate INT NOT NULL CHECK (pulse_rate > 0),
    temperature NUMERIC(3,1) NOT NULL CHECK (temperature > 30.0),
    resp_rate INT NOT NULL CHECK (resp_rate > 0),
    spo2 INT NOT NULL CHECK (spo2 BETWEEN 0 AND 100),
    news_score INT NOT NULL CHECK (news_score BETWEEN 0 AND 20),
    clinical_response TEXT,
    recorded_by_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- 6. Medication Prescriptions (eMAR Core)
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    drug_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL,
    prescribed_by_staff_id UUID REFERENCES staff(id) ON DELETE RESTRICT,
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Completed')),
    is_controlled_drug BOOLEAN DEFAULT FALSE,
    special_instructions TEXT
);

-- 7. Diagnostic Testing (Laboratory/Radiology)
CREATE TABLE diagnostics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Pathology', 'Radiology')),
    department VARCHAR(100) NOT NULL,
    ordered_by UUID REFERENCES staff(id) ON DELETE RESTRICT,
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Sample Collected', 'In Laboratory', 'Result Completed')),
    result_report TEXT,
    is_critical BOOLEAN DEFAULT FALSE,
    radiation_dose_msv NUMERIC(5,2),
    scanner_model VARCHAR(100)
);

-- 8. Operating Theatre Scheduling
CREATE TABLE theatre_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    surgeon_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    anaesthetists_id UUID REFERENCES staff(id) ON DELETE RESTRICT,
    procedure_name VARCHAR(250) NOT NULL,
    theatre_name VARCHAR(100) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_mins INT NOT NULL,
    status VARCHAR(40) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Pre-Op Assessment', 'In Surgery', 'Recovery', 'Discharged to Ward')),
    implant_serial VARCHAR(100)
);

-- 9. Finance Invoices & Billing
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    billing_ref VARCHAR(50) UNIQUE NOT NULL,
    insurer VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Settled', 'Under Dispute')),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    gross_cost NUMERIC(10,2) NOT NULL,
    vat_rate NUMERIC(4,2) DEFAULT 0.00,
    vat_amount NUMERIC(10,2) DEFAULT 0.00
);

-- 10. Immutable Security Audit Trail Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    cryptographic_hash CHAR(64) NOT NULL
);

-- DATABASE INDEXES FOR ENHANCED QUERY SPEEDS
CREATE INDEX idx_patients_nhs ON patients(nhs_number);
CREATE INDEX idx_obs_patient_date ON observations(patient_id, recorded_at DESC);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- AUDIT TRAIL AUTOMATED STORED PROCEDURE FUNCTION
CREATE OR REPLACE FUNCTION log_patient_creation()
RETURNS TRIGGER AS $$
DECLARE
    hash_str CHAR(64);
BEGIN
    -- Synthesize sha256 mock hash using record data
    hash_str := encode(sha256(concat(NEW.id::text, NEW.nhs_number, CURRENT_TIMESTAMP::text)::bytea), 'hex');
    
    INSERT INTO audit_logs (user_id, user_name, user_role, action_type, module_name, details, cryptographic_hash)
    VALUES ('db-trigger', 'PostgreSQL System', 'Database DB-Engine', 'CREATE', 'PAS', 
            'TRIGGER: Formed new relational database entries for Patient: ' || NEW.first_name || ' ' || NEW.last_name, hash_str);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_patient_creation
AFTER INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION log_patient_creation();
`;

  const rustAxumCode = `// HospitalOS Backend API Gateway Module
// Compiled in Rust using Axum, Tokio, SQLx, and Serde
// Coordinates fast, memory-safe endpoints over PostgreSQL

use axum::{
    routing::{get, post, put},
    extract::{Path, State, Json},
    http::StatusCode,
    Router, Json as AxumJson
};
use serde::{Serialize, Deserialize};
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use std::net::SocketAddr;

// Serde Models for Patient records
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Patient {
    pub id: Uuid,
    pub nhs_number: String,
    pub first_name: String,
    pub last_name: String,
    pub dob: chrono::NaiveDate,
    pub insurance_provider: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePatientDto {
    pub nhs_number: String,
    pub first_name: String,
    pub last_name: String,
    pub dob: String,
    pub address: String,
}

// Global Axum State pattern
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

#[tokio::main]
async fn main() {
    // 1. Establish secure Connection pool
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:securepass@0.0.0.0:5432/hospitalos".to_string());
    let db_pool = PgPool::connect(&db_url).await.expect("Failed to bind PostgreSQL state pool.");

    let state = AppState { db: db_pool };

    // 2. Formulate REST endpoints
    let app = Router::new()
        .route("/api/patients", get(get_patients).post(create_patient))
        .route("/api/patients/:id", get(get_patient_details))
        .route("/api/observations", post(record_observations))
        .with_state(state);

    // 3. Mount Axum Server on Port 3000
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("HospitalOS API Engine listening on http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// Controller Handlers
async fn get_patients(
    State(state): State<AppState>
) -> Result<AxumJson<Vec<Patient>>, StatusCode> {
    let patients = sqlx::query_as::<_, Patient>("SELECT id, nhs_number, first_name, last_name, dob, insurance_provider FROM patients")
        .fetch_all(&state.db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(AxumJson(patients))
}

async fn create_patient(
    State(state): State<AppState>,
    Json(payload): Json<CreatePatientDto>
) -> Result<(StatusCode, AxumJson<Uuid>), StatusCode> {
    let new_id = Uuid::new_v4();
    let dob_parsed = chrono::NaiveDate::parse_from_str(&payload.dob, "%Y-%m-%d")
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    sqlx::query(
        "INSERT INTO patients (id, nhs_number, first_name, last_name, dob, address) VALUES ($1, $2, $3, $4, $5, $6)"
    )
    .bind(new_id)
    .bind(&payload.nhs_number)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .bind(dob_parsed)
    .bind(&payload.address)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, AxumJson(new_id)))
}

async fn get_patient_details(
    State(state): State<AppState>,
    Path(id): Path<Uuid>
) -> Result<AxumJson<Patient>, StatusCode> {
    let patient = sqlx::query_as::<_, Patient>("SELECT id, nhs_number, first_name, last_name, dob, insurance_provider FROM patients WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(AxumJson(patient))
}

async fn record_observations() -> StatusCode {
    StatusCode::OK
}
`;

  const kotlinComposeCode = `// HospitalOS Frontend Interface
// Crafted using Kotlin Jetpack Compose Multiplatform
// Native layout running on Android, Desktop components, and Web Canvas

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// 1. Data Model Representation (Kotlin)
data class PatientRecord(
    val id: String,
    val nhsNumber: String,
    val fullName: String,
    val dob: String,
    val allergies: List<String>
)

// 2. Clinical App Entry
@Composable
fn HospitalApp() {
    MaterialTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFFF8FAFC) // Slate-50 background
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                HeaderComponent()
                Spacer(modifier = Modifier.height(16.dp))
                PatientListCard(
                    patient = PatientRecord(
                        id = "pat-1",
                        nhsNumber = "673 892 4110",
                        fullName = "Arthur Pendleton",
                        dob = "1948-11-23",
                        allergies = listOf("Penicillin", "Sulfonamides")
                    )
                )
            }
        }
    }
}

// 3. Institutional Header Component
@Composable
fn HeaderComponent() {
    Text(
        text = "HOSPITALOS",
        fontSize = 24.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.SansSerif,
        color = Color(0xFF0C4A6E) // Deep Slate-900 Blue
    )
}

// 4. Detailed Patient Clinical Grid Cell Card
@Composable
fun PatientListCard(patient: PatientRecord) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    text = patient.fullName,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                )
                Text(
                    text = "NHS: " + patient.nhsNumber,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF94A3B8)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Date of Birth: \${patient.dob}",
                fontSize = 14.sp,
                color = Color(0xFF64748B)
            )
            Spacer(modifier = Modifier.height(12.dp))
            if (patient.allergies.isNotEmpty()) {
                Text(
                    text = "ALLERGY ALERT: " + patient.allergies.joinToString(", "),
                    color = Color(0xFFE11D48), // Rose-600 Alert
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
        }
    }
}
`;

  const devopsConfig = `# HospitalOS DevSecOps Infrastructure Manifest
# Integrates PostgreSQL, RabbitMQ, Axum Rust API, Prometheus, Loki, and Grafana

version: '3.8'

services:
  # 1. Primary Relational Storage Engine
  postgres:
    image: postgres:15-alpine
    container_name: hospitalos_pgsql_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: securepassword123
      POSTGRES_DB: hospitalos
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Asynchronous Messaging Broker (Lab Specimen triggers)
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: hospitalos_rabbitmq_bus
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - mqdata:/var/lib/rabbitmq

  # 3. Rust Axum Backend Compiler Context (Multi-stage)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hospitalos_api_rust
    environment:
      - DATABASE_URL=postgres://postgres:securepassword123@postgres:5432/hospitalos
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
      - JWT_SECRET=HospitalOSStrategicGlobalPrivateKey
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy

  # 4. Telemetry Scraping (Prometheus Metrics)
  prometheus:
    image: prom/prometheus:latest
    container_name: hospitalos_prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  # 5. Centralized System Logging (Grafana Loki)
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"

  # 6. Performance Visualizer Dashboard
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000" # Mapped outward to port 3001
    depends_on:
      - prometheus
      - loki

volumes:
  pgdata:
  mqdata:

---
# Kubernetes Ingress and Deployment Blueprint
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hospitalos-api-deployment
  namespace: healthcare-production
spec:
  replicas: 3 # High Availability load clusters
  selector:
    matchLabels:
      app: hospitalos-api
  template:
    metadata:
      labels:
        app: hospitalos-api
    spec:
      containers:
      - name: hospitalos-axum-backend
        image: gcr.io/healthcare-3829/hospitalos-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: connection-string
---
apiVersion: v1
kind: Service
metadata:
  name: hospitalos-api-service
  namespace: healthcare-production
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: hospitalos-api
`;

  const getSourceCode = () => {
    switch (activeSubTab) {
      case "sql": return sqlDDL;
      case "rust": return rustAxumCode;
      case "kotlin": return kotlinComposeCode;
      case "docker": return devopsConfig;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800" id="devops-arch-module">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-cyan-700" />
            <span>DevOps Strategy & Blueprint Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Export exact PostgreSQL DDL code schemas, Rust Axum server scripts, Jetpack Compose structures, and Kubernetes configs.</p>
        </div>
        <div className="flex space-x-1 mt-4 md:mt-0 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <button 
            id="arch-tab-sql"
            onClick={() => setActiveSubTab("sql")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeSubTab === "sql" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            PostgreSQL DDL
          </button>
          <button 
            id="arch-tab-rust"
            onClick={() => setActiveSubTab("rust")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeSubTab === "rust" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Axum / Rust API
          </button>
          <button 
            id="arch-tab-kotlin"
            onClick={() => setActiveSubTab("kotlin")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeSubTab === "kotlin" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Kotlin Compose
          </button>
          <button 
            id="arch-tab-docker"
            onClick={() => setActiveSubTab("docker")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeSubTab === "docker" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Docker & K8s
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col h-[520px]">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-mono">
            <Terminal className="h-4 w-4" />
            <span>
              {activeSubTab === "sql" ? "hospitalos_database_schema.sql" :
               activeSubTab === "rust" ? "main.rs (Axum / SQLx / Serde API)" :
               activeSubTab === "kotlin" ? "HospitalApp.kt (Jetpack Multiplatform UI)" :
               "docker-compose.yml & ingress-nginx.yaml"}
            </span>
          </div>
          
          <button
            id="btn-copy-code"
            onClick={() => handleCopy(getSourceCode())}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition"
          >
            {copied ? (
              <>
                <Check className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-emerald-550 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4.5 w-4.5" />
                <span>Copy Source</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Box */}
        <pre className="p-5 font-mono text-[11px] text-slate-300 overflow-auto flex-1 leading-relaxed selection:bg-cyan-800">
          <code>{getSourceCode()}</code>
        </pre>
      </div>
    </div>
  );
}
