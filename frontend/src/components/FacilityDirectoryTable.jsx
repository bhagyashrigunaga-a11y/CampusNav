import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Compass, 
  ArrowRight, 
  Accessibility, 
  CheckCircle2, 
  MapPin, 
  Clock,
  Layers
} from 'lucide-react';
import { clientDijkstra } from '../services/defaultData';

export default function FacilityDirectoryTable({
  nodes = [],
  edges = [],
  floors = [],
  currentStartId,
  onSelectDestination
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const startNode = nodes.find(n => n.id === currentStartId) || nodes[0];

  // Calculate Euclidean and Dijkstra walking distances for every node from startNode
  const enrichedNodes = nodes.map(node => {
    // Euclidean straight-line distance (pixel distance converted approximately to meters)
    const dx = node.x - (startNode?.x || 0);
    const dy = node.y - (startNode?.y || 0);
    const euclideanDist = Math.round(Math.sqrt(dx * dx + dy * dy) * 0.12);

    // Dijkstra graph walking distance
    let walkingDist = 0;
    let walkingTime = 0;
    if (startNode && node.id !== startNode.id) {
      const res = clientDijkstra(nodes, edges, startNode.id, node.id, false);
      walkingDist = res.totalCost;
      walkingTime = res.walkingTimeSeconds;
    }

    // Display only campus-recorded status; no occupancy estimates are fabricated.
    let category = 'Room';
    if (node.facility_type === 'canteen') category = 'Dining & Food';
    else if (node.facility_type === 'library') category = 'Library & Study';
    else if (node.facility_type === 'washroom') category = 'Sanitation & Restroom';
    else if (node.facility_type === 'emergency_exit') category = 'Safety & First Aid';
    else if (node.type === 'room' && /lab/i.test(node.name)) category = 'Academic Laboratory';
    else if (node.type === 'room' && node.code?.startsWith('OFF')) category = 'Faculty & Admin';

    const knownStatuses = ['available', 'occupied', 'reserved', 'unavailable', 'unknown'];
    const availabilityStatus = knownStatuses.includes(node.availability_status)
      ? node.availability_status
      : 'unknown';
    const statusText = {
      available: 'Available',
      occupied: 'Occupied',
      reserved: 'Reserved',
      unavailable: 'Unavailable',
      unknown: 'Status not reported'
    }[availabilityStatus];
    const statusColor = availabilityStatus === 'unavailable' || availabilityStatus === 'occupied'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : availabilityStatus === 'available'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : availabilityStatus === 'reserved'
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-slate-700 bg-slate-100 border-slate-200';

    return {
      ...node,
      euclideanDist,
      walkingDist,
      walkingTime,
      category,
      statusText,
      statusColor,
      floorName: floors.find(floor => floor.id === node.floor_id)?.name || node.floor_id,
      occupancy: null
    };
  });

  // Filter nodes
  const filteredNodes = enrichedNodes.filter(node => {
    const matchesSearch = 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'all' || 
      node.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (node.facility_type || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Facility Locator
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Campus Facilities & Distance Matrix Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Walking distances are graph-calculated. Availability is shown only when campus administrators have reported a status.
          </p>
        </div>

        {startNode && (
          <div className="text-xs text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Calculating from: <strong className="text-emerald-900">{startNode.name}</strong></span>
          </div>
        )}
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search facility by name, room code, lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['all', 'laboratory', 'dining', 'sanitation', 'library', 'safety'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Amenities' : cat}
            </button>
          ))}
        </div>

      </div>

      {/* Facilities Directory Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Facility Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Category</th>
              <th className="p-3">Location Floor</th>
              <th className="p-3">Campus-reported status</th>
              <th className="p-3 bg-sky-50/70 text-sky-900">Dijkstra Walking Cost</th>
              <th className="p-3 text-slate-500">Straight-Line (Euclidean)</th>
              <th className="p-3">Accessibility</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredNodes.map(node => (
              <tr key={node.id} className="hover:bg-slate-50 transition-colors">
                
                {/* Name */}
                <td className="p-3 font-semibold text-slate-900">
                  <div className="flex flex-col">
                    <span>{node.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal line-clamp-1">{node.description}</span>
                  </div>
                </td>

                {/* Code */}
                <td className="p-3 font-mono text-[11px] font-bold text-slate-600">
                  {node.code || '-'}
                </td>

                {/* Category */}
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {node.category}
                  </span>
                </td>

                {/* Floor */}
                <td className="p-3 font-medium">
                  {node.floorName}
                </td>

                {/* Live Status & Capacity */}
                <td className="p-3">
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${node.statusColor || 'text-slate-700 bg-slate-100 border-slate-200'}`}>
                      {node.statusText || 'Available'}
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                      <span>Occupancy: not reported</span>
                    </div>
                  </div>
                </td>

                {/* Dijkstra Walking Cost */}
                <td className="p-3 bg-sky-50/40">
                  {node.id === startNode?.id ? (
                    <span className="text-emerald-700 font-bold text-xs">Current Location</span>
                  ) : (
                    <div className="flex items-center space-x-1.5 font-mono">
                      <strong className="text-sky-900 text-sm">{node.walkingDist} m</strong>
                      <span className="text-[11px] text-slate-500">({node.walkingTime}s)</span>
                    </div>
                  )}
                </td>

                {/* Euclidean Straight-Line Distance */}
                <td className="p-3 font-mono text-slate-500">
                  {node.id === startNode?.id ? '-' : `~${node.euclideanDist} m`}
                </td>

                {/* Accessibility */}
                <td className="p-3">
                  {node.is_accessible ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Step-Free</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold text-[11px]">
                      <span>Stairs Only</span>
                    </span>
                  )}
                </td>

                {/* Action: Route Button */}
                <td className="p-3 text-center">
                  <button
                    onClick={() => onSelectDestination(node.id)}
                    disabled={node.id === startNode?.id}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-sm transition-all active:scale-95"
                  >
                    <span>Route</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
