import React, { useState } from 'react';
import { 
  Utensils, 
  BookOpen, 
  Bath, 
  Flame, 
  Compass, 
  Droplet, 
  ArrowRight, 
  Navigation,
  MapPin,
  Clock
} from 'lucide-react';

const facilityCategories = [
  { id: 'canteen', name: 'Canteen & Food', icon: Utensils, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'washroom', name: 'Washrooms', icon: Bath, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'library', name: 'Library & Reading', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'emergency', name: 'Emergency & First Aid', icon: Flame, color: 'text-rose-600 bg-rose-50 border-rose-200' }
];

export default function FacilityLocatorPanel({
  nodes = [],
  startNodeId,
  onNavigateToFacility,
  onFindFacilities,
  nearbyResults = [],
  isLoading,
  accessibleMode
}) {
  const [activeCategory, setActiveCategory] = useState(null);

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    if (onFindFacilities) {
      onFindFacilities(catId);
    }
  };

  const startNode = nodes.find(n => n.id === startNodeId) || nodes[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 flex flex-col space-y-4">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Nearby Facility Locator</h2>
            <p className="text-[11px] text-slate-500">Single-source Dijkstra walking cost</p>
          </div>
        </div>

        {startNode && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate max-w-[140px]">
            From: {startNode.name.split(' (')[0]}
          </span>
        )}
      </div>

      {/* Facility Filter Pills */}
      <div className="grid grid-cols-2 gap-2">
        {facilityCategories.map(cat => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              disabled={isLoading}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                isSelected
                  ? 'ring-2 ring-sky-500 bg-sky-50/80 border-sky-300 text-sky-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-left leading-tight">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Results List Sorted by Walking Cost */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Nearest Facilities by Foot</span>
          {accessibleMode && (
            <span className="text-[10px] text-amber-600 font-bold">♿ Step-Free Mode Active</span>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
            <span className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></span>
            <span>Calculating graph walking paths…</span>
          </div>
        ) : nearbyResults && nearbyResults.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {nearbyResults.map((item, idx) => {
              const fac = item.facility;
              return (
                <div
                  key={fac.id || idx}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200 transition-all flex items-center justify-between"
                >
                  <div className="flex-1 mr-2">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-xs text-slate-900">{fac.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                        {fac.floor_id.replace('floor-', 'FL-').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{fac.description}</p>
                    
                    <div className="flex items-center space-x-3 mt-1.5 text-[11px] font-semibold text-slate-600">
                      <span className="text-sky-700">{item.walkingDistanceMeters}m walk</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~{item.walkingTimeSeconds}s</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToFacility(fac.id)}
                    className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-sm flex items-center space-x-1 text-xs font-semibold flex-shrink-0 transition-transform active:scale-95"
                    title="Calculate path and show on campus map"
                  >
                    <span>Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Click a facility above to locate the closest one from your current position.
          </div>
        )}
      </div>

    </div>
  );
}
