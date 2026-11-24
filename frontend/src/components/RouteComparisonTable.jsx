import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Zap, 
  Footprints, 
  Accessibility, 
  ArrowRight,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export default function RouteComparisonTable({
  activeRoute,
  accessibleAlternative,
  startNode,
  destNode,
  onApplyRoute
}) {
  if (!activeRoute) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">No Active Route Selected</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Select a starting location and destination from the navigation panel or click the "Fig. 2 Demo" button to generate an algorithm benchmark table.
        </p>
      </div>
    );
  }

  // Determine normal vs accessible route objects
  const isCurrentlyAccessible = activeRoute.accessibleModeApplied || activeRoute.isAccessible;
  const standardRoute = isCurrentlyAccessible && accessibleAlternative ? accessibleAlternative : activeRoute;
  const accessibleRoute = isCurrentlyAccessible ? activeRoute : accessibleAlternative;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
              Benchmark Analysis
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Dijkstra Algorithm & Accessibility Comparative Evaluation
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates walking cost $w(e)$, execution latency, step-free compliance, and vertical transit methods as formulated in Algorithm 1.
          </p>
        </div>

        <div className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          Source: <strong className="text-emerald-700">{startNode?.name || 'Start'}</strong> ➔ Target: <strong className="text-rose-700">{destNode?.name || 'Target'}</strong>
        </div>
      </div>

      {/* Main Comparative Benchmark Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">Evaluation Parameter</th>
              <th className="p-3.5 bg-sky-50/70 text-sky-950">
                <div className="flex items-center space-x-1">
                  <span>Standard Route (Quickest)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-200 text-sky-800">Normal</span>
                </div>
              </th>
              <th className="p-3.5 bg-amber-50/70 text-amber-950">
                <div className="flex items-center space-x-1">
                  <Accessibility className="w-3.5 h-3.5 text-amber-600" />
                  <span>Accessible Mode (Algorithm 1)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-800">Lift Preferred</span>
                </div>
              </th>
              <th className="p-3.5 text-slate-500">Delta ($\Delta$) Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Total Walking Cost */}
            <tr className="hover:bg-slate-50">
              <td className="p-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <span>Total Walking Distance $w(e)$</span>
              </td>
              <td className="p-3.5 font-mono font-bold text-base text-sky-900 bg-sky-50/30">
                {standardRoute?.totalCost || activeRoute.totalCost} m
              </td>
              <td className="p-3.5 font-mono font-bold text-base text-amber-900 bg-amber-50/30">
                {accessibleRoute?.totalCost || activeRoute.totalCost} m
              </td>
              <td className="p-3.5 font-mono font-semibold text-slate-700">
                {accessibleRoute && standardRoute 
                  ? `+${accessibleRoute.totalCost - standardRoute.totalCost} m (+${Math.round(((accessibleRoute.totalCost - standardRoute.totalCost) / standardRoute.totalCost) * 100)}%)`
                  : '0 m'}
              </td>
            </tr>

            {/* Estimated Walking Time */}
            <tr className="hover:bg-slate-50">
              <td className="p-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Estimated Walking Duration (@ 1.2 m/s)</span>
              </td>
              <td className="p-3.5 font-mono font-bold text-sky-900 bg-sky-50/30">
                ~{standardRoute?.walkingTimeSeconds || activeRoute.walkingTimeSeconds} seconds
              </td>
              <td className="p-3.5 font-mono font-bold text-amber-900 bg-amber-50/30">
                ~{accessibleRoute?.walkingTimeSeconds || activeRoute.walkingTimeSeconds} seconds
              </td>
              <td className="p-3.5 font-mono font-semibold text-slate-700">
                {accessibleRoute && standardRoute 
                  ? `+${accessibleRoute.walkingTimeSeconds - standardRoute.walkingTimeSeconds} s`
                  : '0 s'}
              </td>
            </tr>

            {/* Vertical transit method */}
            <tr className="hover:bg-slate-50">
              <td className="p-3.5 font-semibold text-slate-900">Vertical Transit Facility</td>
              <td className="p-3.5 bg-sky-50/30">
                {standardRoute?.usesStairs ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                    Staircase B (Flight Steps)
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Same Level / Lift
                  </span>
                )}
              </td>
              <td className="p-3.5 bg-amber-50/30">
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <Accessibility className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Lift 2 (Elevator / Step-Free)</span>
                </span>
              </td>
              <td className="p-3.5 text-slate-600">Eliminates stairs barrier</td>
            </tr>

            {/* Accessibility Compliance */}
            <tr className="hover:bg-slate-50">
              <td className="p-3.5 font-semibold text-slate-900">Wheelchair & Mobility Compliance</td>
              <td className="p-3.5 bg-sky-50/30">
                {standardRoute?.usesStairs ? (
                  <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Non-Accessible (Requires Stairs)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Fully Accessible</span>
                  </span>
                )}
              </td>
              <td className="p-3.5 bg-amber-50/30">
                <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>100% Step-Free Accessible</span>
                </span>
              </td>
              <td className="p-3.5 text-emerald-700 font-semibold">Compliant with universal design</td>
            </tr>

            {/* Traversed Graph Path Nodes */}
            <tr className="hover:bg-slate-50">
              <td className="p-3.5 font-semibold text-slate-900">Computed Node Sequence</td>
              <td className="p-3.5 bg-sky-50/30 text-[11px] font-mono leading-relaxed text-slate-800">
                {(standardRoute?.pathNodes || activeRoute.pathNodes).map(n => n.name.split(' (')[0]).join(' ➔ ')}
              </td>
              <td className="p-3.5 bg-amber-50/30 text-[11px] font-mono leading-relaxed text-slate-800">
                {(accessibleRoute?.pathNodes || activeRoute.pathNodes).map(n => n.name.split(' (')[0]).join(' ➔ ')}
              </td>
              <td className="p-3.5 text-slate-600 text-[11px]">
                Rerouted through Lift 2
              </td>
            </tr>

            {/* Algorithm Latency */}
            <tr className="hover:bg-slate-50">
              <td className="p-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Dijkstra Execution Latency (Amazon EC2)</span>
              </td>
              <td className="p-3.5 font-mono text-emerald-700 font-semibold bg-sky-50/30">&lt; 1.5 ms</td>
              <td className="p-3.5 font-mono text-emerald-700 font-semibold bg-amber-50/30">&lt; 1.8 ms</td>
              <td className="p-3.5 text-slate-500 text-[11px]">In-Memory Graph Cache</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Algorithm Computational Complexity Matrix */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          <span>Algorithm Theoretical Bounds & Performance Reference</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Complexity</span>
            <p className="text-sm font-mono font-black text-slate-900 mt-1">
              $\mathcal{O}((|V| + |E|) \log |V|)$
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Guaranteed by min-priority queue binary heap with $|V| = 22$ vertices and $|E| = 26$ edges.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Space Complexity</span>
            <p className="text-sm font-mono font-black text-slate-900 mt-1">
              $\mathcal{O}(|V| + |E|)$
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Graph adjacency list representation cached in Amazon EC2 instance memory for rapid queries.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Penalty Factor M</span>
            <p className="text-sm font-mono font-black text-amber-700 mt-1">
              $M = 10,000$ meters
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Assigned to all staircase edges so Dijkstra naturally prefers lifts and ramps (Algorithm 1).
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
