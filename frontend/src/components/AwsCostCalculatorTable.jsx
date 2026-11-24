import React, { useState } from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  Zap, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Layers,
  Sparkles
} from 'lucide-react';

export default function AwsCostCalculatorTable() {
  const [scaleMode, setScaleMode] = useState('prototype'); // 'prototype' | 'production'

  const services = [
    {
      name: 'Amazon EC2',
      resource: 't3.micro (2 vCPU, 1 GB RAM)',
      role: 'Web Application & In-Memory Dijkstra Graph Engine',
      freeTierLimit: '750 Hours / month',
      protoUsage: '120 Hours (On-demand demos)',
      protoPct: 16,
      protoCost: '$0.00',
      prodUsage: '730 Hours (24/7 Multi-AZ)',
      prodPct: 97,
      prodCost: '$7.60',
      icon: Server,
      color: 'text-sky-600 bg-sky-50'
    },
    {
      name: 'Amazon RDS for MySQL',
      resource: 'db.t3.micro (Single-AZ, 20 GB gp2)',
      role: 'Relational Store: Blocks, Floors, Rooms, Routes, Users',
      freeTierLimit: '750 Hours + 20 GB storage',
      protoUsage: '100 Hours + 2 GB Data',
      protoPct: 10,
      protoCost: '$0.00',
      prodUsage: '730 Hours + 15 GB Data',
      prodPct: 75,
      prodCost: '$12.40',
      icon: Database,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      name: 'Amazon S3',
      resource: 'S3 Standard Storage',
      role: 'Floor-Plan Architectural SVGs and Floor Maps',
      freeTierLimit: '5 GB Standard Storage + 20K GETs',
      protoUsage: '120 MB Storage, ~500 GETs',
      protoPct: 2.4,
      protoCost: '$0.00',
      prodUsage: '1.2 GB Storage, 80K GETs',
      prodPct: 24,
      prodCost: '$0.45',
      icon: HardDrive,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      name: 'AWS Lambda',
      resource: 'Serverless Node.js 20.x Function',
      role: 'Stateless Autocomplete Room Search & Notifications',
      freeTierLimit: '1,000,000 Free Invocations / month',
      protoUsage: '12,500 Invocations',
      protoPct: 1.25,
      protoCost: '$0.00',
      prodUsage: '450,000 Invocations',
      prodPct: 45,
      prodCost: '$0.00',
      icon: Zap,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      name: 'Amazon API Gateway',
      resource: 'HTTP APIs (Payload v2)',
      role: 'Secure TLS REST Endpoints to Lambda functions',
      freeTierLimit: '1,000,000 Free API calls (12 months)',
      protoUsage: '12,500 API Calls',
      protoPct: 1.25,
      protoCost: '$0.00',
      prodUsage: '450,000 API Calls',
      prodPct: 45,
      prodCost: '$0.45',
      icon: Layers,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      name: 'Amazon CloudWatch',
      resource: 'Basic Metrics & Log Ingestion',
      role: 'Route Latency Monitoring & Error Logs',
      freeTierLimit: '5 GB Log Ingestion + 10 Free Metrics',
      protoUsage: '0.4 GB Logs, 3 Custom Metrics',
      protoPct: 8,
      protoCost: '$0.00',
      prodUsage: '3.8 GB Logs, 6 Custom Metrics',
      prodPct: 76,
      prodCost: '$0.00',
      icon: Activity,
      color: 'text-rose-600 bg-rose-50'
    },
    {
      name: 'AWS IAM & VPC',
      resource: 'Security Groups, Subnets, IAM Roles',
      role: 'Least-privilege execution & private subnet database isolation',
      freeTierLimit: 'Always 100% Free',
      protoUsage: '1 VPC, 3 Subnets, 2 IAM Roles',
      protoPct: 0,
      protoCost: '$0.00',
      prodUsage: '1 VPC, 4 Subnets, 4 IAM Roles',
      prodPct: 0,
      prodCost: '$0.00',
      icon: ShieldCheck,
      color: 'text-teal-600 bg-teal-50'
    }
  ];

  const totalCost = scaleMode === 'prototype' ? '$0.00 / month' : '~$20.90 / month';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Table II Implementation
            </span>
            <h2 className="text-base font-bold text-slate-900">
              AWS Cloud Architecture & Free-Tier Cost Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates Section VI: Rigorous prototype-scale cost control and monthly Free-Tier allowance tracking.
          </p>
        </div>

        {/* Scale Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setScaleMode('prototype')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scaleMode === 'prototype'
                ? 'bg-white text-emerald-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎓 Prototype Scale (SoCSE Demo)
          </button>
          <button
            onClick={() => setScaleMode('production')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scaleMode === 'production'
                ? 'bg-white text-indigo-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏛️ Campus Production (15K Users)
          </button>
        </div>
      </div>

      {/* Top Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Net Estimated Monthly Cost</span>
          <p className="text-2xl font-black text-emerald-950 mt-1">{totalCost}</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            {scaleMode === 'prototype' ? '100% Covered under AWS Free Tier' : 'Highly affordable academic pricing'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Compute Deployment</span>
          <p className="text-sm font-bold text-sky-950 mt-1">Hybrid Stateful + Serverless</p>
          <p className="text-[11px] text-sky-700 mt-0.5">
            EC2 for Dijkstra in-memory graph cache + Lambda for bursty search
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Database & Assets Strategy</span>
          <p className="text-sm font-bold text-indigo-950 mt-1">RDS MySQL + S3 Object Storage</p>
          <p className="text-[11px] text-indigo-700 mt-0.5">
            RDS stores only S3 URLs to keep database footprints minimal
          </p>
        </div>
      </div>

      {/* Interactive Cost Breakdown Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">AWS Service</th>
              <th className="p-3">Instance / Resource Tier</th>
              <th className="p-3">Monthly Free-Tier Limit</th>
              <th className="p-3">Estimated Monthly Usage</th>
              <th className="p-3 w-40">Free-Tier Quota %</th>
              <th className="p-3 text-right">Estimated Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {services.map(svc => {
              const Icon = svc.icon;
              const usage = scaleMode === 'prototype' ? svc.protoUsage : svc.prodUsage;
              const pct = scaleMode === 'prototype' ? svc.protoPct : svc.prodPct;
              const cost = scaleMode === 'prototype' ? svc.protoCost : svc.prodCost;

              return (
                <tr key={svc.name} className="hover:bg-slate-50 transition-colors">
                  
                  {/* Service */}
                  <td className="p-3 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${svc.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span>{svc.name}</span>
                        <p className="text-[10px] text-slate-500 font-normal line-clamp-1">{svc.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Resource */}
                  <td className="p-3 font-mono text-[11px] text-slate-700 font-medium">
                    {svc.resource}
                  </td>

                  {/* Free-tier limit */}
                  <td className="p-3 text-slate-600 font-medium">
                    {svc.freeTierLimit}
                  </td>

                  {/* Usage */}
                  <td className="p-3 font-semibold text-slate-800">
                    {usage}
                  </td>

                  {/* Quota Progress Bar */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{pct}%</span>
                        <span>{pct <= 100 ? 'Within Quota' : 'Overage'}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct < 50 ? 'bg-emerald-500' : pct < 85 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Cost */}
                  <td className="p-3 text-right font-mono font-bold text-sm">
                    <span className={cost === '$0.00' ? 'text-emerald-700' : 'text-slate-900'}>
                      {cost}
                    </span>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Practical Cost-Control Guidelines Checklist from Section VI */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
        <h3 className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Section VI: Recommended AWS Cost-Control Practices Implemented</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div className="flex items-start space-x-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
            <span><strong>Stop EC2 and RDS instances</strong> during weekends or when not demonstrating.</span>
          </div>

          <div className="flex items-start space-x-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
            <span><strong>Avoid NAT Gateway</strong> by keeping EC2 in public subnet with security group restrictions.</span>
          </div>

          <div className="flex items-start space-x-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
            <span><strong>Single-AZ Deployment</strong> for RDS to eliminate duplicate database replication cost.</span>
          </div>

          <div className="flex items-start space-x-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
            <span><strong>Set CloudWatch Log Retention to 7 days</strong> to avoid unbounded storage accumulation.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
