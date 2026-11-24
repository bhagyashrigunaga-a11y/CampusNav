import React, { useState } from 'react';
import { 
  GitFork, 
  Layers, 
  MapPin, 
  TrendingUp, 
  ArrowRightLeft, 
  Filter, 
  Accessibility,
  Info
} from 'lucide-react';

export default function GraphInspectorTable({
  nodes = [],
  edges = [],
  accessibleMode
}) {
  const [graphTab, setGraphTab] = useState('edges'); // 'edges' | 'vertices'
  const [filterType, setFilterType] = useState('all');

  // Calculate degrees for vertices
  const degreeMap = new Map();
  nodes.forEach(n => degreeMap.set(n.id, 0));
  edges.forEach(e => {
    degreeMap.set(e.source_node_id, (degreeMap.get(e.source_node_id) || 0) + 1);
    degreeMap.set(e.target_node_id, (degreeMap.get(e.target_node_id) || 0) + 1);
  });

  const filteredEdges = edges.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Graph Topology
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Campus Graph Vertices $V$ & Weighted Edge Adjacency Matrix $E$
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mathematical model $G = (V, E, w)$ with live dynamic edge weights $w'(e)$ calculated according to Algorithm 1.
          </p>
        </div>

        {/* Graph Summary Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-slate-700 border border-slate-200">
            Vertices |V| = <strong className="text-slate-900">{nodes.length}</strong>
          </span>
          <span className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-slate-700 border border-slate-200">
            Edges |E| = <strong className="text-slate-900">{edges.length}</strong>
          </span>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full sm:w-auto">
          <button
            onClick={() => setGraphTab('edges')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              graphTab === 'edges' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Edges & Cost Matrix ({edges.length})
          </button>
          <button
            onClick={() => setGraphTab('vertices')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              graphTab === 'vertices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vertices & Coordinates ({nodes.length})
          </button>
        </div>

        {/* Edge Filter (when in edges tab) */}
        {graphTab === 'edges' && (
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {['all', 'corridor', 'staircase', 'lift'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* EDGES TABLE */}
      {graphTab === 'edges' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Edge ID</th>
                <th className="p-3">Source Vertex (u)</th>
                <th className="p-3">Target Vertex (v)</th>
                <th className="p-3">Transit Type</th>
                <th className="p-3 bg-sky-50/70 text-sky-900 font-bold">Base Weight $w(e)$</th>
                <th className="p-3 bg-amber-50/70 text-amber-900 font-bold">
                  Accessible Weight $w'(e)$ [Alg 1]
                </th>
                <th className="p-3 text-center">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEdges.map(edge => {
                const u = nodes.find(n => n.id === edge.source_node_id);
                const v = nodes.find(n => n.id === edge.target_node_id);
                const isStairs = edge.type === 'staircase' || edge.type === 'stairs';
                const accessibleWeight = isStairs ? Number(edge.weight) + 10000 : edge.weight;

                return (
                  <tr key={edge.id} className="hover:bg-slate-50 transition-colors font-mono">
                    <td className="p-3 text-slate-500 text-[11px] font-sans font-bold">{edge.id}</td>
                    <td className="p-3 font-sans font-semibold text-slate-900">
                      {u ? u.name : edge.source_node_id}
                    </td>
                    <td className="p-3 font-sans font-semibold text-slate-900">
                      {v ? v.name : edge.target_node_id}
                    </td>
                    <td className="p-3 font-sans capitalize">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        edge.type === 'lift' ? 'bg-amber-100 text-amber-800' :
                        edge.type === 'staircase' ? 'bg-rose-100 text-rose-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {edge.type}
                      </span>
                    </td>
                    
                    {/* Base Weight */}
                    <td className="p-3 bg-sky-50/30 font-bold text-sky-950 text-sm">
                      {edge.weight} m
                    </td>

                    {/* Accessible Weight (Algorithm 1) */}
                    <td className="p-3 bg-amber-50/30">
                      {isStairs ? (
                        <div className="flex items-center space-x-1 text-rose-700 font-bold">
                          <span>{accessibleWeight} m</span>
                          <span className="text-[10px] px-1 py-0.2 bg-rose-200 text-rose-900 rounded">
                            (+M Penalty)
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-bold">
                          {accessibleWeight} m (Normal)
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center font-sans text-slate-500">
                      <span className="inline-flex items-center space-x-1 text-[11px]">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        <span>Bi-directional</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VERTICES TABLE */}
      {graphTab === 'vertices' && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Node ID</th>
                <th className="p-3">Vertex Name</th>
                <th className="p-3">Floor Level</th>
                <th className="p-3">Vertex Type</th>
                <th className="p-3 font-mono">Map Coordinates (X, Y)</th>
                <th className="p-3 text-center">Connected Edges (Degree)</th>
                <th className="p-3">Accessibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {nodes.map(node => (
                <tr key={node.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-slate-500 text-[11px]">{node.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{node.name}</td>
                  <td className="p-3 font-medium">
                    {node.floor_id.replace('floor-', 'FL-').toUpperCase()}
                  </td>
                  <td className="p-3 capitalize">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {node.facility_type || node.type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-indigo-700 font-bold">
                    ({node.x}, {node.y})
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800">
                    {degreeMap.get(node.id) || 0}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      node.is_accessible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {node.is_accessible ? 'Step-Free' : 'Stairs Only'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
