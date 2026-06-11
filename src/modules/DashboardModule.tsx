import React from "react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import { 
  TrendingUp, Users, Clock, FlameKindling, ThumbsUp, 
  ShieldAlert, Landmark, Sparkles 
} from "lucide-react";

interface DashboardProps {
  totalPatients: number;
  occupancyBedsCount: number;
  totalBedsCount: number;
  totalBilledGross: number;
  totalCollected: number;
}

// 7-day Hospital Admissions & Discharges flow
const OCCUPANCY_HISTORY = [
  { day: "Mon", Admissions: 12, Discharges: 8 },
  { day: "Tue", Admissions: 18, Discharges: 11 },
  { day: "Wed", Admissions: 15, Discharges: 14 },
  { day: "Thu", Admissions: 22, Discharges: 16 },
  { day: "Fri", Admissions: 19, Discharges: 21 },
  { day: "Sat", Admissions: 10, Discharges: 15 },
  { day: "Sun", Admissions: 8, Discharges: 12 }
];

// Revenue breakdown by insurer portfolio
const REVENUE_BY_INSURER = [
  { name: "Bupa", Revenue: 345000, Claims: 450 },
  { name: "AXA PPP", Revenue: 210000, Claims: 280 },
  { name: "Self-Pay", Revenue: 185000, Claims: 140 },
  { name: "NHS Funded", Revenue: 130000, Claims: 190 }
];

// ER Waiting time hourly tracking
const ER_WAIT_TIMES = [
  { time: "08:00", WaitMin: 45, Threshold: 120 },
  { time: "11:00", WaitMin: 85, Threshold: 120 },
  { time: "14:00", WaitMin: 115, Threshold: 120 },
  { time: "17:00", WaitMin: 135, Threshold: 120 }, // Peak
  { time: "20:00", WaitMin: 95, Threshold: 120 },
  { time: "23:00", WaitMin: 55, Threshold: 120 },
  { time: "02:00", WaitMin: 35, Threshold: 120 }
];

export default function DashboardModule({
  totalPatients,
  occupancyBedsCount,
  totalBedsCount,
  totalBilledGross,
  totalCollected
}: DashboardProps) {

  const occupancyPercent = totalBedsCount > 0 ? Math.round((occupancyBedsCount / totalBedsCount) * 100) : 0;

  return (
    <div className="space-y-6 font-sans text-[#e5e7eb]" id="executive-dashboard-container">
      {/* Dynamic Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/10 p-4 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Bed Utilization</span>
            <span className="text-3xl font-serif mt-1 italic text-white">{occupancyBedsCount}<span className="text-sm text-gray-600 not-italic ml-1">/ {totalBedsCount}</span></span>
            <div className="text-[10px] text-teal-400 font-bold mt-2 uppercase flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{occupancyPercent}% Occupancy Load</span>
            </div>
          </div>
          <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/20 rounded flex items-center justify-center text-teal-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 p-4 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Mean Length of Stay</span>
            <span className="text-3xl font-serif mt-1 italic text-white">4.2<span className="text-sm text-gray-600 not-italic ml-1">WARD DAYS</span></span>
            <span className="text-[10px] text-gray-500 block font-bold mt-2 uppercase">Private norm: 4.5 days</span>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 p-4 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Urgent Care Wait Time</span>
            <span className="text-3xl font-serif mt-1 italic text-rose-500">82<span className="text-sm text-rose-800 not-italic ml-1">MINS AVG</span></span>
            <span className="text-[10px] text-rose-500 block font-bold mt-2 uppercase">Inside 4-hr Bounds</span>
          </div>
          <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/20 rounded flex items-center justify-center text-rose-500">
            <FlameKindling className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 p-4 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Patient Satisfaction</span>
            <span className="text-3xl font-serif mt-1 italic text-teal-400">98.4%<span className="text-sm text-teal-700 not-italic ml-1">NPS</span></span>
            <div className="text-[10px] text-teal-400 font-bold mt-2 uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>CQC 'Excellent'</span>
            </div>
          </div>
          <div className="h-10 w-10 bg-teal-500/10 border border-teal-500/20 rounded flex items-center justify-center text-teal-400">
            <ThumbsUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* RECHARTS PLOTS BOARD - 2x2 GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART A: ADMISSIONS VS DISCHARGES */}
        <div className="bg-[#111] border border-white/10 rounded p-6 space-y-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Ward Admission vs discharge flows</span>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={OCCUPANCY_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorAdm" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#64748b" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 4 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Admissions" stroke="#14b8a6" fillOpacity={1} fill="url(#colorAdm)" strokeWidth={2} />
                <Area type="monotone" dataKey="Discharges" stroke="#64748b" fillOpacity={1} fill="url(#colorDis)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART B: CORPORATE INSURER REVENUE */}
        <div className="bg-[#111] border border-white/10 rounded p-6 space-y-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Insurer Revenue Portfolio (AXA / Bupa / Self-Pay)</span>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_BY_INSURER} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} tickFormatter={(value) => `£${value/1000}k`} />
                <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 4 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Revenue" fill="#14b8a6" opacity={0.8} radius={[4, 4, 0, 0]} name="Invoiced Revenue (£)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART C: ER WAITING TIMES TELEMETRY */}
        <div className="bg-[#111] border border-white/10 rounded p-6 space-y-4">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Urgent Care (ER) Waiting times - Hourly cycle</span>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ER_WAIT_TIMES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 4 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="WaitMin" stroke="#f43f5e" strokeWidth={3} name="Average Wait (Min)" activeDot={{ r: 6 }} />
                <Line type="dashed" dataKey="Threshold" stroke="#4b5563" strokeWidth={1} name="Maximum NHS Target" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STRATEGIC REPORT SUMMARY */}
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded flex flex-col justify-between text-[#e5e7eb]">
          <div className="space-y-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">strategic Operational Summary</span>
            <h4 className="text-lg font-serif italic text-white leading-snug">Executive governance status returns robust performance indexes.</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              HospitalOS reporting monitors bed density dynamically. Our current 100-bed layout maintains a stable active capacity load, optimizing nurse-to-patient safety structures. Remittance cycles are steady-state; outstanding claims with Bupa and AXA reflect routine billing pipelines. CQC governance audits verify zero open compliance deficits this period.
            </p>
          </div>
          <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-xs text-gray-500 font-mono">
            <span>Direct NHS Spine link: Connected</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-gray-400 font-mono">GPhC Sync Clear</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
