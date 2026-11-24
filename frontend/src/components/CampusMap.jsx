import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  MapPin, 
  Flag, 
  Building, 
  Footprints, 
  Accessibility, 
  Play, 
  Pause, 
  Compass, 
  ChevronRight,
  Maximize2,
  Building2,
  TreePine,
  Coffee,
  BookOpen,
  Download
} from 'lucide-react';
import { saveCampusOffline } from '../services/api';

const ACADEMIC_BLOCKS = [
  { id: 'block-c', name: 'C Block (SoCSE)', code: 'BLK-C' },
  { id: 'block-a', name: 'A Block', code: 'BLK-A' },
  { id: 'block-b', name: 'B Block', code: 'BLK-B' },
  { id: 'block-d', name: 'D Block', code: 'BLK-D' },
  { id: 'block-f', name: 'F Block', code: 'BLK-F' }
];

export default function CampusMap({
  floors = [],
  currentFloorId,
  setCurrentFloorId,
  nodes = [],
  edges = [],
  activeRoute = null,
  currentInstructionIndex = 0,
  startNodeId,
  setStartNodeId,
  destNodeId,
  setDestNodeId,
  onNodeClick
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSavingOffline, setIsSavingOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');

  // Active view: 'campus' (Master RVU Map) or block ID like 'block-c', 'block-a', etc.
  const isViewingCampusMaster = currentFloorId === 'floor-campus';

  // Current active block for indoor view
  const currentFloorObj = floors.find(f => f.id === currentFloorId);
  const activeBlockId = currentFloorObj?.block_id?.startsWith('block-') ? currentFloorObj.block_id : 'block-c';

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const containerRef = useRef(null);

  // Simulation loop
  useEffect(() => {
    let timer = null;
    if (isSimulating && activeRoute?.pathNodes?.length > 1) {
      timer = setInterval(() => {
        setSimStep(prev => {
          const next = prev + 1;
          if (next >= activeRoute.pathNodes.length) {
            setIsSimulating(false);
            return 0;
          }
          const nextNode = activeRoute.pathNodes[next];
          if (nextNode && nextNode.floor_id !== currentFloorId) {
            setCurrentFloorId(nextNode.floor_id);
          }
          return next;
        });
      }, 1500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating, activeRoute, currentFloorId, setCurrentFloorId]);

  const handleStartSimulation = () => {
    if (!activeRoute?.pathNodes || activeRoute.pathNodes.length < 2) return;
    setSimStep(0);
    const firstNode = activeRoute.pathNodes[0];
    if (firstNode.floor_id !== currentFloorId) {
      setCurrentFloorId(firstNode.floor_id);
    }
    setIsSimulating(true);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setSimStep(0);
  };

  // Filter nodes & edges for current floor
  const currentFloorNodes = nodes.filter(n => n.floor_id === currentFloorId);
  const currentFloorNodeIds = new Set(currentFloorNodes.map(n => n.id));

  const currentFloorEdges = edges.filter(e => 
    currentFloorNodeIds.has(e.source_node_id) && currentFloorNodeIds.has(e.target_node_id)
  );

  // Path segments visible on this floor
  const pathNodeIds = activeRoute?.pathNodeIds || [];
  const pathNodes = activeRoute?.pathNodes || [];
  const currentFloorPathSegments = [];

  if (pathNodes.length > 1) {
    for (let i = 0; i < pathNodes.length - 1; i++) {
      const u = pathNodes[i];
      const v = pathNodes[i + 1];
      if (u.floor_id === currentFloorId && v.floor_id === currentFloorId) {
        currentFloorPathSegments.push({ from: u, to: v, index: i });
      }
    }
  }

  // Floors traversed by active route
  const routeFloors = Array.from(new Set(pathNodes.map(n => n.floor_id)));
  const hasRouteOnOtherFloors = routeFloors.length > 1;

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSaveOffline = async () => {
    setIsSavingOffline(true);
    setOfflineMessage('');
    try {
      const saved = await saveCampusOffline();
      setOfflineMessage(`Saved campus map and ${saved.cachedLocationCount} locations for offline use.`);
    } catch (error) {
      setOfflineMessage(error.message || 'Could not save offline campus data.');
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Switch to an academic block's indoor floor
  const handleSelectBlock = (blkId, floorNum = 0) => {
    const targetFloor = floors.find(f => f.block_id === blkId && f.floor_number === floorNum) ||
                        floors.find(f => f.block_id === blkId) || floors[0];
    if (targetFloor) setCurrentFloorId(targetFloor.id);
  };

  // Get current active block floors (G, 1, 2, 3)
  const currentBlockFloors = floors.filter(f => f.block_id === activeBlockId).sort((a,b) => a.floor_number - b.floor_number);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col select-none">
      
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left Switcher: Campus Master vs Indoor Blocks */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          {/* Master Campus Overview Tab */}
          <button
            onClick={() => setCurrentFloorId('floor-campus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isViewingCampusMaster
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>RV University Master Map</span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Academic Block Dropdown / Buttons */}
          <div className="flex items-center space-x-1">
            {ACADEMIC_BLOCKS.map(blk => {
              const isActiveBlock = !isViewingCampusMaster && activeBlockId === blk.id;
              return (
                <button
                  key={blk.id}
                  onClick={() => handleSelectBlock(blk.id, currentFloorObj?.floor_number || 0)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActiveBlock
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {blk.code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Tools: Simulation, Graph Toggle, Zoom */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Simulation Button */}
          {activeRoute?.pathNodes?.length > 1 && (
            <button
              onClick={isSimulating ? handleStopSimulation : handleStartSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all flex items-center space-x-1.5 shadow-lg ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause Walk' : 'Simulate Walk'}</span>
            </button>
          )}

          {/* Graph Toggle */}
          <button
            onClick={() => setShowGraphOverlay(!showGraphOverlay)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all flex items-center space-x-1.5 shadow-lg ${
              showGraphOverlay 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30' 
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Graph Weights</span>
          </button>

          <button
            onClick={handleSaveOffline}
            disabled={isSavingOffline}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              {isSavingOffline ? 'Saving…' : 'Save offline'}
            </span>
          </button>

          {/* Zoom Controls */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center space-x-1">
            <button onClick={handleZoomIn} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleResetZoom} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Sub-bar: 4 Floors Switcher (When inside an academic block) */}
      {!isViewingCampusMaster && (
        <div className="absolute top-16 left-4 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center space-x-1">
          <Building2 className="w-3.5 h-3.5 text-sky-400 ml-2 mr-1" />
          <span className="text-[11px] font-bold text-slate-400 mr-1.5">
            {ACADEMIC_BLOCKS.find(b => b.id === activeBlockId)?.name || 'Block'}:
          </span>
          {currentBlockFloors.map(floor => {
            const isActiveFloor = floor.id === currentFloorId;
            const hasRoute = routeFloors.includes(floor.id);
            const label = floor.floor_number === 0 ? 'Ground (G)' :
                          floor.floor_number === 1 ? '1st Floor' :
                          floor.floor_number === 2 ? '2nd Floor (Labs)' : '3rd Floor (Adv. Labs)';

            return (
              <button
                key={floor.id}
                onClick={() => setCurrentFloorId(floor.id)}
                className={`relative px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isActiveFloor
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{label}</span>
                {hasRoute && !isActiveFloor && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                )}
                {hasRoute && !isActiveFloor && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Simulation Active Banner */}
      {isSimulating && activeRoute?.pathNodes?.[simStep] && (
        <div className="absolute top-28 left-4 right-4 z-20 pointer-events-auto max-w-md mx-auto bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-sky-500 shadow-2xl text-white flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              {simStep + 1}/{activeRoute.pathNodes.length}
            </span>
            <div>
              <p className="text-[10px] text-sky-400 uppercase font-bold tracking-wider">Simulating Student Walk</p>
              <p className="text-xs font-bold text-white leading-tight">{activeRoute.pathNodes[simStep].name}</p>
            </div>
          </div>
          <button
            onClick={handleStopSimulation}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            End
          </button>
        </div>
      )}

      {offlineMessage && (
        <div role="status" className="absolute bottom-4 left-4 z-20 max-w-sm rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-lg">
          {offlineMessage}
        </div>
      )}

      {/* SVG Canvas Map */}
      <div 
        ref={containerRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={isViewingCampusMaster ? "0 0 1000 950" : "0 0 1000 650"}
          className="w-full h-full max-h-[750px] transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width="1000" height={isViewingCampusMaster ? "950" : "650"} fill="#0f172a" />
          <rect width="1000" height={isViewingCampusMaster ? "950" : "650"} fill="url(#grid)" />

          {/* VIEW 1: RV UNIVERSITY CAMPUS MASTER OVERVIEW MAP */}
          {isViewingCampusMaster && (
            <g id="campus-master-view">
              {/* Official Campus Map Background Image */}
              <image 
                href="/assets/maps/rvu_campus_map.jpg" 
                x="0" 
                y="0" 
                width="1000" 
                height="950" 
                preserveAspectRatio="xMidYMid slice" 
                opacity="0.88" 
              />

              {/* Campus Master Title Banner */}
              <g transform="translate(40, 40)">
                <rect width="320" height="60" rx="12" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1.5" />
                <text x="20" y="28" fill="#38bdf8" fontSize="14" fontWeight="800">RV UNIVERSITY BENGALURU</text>
                <text x="20" y="46" fill="#94a3b8" fontSize="11" fontWeight="500">Interactive Outdoor Walkway & Campus Map</text>
              </g>

              {/* Building Quick Click Overlays */}
              {ACADEMIC_BLOCKS.map(blk => {
                const node = nodes.find(n => n.id === `out-node-${blk.id}`);
                if (!node) return null;
                return (
                  <g key={`click-${blk.id}`} transform={`translate(${node.x - 45}, ${node.y - 45})`}>
                    <rect 
                      width="90" 
                      height="30" 
                      rx="6" 
                      fill="#0284c7" 
                      fillOpacity="0.85" 
                      stroke="#ffffff" 
                      strokeWidth="1.5" 
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleSelectBlock(blk.id, 0)}
                    />
                    <text 
                      x="45" 
                      y="18" 
                      fill="#ffffff" 
                      fontSize="10" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      className="pointer-events-none"
                    >
                      {blk.name.split(' (')[0]} ➜
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* VIEW 2: INDOOR ACADEMIC BLOCK BLUEPRINT (4 FLOORS) */}
          {!isViewingCampusMaster && (
            <g id="indoor-blueprint">
              {/* Outer Block Wall */}
              <rect x="50" y="60" width="900" height="530" rx="18" fill="#1e293b" stroke="#334155" strokeWidth="4" />
              
              {/* Central Concourse Hallway */}
              <rect x="70" y="285" width="860" height="80" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              <rect x="280" y="80" width="80" height="490" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

              {/* Architectural Rooms Based on Current Floor */}
              {currentFloorObj?.floor_number === 0 && (
                <g id="floor-g-rooms">
                  {/* Entrance & Reception */}
                  <rect x="60" y="280" width="120" height="90" rx="10" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
                  <text x="120" y="325" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">MAIN ENTRANCE</text>
                  <text x="120" y="342" fill="#7dd3fc" fontSize="9" textAnchor="middle">Reception Desk</text>

                  {/* Lecture Hall G01 */}
                  <rect x="240" y="80" width="160" height="90" rx="10" fill="#4338ca" fillOpacity="0.25" stroke="#6366f1" strokeWidth="2" />
                  <text x="320" y="125" fill="#a5b4fc" fontSize="12" fontWeight="700" textAnchor="middle">LECTURE HALL G01</text>
                  <text x="320" y="142" fill="#cbd5e1" fontSize="10" textAnchor="middle">120-Seat Tiered Hall</text>

                  {/* Classroom G02 */}
                  <rect x="520" y="80" width="160" height="90" rx="10" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
                  <text x="600" y="125" fill="#7dd3fc" fontSize="12" fontWeight="700" textAnchor="middle">CLASSROOM G02</text>
                  <text x="600" y="142" fill="#cbd5e1" fontSize="10" textAnchor="middle">Academic Classroom</text>

                  {/* Department Office */}
                  <rect x="240" y="480" width="160" height="90" rx="10" fill="#059669" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />
                  <text x="320" y="525" fill="#6ee7b7" fontSize="12" fontWeight="700" textAnchor="middle">DEPARTMENT OFFICE</text>
                  <text x="320" y="542" fill="#a7f3d0" fontSize="10" textAnchor="middle">Help Desk & Inquiries</text>

                  {/* Washrooms & Drinking Water */}
                  <rect x="520" y="480" width="160" height="90" rx="10" fill="#0d9488" fillOpacity="0.25" stroke="#14b8a6" strokeWidth="2" />
                  <text x="600" y="525" fill="#5eead4" fontSize="12" fontWeight="700" textAnchor="middle">RESTROOMS & WATER</text>
                  <text x="600" y="542" fill="#99f6e4" fontSize="10" textAnchor="middle">Drinking Water Station</text>

                  {/* Stairs */}
                  <rect x="440" y="160" width="80" height="80" rx="8" fill="#e11d48" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="480" y="200" fill="#f43f5e" fontSize="11" fontWeight="700" textAnchor="middle">STAIRS</text>

                  {/* Lift */}
                  <rect x="440" y="410" width="80" height="80" rx="8" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.5" />
                  <text x="480" y="450" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">ELEVATOR</text>
                  <text x="480" y="468" fill="#fde68a" fontSize="9" textAnchor="middle">♿ Step-Free</text>
                </g>
              )}

              {/* 1st Floor Rooms */}
              {currentFloorObj?.floor_number === 1 && (
                <g id="floor-1-rooms">
                  {/* Classroom 101 */}
                  <rect x="240" y="80" width="160" height="90" rx="10" fill="#0284c7" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2" />
                  <text x="320" y="125" fill="#7dd3fc" fontSize="12" fontWeight="700" textAnchor="middle">CLASSROOM 101</text>
                  <text x="320" y="142" fill="#cbd5e1" fontSize="10" textAnchor="middle">Smart Lecture Room</text>

                  {/* Tutorial Room 102 */}
                  <rect x="520" y="80" width="160" height="90" rx="10" fill="#4338ca" fillOpacity="0.25" stroke="#6366f1" strokeWidth="2" />
                  <text x="600" y="125" fill="#a5b4fc" fontSize="12" fontWeight="700" textAnchor="middle">TUTORIAL ROOM 102</text>
                  <text x="600" y="142" fill="#cbd5e1" fontSize="10" textAnchor="middle">Problem-Solving Hall</text>

                  {/* Faculty Cabins */}
                  <rect x="240" y="480" width="160" height="90" rx="10" fill="#6366f1" fillOpacity="0.25" stroke="#818cf8" strokeWidth="2" />
                  <text x="320" y="525" fill="#c7d2fe" fontSize="12" fontWeight="700" textAnchor="middle">FACULTY CABINS 103</text>
                  <text x="320" y="542" fill="#e0e7ff" fontSize="10" textAnchor="middle">Professor Offices</text>

                  {/* Discussion Rooms */}
                  <rect x="520" y="480" width="160" height="90" rx="10" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2" />
                  <text x="600" y="525" fill="#fde68a" fontSize="12" fontWeight="700" textAnchor="middle">DISCUSSION ROOM 104</text>
                  <text x="600" y="542" fill="#fed7aa" fontSize="10" textAnchor="middle">Student Study Chamber</text>

                  {/* Stairs & Lift */}
                  <rect x="440" y="160" width="80" height="80" rx="8" fill="#e11d48" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="480" y="200" fill="#f43f5e" fontSize="11" fontWeight="700" textAnchor="middle">STAIRS</text>
                  <rect x="440" y="410" width="80" height="80" rx="8" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.5" />
                  <text x="480" y="450" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">ELEVATOR</text>
                  <text x="480" y="468" fill="#fde68a" fontSize="9" textAnchor="middle">♿ Floor 1</text>
                </g>
              )}

              {/* 2nd Floor Rooms (Computer Labs & Seminars) */}
              {currentFloorObj?.floor_number === 2 && (
                <g id="floor-2-rooms">
                  {/* Computer Labs */}
                  <rect x="240" y="80" width="160" height="90" rx="10" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2.5" />
                  <text x="320" y="125" fill="#7dd3fc" fontSize="12" fontWeight="800" textAnchor="middle">COMPUTER SCIENCE LAB</text>
                  <text x="320" y="142" fill="#bae6fd" fontSize="10" textAnchor="middle">High Performance Lab 201</text>

                  {/* Seminar Room */}
                  <rect x="520" y="80" width="160" height="90" rx="10" fill="#8b5cf6" fillOpacity="0.25" stroke="#a78bfa" strokeWidth="2" />
                  <text x="600" y="125" fill="#c4b5fd" fontSize="12" fontWeight="700" textAnchor="middle">SEMINAR ROOM 202</text>
                  <text x="600" y="142" fill="#ddd6fe" fontSize="10" textAnchor="middle">AV Presentation Hall</text>

                  {/* Faculty Offices */}
                  <rect x="240" y="480" width="160" height="90" rx="10" fill="#6366f1" fillOpacity="0.25" stroke="#818cf8" strokeWidth="2" />
                  <text x="320" y="525" fill="#c7d2fe" fontSize="12" fontWeight="700" textAnchor="middle">FACULTY CONSULTING 203</text>
                  <text x="320" y="542" fill="#e0e7ff" fontSize="10" textAnchor="middle">Academic Advisors</text>

                  {/* Student Project Spaces */}
                  <rect x="520" y="480" width="160" height="90" rx="10" fill="#059669" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />
                  <text x="600" y="525" fill="#6ee7b7" fontSize="12" fontWeight="700" textAnchor="middle">PROJECT LAB 204</text>
                  <text x="600" y="542" fill="#a7f3d0" fontSize="10" textAnchor="middle">Capstone Innovation Space</text>

                  {/* Stairs & Lift */}
                  <rect x="440" y="160" width="80" height="80" rx="8" fill="#e11d48" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="480" y="200" fill="#f43f5e" fontSize="11" fontWeight="700" textAnchor="middle">STAIRS</text>
                  <rect x="440" y="410" width="80" height="80" rx="8" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.5" />
                  <text x="480" y="450" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">ELEVATOR</text>
                  <text x="480" y="468" fill="#fde68a" fontSize="9" textAnchor="middle">♿ Floor 2</text>
                </g>
              )}

              {/* 3rd Floor Rooms (Advanced Labs & Conference) */}
              {currentFloorObj?.floor_number === 3 && (
                <g id="floor-3-rooms">
                  {/* Lecture Hall 301 */}
                  <rect x="240" y="80" width="160" height="90" rx="10" fill="#4338ca" fillOpacity="0.25" stroke="#6366f1" strokeWidth="2" />
                  <text x="320" y="125" fill="#a5b4fc" fontSize="12" fontWeight="700" textAnchor="middle">LECTURE HALL 301</text>
                  <text x="320" y="142" fill="#cbd5e1" fontSize="10" textAnchor="middle">Multimedia Auditorium</text>

                  {/* Advanced AI & Cloud Lab */}
                  <rect x="520" y="80" width="160" height="90" rx="10" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="2.5" />
                  <text x="600" y="125" fill="#7dd3fc" fontSize="12" fontWeight="800" textAnchor="middle">ADVANCED AI LAB 302</text>
                  <text x="600" y="142" fill="#bae6fd" fontSize="10" textAnchor="middle">Cloud & Robotics Lab</text>

                  {/* Senior Faculty Cabins */}
                  <rect x="240" y="480" width="160" height="90" rx="10" fill="#6366f1" fillOpacity="0.25" stroke="#818cf8" strokeWidth="2" />
                  <text x="320" y="525" fill="#c7d2fe" fontSize="12" fontWeight="700" textAnchor="middle">SENIOR FACULTY 303</text>
                  <text x="320" y="542" fill="#e0e7ff" fontSize="10" textAnchor="middle">Dean & HOD Offices</text>

                  {/* Conference & Meeting */}
                  <rect x="520" y="480" width="160" height="90" rx="10" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2" />
                  <text x="600" y="525" fill="#fde68a" fontSize="12" fontWeight="700" textAnchor="middle">CONFERENCE ROOM 304</text>
                  <text x="600" y="542" fill="#fed7aa" fontSize="10" textAnchor="middle">Meeting & Defense Hall</text>

                  {/* Stairs & Lift */}
                  <rect x="440" y="160" width="80" height="80" rx="8" fill="#e11d48" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="480" y="200" fill="#f43f5e" fontSize="11" fontWeight="700" textAnchor="middle">STAIRS</text>
                  <rect x="440" y="410" width="80" height="80" rx="8" fill="#d97706" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.5" />
                  <text x="480" y="450" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">ELEVATOR</text>
                  <text x="480" y="468" fill="#fde68a" fontSize="9" textAnchor="middle">♿ Floor 3</text>
                </g>
              )}
            </g>
          )}

          {/* GRAPH EDGES OVERLAY */}
          {showGraphOverlay && (
            <g id="graph-edges" opacity="0.6">
              {currentFloorEdges.map(edge => {
                const u = nodes.find(n => n.id === edge.source_node_id);
                const v = nodes.find(n => n.id === edge.target_node_id);
                if (!u || !v) return null;
                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2;
                return (
                  <g key={edge.id}>
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke={edge.type === 'staircase' ? '#f43f5e' : edge.type === 'lift' ? '#f59e0b' : '#38bdf8'}
                      strokeWidth="2.5"
                      strokeDasharray={edge.type === 'staircase' ? '4 3' : 'none'}
                    />
                    <circle cx={midX} cy={midY} r="9" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                    <text x={midX} y={midY + 3.5} fill="#e2e8f0" fontSize="9" fontWeight="600" textAnchor="middle">
                      {edge.weight}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ACTIVE DIJKSTRA ROUTE PATH (GLOWING ANIMATED LINE) */}
          {currentFloorPathSegments.length > 0 && (
            <g id="active-route" filter="url(#glow)">
              {currentFloorPathSegments.map((seg, idx) => (
                <g key={`path-${idx}`}>
                  {seg.index === currentInstructionIndex - 1 && (
                    <line
                      x1={seg.from.x}
                      y1={seg.from.y}
                      x2={seg.to.x}
                      y2={seg.to.y}
                      stroke="#fbbf24"
                      strokeWidth="13"
                      strokeLinecap="round"
                      opacity="0.55"
                    />
                  )}
                  <line
                    x1={seg.from.x}
                    y1={seg.from.y}
                    x2={seg.to.x}
                    y2={seg.to.y}
                    stroke="#0284c7"
                    strokeWidth="9"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <line
                    x1={seg.from.x}
                    y1={seg.from.y}
                    x2={seg.to.x}
                    y2={seg.to.y}
                    stroke="url(#routeGradient)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1={seg.from.x}
                    y1={seg.from.y}
                    x2={seg.to.x}
                    y2={seg.to.y}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="6 8"
                    className="animate-route-dash"
                  />
                </g>
              ))}
            </g>
          )}

          {/* SIMULATED WALKING AVATAR */}
          {isSimulating && activeRoute?.pathNodes?.[simStep] && activeRoute.pathNodes[simStep].floor_id === currentFloorId && (
            <g transform={`translate(${activeRoute.pathNodes[simStep].x}, ${activeRoute.pathNodes[simStep].y})`}>
              <circle r="26" fill="#38bdf8" opacity="0.3" className="animate-ping" />
              <circle r="16" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
              <circle r="7" fill="#ffffff" />
            </g>
          )}

          {/* VERTICES / NODES ON THIS FLOOR */}
          <g id="map-nodes">
            {currentFloorNodes.map(node => {
              const isStart = node.id === startNodeId;
              const isDest = node.id === destNodeId;
              const isInPath = pathNodeIds.includes(node.id);
              const isStairs = node.type === 'staircase';
              const isLift = node.type === 'lift';

              let fillColor = '#0284c7';
              if (isStart) fillColor = '#10b981';
              else if (isDest) fillColor = '#ef4444';
              else if (isLift) fillColor = '#f59e0b';
              else if (isStairs) fillColor = '#f43f5e';
              else if (node.facility_type === 'canteen') fillColor = '#ea580c';
              else if (node.facility_type === 'library') fillColor = '#059669';
              else if (node.facility_type === 'washroom') fillColor = '#0d9488';

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                    if (onNodeClick) onNodeClick(node);
                  }}
                >
                  {(isStart || isDest) && (
                    <circle cx={node.x} cy={node.y} r="18" fill={isStart ? '#10b981' : '#ef4444'} opacity="0.3" className="animate-ping" />
                  )}

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isInPath ? "11" : "8"}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth={isInPath ? "3" : "1.5"}
                  />

                  {isStart && (
                    <g transform={`translate(${node.x - 14}, ${node.y - 28})`}>
                      <rect width="28" height="15" rx="4" fill="#10b981" />
                      <text x="14" y="11" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">START</text>
                    </g>
                  )}

                  {isDest && (
                    <g transform={`translate(${node.x - 14}, ${node.y - 28})`}>
                      <rect width="28" height="15" rx="4" fill="#ef4444" />
                      <text x="14" y="11" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">DEST</text>
                    </g>
                  )}

                  <text
                    x={node.x}
                    y={node.y + 19}
                    fill="#f1f5f9"
                    fontSize="9.5"
                    fontWeight="600"
                    textAnchor="middle"
                    className="drop-shadow-md select-none"
                  >
                    {node.name.length > 22 ? node.name.slice(0, 20) + '…' : node.name}
                  </text>
                </g>
              );
            })}
          </g>

        </svg>

        {/* Selected Node Card Overlay */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl text-white z-30 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {selectedNode.type} {selectedNode.facility_type ? `• ${selectedNode.facility_type}` : ''}
                </span>
                <h3 className="font-bold text-base text-white mt-1">{selectedNode.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedNode.description}</p>
                <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-400">
                  <span>Code: <strong className="text-slate-200">{selectedNode.code}</strong></span>
                  <span>•</span>
                  <span>Accessible: <strong className={selectedNode.is_accessible ? "text-emerald-400" : "text-rose-400"}>
                    {selectedNode.is_accessible ? "Yes (Step-Free)" : "Stairs Only"}
                  </strong></span>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>

            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setStartNodeId(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Set Start Point</span>
              </button>
              <button
                onClick={() => {
                  setDestNodeId(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Set Destination</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Map Legend Footer */}
      <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Start</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Destination</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>♿ Accessible Elevator</span>
          </div>
          <div className="flex items-center space-x-1.5 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
            <span>Staircase</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Click any room or building to set route
        </div>
      </div>

    </div>
  );
}
