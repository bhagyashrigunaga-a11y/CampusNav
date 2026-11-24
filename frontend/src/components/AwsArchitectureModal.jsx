import React from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Zap, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';

export default function AwsArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                CampusNav AWS Cloud Architecture & Design
              </h2>
              <p className="text-xs text-slate-500">
                School of Computer Science and Engineering (SoCSE), RV University
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          
          {/* Architecture Overview Banner */}
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-100 text-sky-950 space-y-1">
            <h3 className="font-bold text-sm text-sky-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Layered AWS Architecture (Figure 1 in Paper)</span>
            </h3>
            <p className="text-xs leading-relaxed text-sky-800">
              Combines stateful server-based computing on <strong>Amazon EC2</strong> (which holds the campus graph in-memory for sub-millisecond Dijkstra pathfinding) with event-driven <strong>AWS Lambda & API Gateway</strong> for bursty search, <strong>Amazon RDS (MySQL)</strong> for structured graph entities, and <strong>Amazon S3</strong> for scalable floor-plan storage.
            </p>
          </div>

          {/* 5-Layer Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* EC2 Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center space-x-2 text-sky-700 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>Amazon EC2 (Web App & Dijkstra Engine)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hosts the web application, user login, admin APIs, and holds the campus graph in memory. Computes minimum-cost routes via Dijkstra's algorithm with binary-heap priority queue in <span className="font-mono font-bold text-sky-800">O((|V|+|E|) log |V|)</span>.
              </p>
            </div>

            {/* RDS MySQL Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>Amazon RDS for MySQL</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Persistently stores relational schemas: campus blocks, floors, vertices (rooms, facilities), edges (weights and types), and user accounts. Isolated inside a private VPC subnet.
              </p>
            </div>

            {/* Amazon S3 Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>Amazon S3 (Floor-Plan Storage)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Stores high-resolution floor plan SVGs and architectural maps. The RDS database stores only the lightweight S3 Object URL, keeping database storage compact and cost-efficient.
              </p>
            </div>

            {/* Lambda & API Gateway */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>AWS Lambda & API Gateway</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Executes lightweight stateless functions such as auto-complete room search and notifications, scaling automatically without server management or idle compute costs.
              </p>
            </div>

            {/* IAM Security */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>AWS IAM & Amazon VPC</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Enforces least-privilege role policies (EC2 to S3 and CloudWatch) without hardcoded credentials. VPC subnets isolate the RDS database securely away from the public internet.
              </p>
            </div>

            {/* CloudWatch */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>Amazon CloudWatch (Logs & Alarms)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Collects telemetry, routing calculation latency metrics, and API error logs, allowing administrators to monitor system performance and detect issues proactively.
              </p>
            </div>

          </div>

          {/* Table II Free-Tier Cost Analysis from Paper */}
          <div>
            <h3 className="font-bold text-xs text-slate-900 mb-2 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Table II: Prototype-Scale Usage and Cost Control Impact</span>
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5">AWS Service</th>
                    <th className="p-2.5">Expected Prototype Usage</th>
                    <th className="p-2.5">Cost Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">IAM / VPC</td>
                    <td className="p-2.5">Few roles, 1 VPC, subnets, security groups</td>
                    <td className="p-2.5 text-emerald-600 font-medium">Free (Standard)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Amazon EC2</td>
                    <td className="p-2.5">1 small instance (t3.micro)</td>
                    <td className="p-2.5 text-sky-700 font-medium">AWS Free Tier (750 hrs/mo)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Amazon RDS (MySQL)</td>
                    <td className="p-2.5">1 instance (db.t3.micro), ~20 GB</td>
                    <td className="p-2.5 text-sky-700 font-medium">AWS Free Tier (750 hrs/mo)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Amazon S3</td>
                    <td className="p-2.5">&lt; 1 GB floor plans</td>
                    <td className="p-2.5 text-emerald-600 font-medium">Very low / Free Tier (&lt;5 GB)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">AWS Lambda & API Gateway</td>
                    <td className="p-2.5">10K - 50K API calls</td>
                    <td className="p-2.5 text-emerald-600 font-medium">Within 1M Free Monthly Calls</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-900">Amazon CloudWatch</td>
                    <td className="p-2.5">Small log volume</td>
                    <td className="p-2.5 text-emerald-600 font-medium">Free allowance (&lt;5 GB logs)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Authors acknowledgment */}
          <div className="p-4 bg-slate-100 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Project Authors & Affiliation:</p>
            <p>• Prerana Prakash Talawar (USN: 1RUA24CSE0333)</p>
            <p>• Bhagyshree Laxmikant Gunaga (USN: 1RUA24CSE0084)</p>
            <p>• Bhuvana M G (USN: 1RUA24CSE0092)</p>
            <p className="italic text-slate-500">School of Computer Science and Engineering (SoCSE), RV University, Bengaluru, India</p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Close Architecture View
          </button>
        </div>

      </div>
    </div>
  );
}
