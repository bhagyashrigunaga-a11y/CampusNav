import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CampusMap from './components/CampusMap';
import RouteSearchPanel from './components/RouteSearchPanel';
import FacilityLocatorPanel from './components/FacilityLocatorPanel';
import FacilityDirectoryTable from './components/FacilityDirectoryTable';
import GraphInspectorTable from './components/GraphInspectorTable';
import ClassScheduleView from './components/ClassScheduleView';
import EmergencyEvacuationView from './components/EmergencyEvacuationView';
import FacultyFinder from './components/FacultyFinder';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginDialog from './components/AdminLoginDialog';

import { 
  fetchFloors, 
  fetchNodes, 
  fetchEdges, 
  calculateRoute, 
  findNearbyFacilities,
  adminLogin,
  adminLogout
} from './services/api';

import { 
  Compass, 
  Navigation, 
  Map as MapIcon, 
  Building2, 
  GitFork, 
  Calendar,
  Flame,
  UserRound
} from 'lucide-react';

export default function App() {
  const [floors, setFloors] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [currentFloorId, setCurrentFloorId] = useState('floor-campus');
  
  // Navigation states
  const [startNodeId, setStartNodeId] = useState('out-node-gate'); // Main Campus Gate
  const [destNodeId, setDestNodeId] = useState('block-c-2-cslab'); // C Block CS Lab 201
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [routeAlgorithm, setRouteAlgorithm] = useState('dijkstra');
  const [activeRoute, setActiveRoute] = useState(null);
  const [activeInstructionIndex, setActiveInstructionIndex] = useState(0);
  const [accessibleAlternative, setAccessibleAlternative] = useState(null);
  
  // Facilities states
  const [nearbyResults, setNearbyResults] = useState([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState('route'); // 'route' | 'facilities'
  
  // Primary Student Views:
  // 'map' | 'timetable' | 'evacuation' | 'directory' | 'comparison' | 'graph' | 'faculty'
  const [activeAppTab, setActiveAppTab] = useState('map');

  // App UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    loadCampusData();
  }, []);

  const loadCampusData = async () => {
    try {
      setIsLoading(true);
      const [floorsData, nodesData, edgesData] = await Promise.all([
        fetchFloors(),
        fetchNodes(),
        fetchEdges()
      ]);
      setFloors(floorsData);
      setNodes(nodesData);
      setEdges(edgesData);
      if (floorsData.length > 0 && !currentFloorId) {
        setCurrentFloorId(floorsData[0].id);
      }
      if (activeRoute && startNodeId && destNodeId) {
        try {
          const routeData = await calculateRoute(startNodeId, destNodeId, accessibleMode, routeAlgorithm);
          setActiveRoute(routeData.route);
          setAccessibleAlternative(routeData.accessibleAlternative);
        } catch (routeError) {
          setActiveRoute(null);
          setAccessibleAlternative(null);
          setErrorMessage(routeError.message || 'The route could not be recalculated after the campus data changed.');
        }
      }
      
      // Auto-calculate initial demo route (Main Gate to C Block CS Lab)
      if (!activeRoute) {
        setTimeout(() => {
          handleCalculateRoute(false, 'out-node-gate', 'block-c-2-cslab');
        }, 150);
      }
    } catch (err) {
      console.error('Failed to load campus graph data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateRoute = async (isAccessible = accessibleMode, srcId = startNodeId, dstId = destNodeId) => {
    if (!srcId || !dstId) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await calculateRoute(srcId, dstId, isAccessible, routeAlgorithm);
      setActiveRoute(data.route);
      setAccessibleAlternative(data.accessibleAlternative);

      // Auto switch to starting floor if needed
      const startNode = nodes.find(n => n.id === srcId);
      if (startNode && startNode.floor_id !== currentFloorId) {
        setCurrentFloorId(startNode.floor_id);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Route calculation failed');
      setActiveRoute(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setAccessibleAlternative(null);
  };

  // Triggers Route Demo from Main Gate to C Block CS Lab
  const handleRunPaperDemo = () => {
    setStartNodeId('out-node-gate');
    setDestNodeId('block-c-2-cslab');
    setCurrentFloorId('floor-campus');
    setActiveSidebarTab('route');
    setActiveAppTab('map');
    handleCalculateRoute(accessibleMode, 'out-node-gate', 'block-c-2-cslab');
  };

  const handleFindFacilities = async (category) => {
    if (!startNodeId) {
      setErrorMessage('Please select a starting location first to locate nearby facilities.');
      return;
    }
    try {
      setIsLoading(true);
      const data = await findNearbyFacilities(startNodeId, category, accessibleMode);
      setNearbyResults(data.facilities || []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to locate facilities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToFacility = (facilityNodeId) => {
    setDestNodeId(facilityNodeId);
    setActiveSidebarTab('route');
    setActiveAppTab('map');
    setTimeout(() => {
      handleCalculateRoute(accessibleMode, startNodeId, facilityNodeId);
    }, 100);
  };

  const handleTriggerEvacuation = (fromRoomId, toExitId) => {
    setStartNodeId(fromRoomId);
    setDestNodeId(toExitId);
    setActiveAppTab('map');
    setTimeout(() => {
      handleCalculateRoute(false, fromRoomId, toExitId);
    }, 100);
  };

  const handleAdminLogin = async (username, password) => {
    await adminLogin(username, password);
    setIsAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    setActiveAppTab('admin');
  };

  const handleAdminLogout = () => {
    adminLogout();
    setIsAdminAuthenticated(false);
    if (activeAppTab === 'admin') setActiveAppTab('map');
  };

  const startNode = nodes.find(n => n.id === startNodeId);
  const destNode = nodes.find(n => n.id === destNodeId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <Navbar
        accessibleMode={accessibleMode}
        setAccessibleMode={(val) => {
          setAccessibleMode(val);
          if (activeRoute) {
            handleCalculateRoute(val);
          }
        }}
        onRunDemo={handleRunPaperDemo}
        onOpenEvacuation={() => setActiveAppTab('evacuation')}
        onOpenTimetable={() => setActiveAppTab('timetable')}
        onOpenAdmin={() => isAdminAuthenticated ? setActiveAppTab('admin') : setIsAdminLoginOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      {/* Primary Academic View Tabs */}
      <div className="bg-white border-b border-slate-200/90 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 text-xs font-semibold scrollbar-none">
            
            {/* Tab 1: Navigation Map */}
            <button
              onClick={() => setActiveAppTab('map')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeAppTab === 'map'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Campus Map & Navigation</span>
            </button>

            {/* Tab 2: Timetable & Lecture Finder */}
            <button
              onClick={() => setActiveAppTab('timetable')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeAppTab === 'timetable'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lecture Timetable ("Find My Class")</span>
            </button>

            {/* Tab 3: Emergency Evacuation */}
            <button
              onClick={() => setActiveAppTab('evacuation')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeAppTab === 'evacuation'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Emergency Evacuation Route</span>
            </button>

            {/* Tab 4: Facility Directory & Live Status */}
            <button
              onClick={() => setActiveAppTab('directory')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeAppTab === 'directory'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Facility Directory & Room Status</span>
            </button>

            {/* Tab 5: Graph Topology & Edge Weights */}
            <button
              onClick={() => setActiveAppTab('graph')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeAppTab === 'graph'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Graph & Weight Matrix</span>
            </button>

            <button
              onClick={() => setActiveAppTab('faculty')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeAppTab === 'faculty'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserRound className="w-3.5 h-3.5" />
              <span>Faculty & Staff</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-4">
        
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between shadow-sm">
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)}
              className="font-bold ml-2 text-rose-700 hover:text-rose-900"
            >
              ✕
            </button>
          </div>
        )}

        <>
          {/* VIEW 1: Interactive Campus Map & Route Finder */}
          {activeAppTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left Sidebar: Controls & Turn-by-Turn */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 order-2 lg:order-1">
                  
                  {/* Tab Selector: Route Search vs Facility Locator */}
                  <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setActiveSidebarTab('route')}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        activeSidebarTab === 'route'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-sky-600" />
                      <span>Room Route</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveSidebarTab('facilities');
                        if (nearbyResults.length === 0) {
                          handleFindFacilities('canteen');
                        }
                      }}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                        activeSidebarTab === 'facilities'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nearby Amenities</span>
                    </button>
                  </div>

                  {/* Panel Views */}
                  {activeSidebarTab === 'route' ? (
                    <RouteSearchPanel
                      nodes={nodes}
                      startNodeId={startNodeId}
                      setStartNodeId={setStartNodeId}
                      destNodeId={destNodeId}
                      setDestNodeId={setDestNodeId}
                      accessibleMode={accessibleMode}
                      setAccessibleMode={(val) => {
                        setAccessibleMode(val);
                        if (activeRoute) handleCalculateRoute(val);
                      }}
                      onCalculateRoute={() => handleCalculateRoute(accessibleMode)}
                      onClearRoute={handleClearRoute}
                      activeRoute={activeRoute}
                      accessibleAlternative={accessibleAlternative}
                      isLoading={isLoading}
                      onRunPaperDemo={handleRunPaperDemo}
                      routeAlgorithm={routeAlgorithm}
                      setRouteAlgorithm={setRouteAlgorithm}
                      onInstructionFloorChange={setCurrentFloorId}
                      onInstructionIndexChange={setActiveInstructionIndex}
                    />
                  ) : (
                    <FacilityLocatorPanel
                      nodes={nodes}
                      startNodeId={startNodeId}
                      onNavigateToFacility={handleNavigateToFacility}
                      onFindFacilities={handleFindFacilities}
                      nearbyResults={nearbyResults}
                      isLoading={isLoading}
                      accessibleMode={accessibleMode}
                    />
                  )}

                </div>

                {/* Right Map Canvas Area */}
                <div className="lg:col-span-7 xl:col-span-8 order-1 lg:order-2">
                  <CampusMap
                    floors={floors}
                    currentFloorId={currentFloorId}
                    setCurrentFloorId={setCurrentFloorId}
                    nodes={nodes}
                    edges={edges}
                    activeRoute={activeRoute}
                    currentInstructionIndex={activeInstructionIndex}
                    startNodeId={startNodeId}
                    setStartNodeId={setStartNodeId}
                    destNodeId={destNodeId}
                    setDestNodeId={setDestNodeId}
                  />
                </div>

              </div>
            )}

            {/* VIEW 2: Student Timetable & Class Schedule Finder */}
            {activeAppTab === 'timetable' && (
              <ClassScheduleView
                nodes={nodes}
                onNavigateToRoom={handleNavigateToFacility}
              />
            )}

            {/* VIEW 3: Emergency Evacuation Route Guide */}
            {activeAppTab === 'evacuation' && (
              <EmergencyEvacuationView
                nodes={nodes}
                edges={edges}
                currentStartId={startNodeId}
                onTriggerEvacuation={handleTriggerEvacuation}
              />
            )}

            {/* VIEW 4: Facilities Distance Directory & Room Status Table */}
            {activeAppTab === 'directory' && (
              <FacilityDirectoryTable
                nodes={nodes}
                edges={edges}
                floors={floors}
                currentStartId={startNodeId}
                onSelectDestination={handleNavigateToFacility}
              />
            )}

          {/* VIEW 5: Graph Topology & Edge Weights */}
          {activeAppTab === 'graph' && (
            <GraphInspectorTable
              nodes={nodes}
              edges={edges}
              accessibleMode={accessibleMode}
            />
          )}

          {activeAppTab === 'faculty' && (
            <FacultyFinder onNavigateToOffice={handleNavigateToFacility} />
          )}

          {activeAppTab === 'admin' && isAdminAuthenticated && (
            <AdminDashboard
              floors={floors}
              nodes={nodes}
              edges={edges}
              currentFloorId={currentFloorId}
              onRefreshData={loadCampusData}
            />
          )}
        </>

      </main>

      {/* Bottom Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            CampusNav © 2026 • RV University SoCSE Major Project
          </p>
          <p className="text-[11px] text-slate-400">
            Prerana Prakash Talawar (1RUA24CSE0333) • Bhagyshree Laxmikant Gunaga (1RUA24CSE0084) • Bhuvana M G (1RUA24CSE0092)
          </p>
        </div>
      </footer>

      {isAdminLoginOpen && (
        <AdminLoginDialog
          onClose={() => setIsAdminLoginOpen(false)}
          onLogin={handleAdminLogin}
        />
      )}

    </div>
  );
}
