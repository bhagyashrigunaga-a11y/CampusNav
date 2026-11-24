import React, { useState } from 'react';
import { 
  Flame, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  PhoneCall, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Footprints,
  HeartPulse
} from 'lucide-react';
import { clientDijkstra } from '../services/defaultData';

export default function EmergencyEvacuationView({
  nodes = [],
  edges = [],
  currentStartId,
  onTriggerEvacuation
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(currentStartId || 'block-c-2-cslab');

  const selectedNode = nodes.find(n => n.id === selectedRoomId) || nodes[0];
  const emergencyExitNode = nodes.find(n => n.id === 'out-node-gate') || nodes.find(n => n.facility_type === 'emergency_exit') || nodes[0];

  // In fire emergencies, elevators must NEVER be used! (Lifts receive infinite penalty, stairs are allowed)
  const safeEdges = edges.map(e => {
    if (e.type === 'lift') {
      return { ...e, weight: e.weight + 50000 }; // Never use elevators in fire
    }
    return e;
  });

  // Calculate fastest evacuation path to emergency exit
  const evacuationRoute = clientDijkstra(nodes, safeEdges, selectedRoomId, emergencyExitNode.id, false);

  const emergencyContacts = [
    { role: 'Campus Emergency & Fire Helpdesk', number: '+91 80 6717 8000', location: 'Gate 1 Command' },
    { role: 'RV University Health & Medical Clinic', number: '+91 80 6717 8108', location: 'Ground Floor, Block C' },
    { role: 'Campus Security & Safety Chief', number: '+91 98450 12345', location: 'Main Entrance Booth' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Campus Safety Protocol</span>
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Emergency Evacuation & Safe Exit Route Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Computes immediate, stair-compliant fire evacuation paths to ground safety assembly zones, barring elevators according to fire safety standards.
          </p>
        </div>

        {/* Room Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Your Current Location:</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50/50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.floor_id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Evacuation Alert Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Emergency Evacuation Path Calculated</h3>
            <p className="text-xs text-rose-100">
              From <strong>{selectedNode.name}</strong> to <strong>{emergencyExitNode.name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => onTriggerEvacuation(selectedRoomId, emergencyExitNode.id)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
        >
          <span>Plot Evacuation on Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Evacuation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Escape Distance</span>
          <p className="text-xl font-black text-rose-950 mt-0.5">{evacuationRoute.totalCost} m</p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Est. Evacuation Time</span>
          <p className="text-xl font-black text-amber-950 mt-0.5">~{evacuationRoute.walkingTimeSeconds} sec</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Elevator Safety Rule</span>
          <p className="text-xs font-bold text-rose-700 mt-1 flex items-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Lifts Barred (Fire Risk)</span>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Assembly Zone</span>
          <p className="text-xs font-bold text-emerald-800 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>North Quadrangle Gate</span>
          </p>
        </div>
      </div>

      {/* Evacuation Protocol Steps */}
      <div className="space-y-3">
        <h3 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
          <Footprints className="w-4 h-4 text-rose-600" />
          <span>Step-by-Step Fire Evacuation Protocol</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {evacuationRoute.instructions.map((step, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3 text-xs">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{step.text}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Follow illuminated overhead safety green placards</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Contacts Directory */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
          <PhoneCall className="w-4 h-4 text-emerald-600" />
          <span>Campus Emergency Hotline Directory</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {emergencyContacts.map((contact, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{contact.location}</span>
              <h4 className="font-bold text-xs text-slate-900">{contact.role}</h4>
              <p className="text-sm font-mono font-bold text-emerald-700">{contact.number}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
