import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Flag, 
  ArrowUpDown, 
  Accessibility, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ChevronRight,
  Footprints,
  X,
  Mic,
  Volume2,
  VolumeX,
  ChevronLeft,
  QrCode,
  Activity,
  Gauge,
  Flame,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react';
import QrLocationScanner from './QrLocationScanner';

export default function RouteSearchPanel({
  nodes = [],
  startNodeId,
  setStartNodeId,
  destNodeId,
  setDestNodeId,
  accessibleMode,
  setAccessibleMode,
  onCalculateRoute,
  onClearRoute,
  activeRoute,
  accessibleAlternative,
  isLoading,
  onRunPaperDemo,
  routeAlgorithm = 'dijkstra',
  setRouteAlgorithm,
  onInstructionFloorChange,
  onInstructionIndexChange
}) {
  const [startSearch, setStartSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [bodyWeightKg, setBodyWeightKg] = useState('70');
  const [tracking, setTracking] = useState({
    active: false,
    paused: false,
    completed: false,
    steps: 0,
    elapsedMs: 0,
    startedAt: null,
    stepLengthMeters: 0.72,
    sensorAvailable: false,
    sensorStatus: 'Motion sensors are not available on this device.'
  });
  const recognitionRef = useRef(null);
  const motionStateRef = useRef({ lastMagnitude: 0, lastStepTime: 0 });

  useEffect(() => {
    setCurrentInstructionIndex(0);
  }, [activeRoute]);

  useEffect(() => {
    const instruction = activeRoute?.instructions?.[currentInstructionIndex];
    if (instruction?.floor) onInstructionFloorChange?.(instruction.floor);
    onInstructionIndexChange?.(currentInstructionIndex);
  }, [activeRoute, currentInstructionIndex, onInstructionFloorChange, onInstructionIndexChange]);

  useEffect(() => {
    if (!voiceEnabled || !activeRoute?.instructions?.[currentInstructionIndex]) return undefined;
    if (!window.speechSynthesis) {
      setVoiceMessage('Voice output is not available in this browser.');
      setVoiceEnabled(false);
      return undefined;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeRoute.instructions[currentInstructionIndex].text);
    utterance.onerror = () => setVoiceMessage('Could not play the spoken instruction.');
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [voiceEnabled, currentInstructionIndex, activeRoute]);

  useEffect(() => () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const startVoiceDestinationSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage('Voice search is not supported in this browser. Select a location manually.');
      return;
    }
    setVoiceMessage('Listening for a destination…');
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    recognition.onresult = (event) => {
      const spokenQuery = event.results[0][0].transcript.trim().toLowerCase();
      const destination = nodes.find(node =>
        node.name.toLowerCase() === spokenQuery ||
        (node.code || '').toLowerCase() === spokenQuery
      ) || nodes.find(node =>
        node.name.toLowerCase().includes(spokenQuery) ||
        (node.code || '').toLowerCase().includes(spokenQuery)
      );
      if (destination) {
        setDestNodeId(destination.id);
        setVoiceMessage(`Destination set to ${destination.name}.`);
      } else {
        setVoiceMessage(`No campus location matched "${event.results[0][0].transcript}". Choose it manually.`);
      }
    };
    recognition.onerror = (event) => setVoiceMessage(`Voice search failed (${event.error}). Choose a destination manually.`);
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognition.start();
  };

  // Swap start and destination
  const handleSwap = () => {
    const temp = startNodeId;
    setStartNodeId(destNodeId);
    setDestNodeId(temp);
  };

  // Filter nodes for dropdowns
  const filterNodes = (searchStr) => {
    if (!searchStr) return nodes;
    const q = searchStr.toLowerCase();
    return nodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      (n.code || '').toLowerCase().includes(q) ||
      (n.facility_type || '').toLowerCase().includes(q)
    );
  };

  const remainingDistance = activeRoute?.pathEdges
    ?.slice(Math.max(0, currentInstructionIndex - 1))
    .reduce((sum, edge) => sum + (Number(edge.rawWeight ?? edge.weight) || 0), 0)
    ?? activeRoute?.totalCost
    ?? 0;
  const remainingTimeSeconds = Math.ceil(remainingDistance / 1.2);

  const routeDistanceMeters = Number(activeRoute?.totalCost || 0);
  const estimatedStepLength = Number(tracking.stepLengthMeters) > 0 ? Number(tracking.stepLengthMeters) : 0.72;
  const estimatedTotalRouteSteps = activeRoute ? Math.max(1, Math.round(routeDistanceMeters / estimatedStepLength)) : 0;
  const detectedDistanceMeters = tracking.steps * estimatedStepLength;
  const weightKg = Number(bodyWeightKg);
  const hasValidWeight = Number.isFinite(weightKg) && weightKg >= 25 && weightKg <= 250;
  const caloriesPerStep = hasValidWeight ? weightKg * 0.00057 : null;
  const caloriesBurned = caloriesPerStep === null ? null : tracking.steps * caloriesPerStep;
  const estimatedRouteCalories = caloriesPerStep === null ? null : estimatedTotalRouteSteps * caloriesPerStep;
  const estimatedRemainingSteps = activeRoute ? Math.max(0, estimatedTotalRouteSteps - tracking.steps) : 0;
  const estimatedNavigationProgress = activeRoute
    ? Math.min(100, Math.round((detectedDistanceMeters / Math.max(routeDistanceMeters, 1)) * 100))
    : 0;
  const destinationName = nodes.find(node => node.id === destNodeId)?.name || 'Destination';

  const requestMotionPermission = async () => {
    if (typeof window === 'undefined') return false;
    if (!('DeviceMotionEvent' in window)) return false;

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        return (await DeviceMotionEvent.requestPermission()) === 'granted';
      } catch (error) {
        return false;
      }
    }

    return true;
  };

  const handleStartNavigation = async () => {
    if (!activeRoute) return;
    const permissionGranted = await requestMotionPermission();
    setTracking({
      active: true,
      paused: false,
      completed: false,
      steps: 0,
      elapsedMs: 0,
      startedAt: Date.now(),
      stepLengthMeters: estimatedStepLength,
      sensorAvailable: permissionGranted || ('DeviceMotionEvent' in window),
      sensorStatus: permissionGranted
        ? 'Motion sensor step detection is active.'
        : ('DeviceMotionEvent' in window
          ? 'Motion permission is unavailable. Navigation remains available, but step tracking is disabled on this device.'
          : 'This device does not support motion sensors. Navigation remains available, but no step detection is possible.')
    });
    motionStateRef.current = { lastMagnitude: 0, lastStepTime: 0 };
  };

  const handlePauseNavigation = () => {
    setTracking(prev => {
      if (!prev.active || prev.paused || prev.completed) return prev;
      return {
        ...prev,
        paused: true,
        elapsedMs: prev.elapsedMs + (Date.now() - (prev.startedAt || Date.now())),
        startedAt: null,
        sensorStatus: 'Tracking paused.'
      };
    });
  };

  const handleResumeNavigation = () => {
    setTracking(prev => {
      if (!prev.active || !prev.paused || prev.completed) return prev;
      return {
        ...prev,
        paused: false,
        startedAt: Date.now(),
        sensorStatus: prev.sensorAvailable ? 'Motion sensor tracking resumed.' : 'Tracking resumed without motion detection.'
      };
    });
  };

  const handleStopNavigation = () => {
    setTracking(prev => ({
      ...prev,
      active: false,
      paused: false,
      completed: false,
      startedAt: null,
      sensorStatus: 'Tracking stopped. Final statistics are preserved.'
    }));
  };

  const handleRestartNavigation = async () => {
    await handleStartNavigation();
  };

  useEffect(() => {
    if (!tracking.active || tracking.paused || tracking.completed) return undefined;

    const tick = setInterval(() => {
      setTracking(prev => {
        if (!prev.active || prev.paused || prev.completed || !prev.startedAt) return prev;
        return {
          ...prev,
          elapsedMs: prev.elapsedMs + (Date.now() - prev.startedAt),
          startedAt: Date.now(),
          durationSeconds: Math.floor((prev.elapsedMs + (Date.now() - prev.startedAt)) / 1000)
        };
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [tracking.active, tracking.paused, tracking.completed]);

  useEffect(() => {
    if (!tracking.active || tracking.paused || tracking.completed || !tracking.sensorAvailable || typeof window === 'undefined') {
      return undefined;
    }

    const onMotion = (event) => {
      const acceleration = event?.accelerationIncludingGravity;
      if (!acceleration) return;

      const x = Number(acceleration.x) || 0;
      const y = Number(acceleration.y) || 0;
      const z = Number(acceleration.z) || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const previousMagnitude = motionStateRef.current.lastMagnitude || 0;
      const smoothedMagnitude = previousMagnitude === 0 ? magnitude : (previousMagnitude * 0.7 + magnitude * 0.3);
      const delta = smoothedMagnitude - previousMagnitude;
      const now = Date.now();

      if (delta > 4 && smoothedMagnitude > 12 && now - motionStateRef.current.lastStepTime > 300) {
        motionStateRef.current.lastStepTime = now;
        setTracking(prev => ({
          ...prev,
          steps: prev.steps + 1,
          sensorStatus: 'A step was detected successfully.'
        }));
      }

      motionStateRef.current.lastMagnitude = smoothedMagnitude;
    };

    window.addEventListener('devicemotion', onMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [tracking.active, tracking.paused, tracking.completed, tracking.sensorAvailable]);

  useEffect(() => {
    if (!activeRoute || !tracking.active || tracking.paused || tracking.completed) return;

    if (estimatedRemainingSteps <= 0) {
      setTracking(prev => ({
        ...prev,
        active: false,
        paused: false,
        completed: true,
        sensorStatus: 'Navigation completed. Destination reached.'
      }));
    }
  }, [activeRoute, tracking.active, tracking.paused, tracking.completed, estimatedRemainingSteps]);

  useEffect(() => {
    if (!activeRoute && tracking.active) {
      setTracking(prev => ({
        ...prev,
        active: false,
        paused: false,
        completed: false,
        startedAt: null,
        sensorStatus: 'No active route is available for location tracking.'
      }));
    }
  }, [activeRoute, tracking.active]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 flex flex-col space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Indoor Route Finder</h2>
            <p className="text-[11px] text-slate-500">Shortest path with Dijkstra's algorithm</p>
          </div>
        </div>

        {/* Paper Demo Shortcut */}
        <button
          onClick={onRunPaperDemo}
          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center space-x-1"
          title="Load Section IV.D example: Entrance to CS Lab 2"
        >
          <Sparkles className="w-3 h-3 text-indigo-600" />
          <span>Paper Demo</span>
        </button>
      </div>

      {/* Inputs Form */}
      <div className="space-y-3 relative">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Route algorithm</label>
          <select
            value={routeAlgorithm}
            onChange={(event) => setRouteAlgorithm?.(event.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
          >
            <option value="dijkstra">Dijkstra · shortest weighted route</option>
            <option value="astar">A* · heuristic-assisted route</option>
          </select>
        </div>
        
        {/* Start Point */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="flex items-center space-x-1 text-[11px] font-semibold text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Starting Location (s)</span>
            </label>
            <button type="button" onClick={() => setShowQrScanner(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">
              <QrCode className="h-3 w-3" /> Scan location QR
            </button>
          </div>
          <select
            value={startNodeId || ''}
            onChange={(e) => setStartNodeId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select current location...</option>
            {nodes.map(n => {
              const unavailable = n.is_available === false || n.is_available === 0 ||
                n.is_available === '0' || n.availability_status === 'unavailable';
              return (
                <option key={n.id} value={n.id} disabled={unavailable}>
                  {n.name} ({n.code || n.type}){unavailable ? ' · unavailable' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!startNodeId && !destNodeId}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-50 border border-slate-200 text-slate-600 hover:text-sky-600 transition-colors shadow-sm disabled:opacity-40"
            title="Swap Start & Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Point */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="flex items-center space-x-1 text-[11px] font-semibold text-slate-600">
              <Flag className="w-3.5 h-3.5 text-rose-600" />
              <span>Destination Room / Facility (t)</span>
            </label>
            <button type="button" onClick={startVoiceDestinationSearch} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-sky-50">
              <Mic className="h-3 w-3" /> Voice search
            </button>
          </div>
          <select
            value={destNodeId || ''}
            onChange={(e) => setDestNodeId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select target destination...</option>
            {nodes.map(n => {
              const unavailable = n.is_available === false || n.is_available === 0 ||
                n.is_available === '0' || n.availability_status === 'unavailable';
              return (
                <option key={n.id} value={n.id} disabled={unavailable}>
                  {n.name} ({n.code || n.type}){unavailable ? ' · unavailable' : ''}
                </option>
              );
            })}
          </select>
          {voiceMessage && <p role="status" className="mt-1 text-[10px] text-slate-500">{voiceMessage}</p>}
        </div>

        {/* Accessibility Toggle Card (Algorithm 1) */}
        <div className={`p-3 rounded-xl border transition-all ${
          accessibleMode
            ? 'bg-amber-50/80 border-amber-300 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Accessibility className={`w-4 h-4 ${accessibleMode ? 'text-amber-600' : 'text-slate-500'}`} />
              <div>
                <p className="text-xs font-bold leading-tight">Accessibility Mode</p>
                <p className="text-[10px] text-slate-500">Algorithm 1: Large penalty M on stairs</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accessibleMode}
                onChange={(e) => setAccessibleMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            onClick={() => onCalculateRoute(accessibleMode)}
            disabled={!startNodeId || !destNodeId || isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Computing Shortest Path…' : 'Find Shortest Route'}</span>
          </button>

          {activeRoute && (
            <button
              onClick={onClearRoute}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Clear Route"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* ACTIVE ROUTE RESULTS & TURN-BY-TURN GUIDANCE */}
      {activeRoute && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
              <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">Walking Distance</span>
              <p className="text-lg font-extrabold text-sky-950 mt-0.5">
                {activeRoute.totalCost} <span className="text-xs font-normal text-sky-700">meters</span>
              </p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                    Next instruction · {currentInstructionIndex + 1}/{activeRoute.instructions?.length || 0}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    {activeRoute.instructions?.[currentInstructionIndex]?.text || 'Route guidance unavailable.'}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Remaining: {remainingDistance} m · ~{remainingTimeSeconds} sec
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceEnabled(value => !value)}
                  className="shrink-0 rounded-lg border border-sky-200 bg-white p-2 text-sky-700 hover:bg-sky-100"
                  aria-label={voiceEnabled ? 'Mute voice navigation' : 'Enable voice navigation'}
                  title={voiceEnabled ? 'Mute voice navigation' : 'Enable voice navigation'}
                >
                  {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  disabled={currentInstructionIndex === 0}
                  onClick={() => setCurrentInstructionIndex(index => Math.max(0, index - 1))}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3 w-3" /> Previous
                </button>
                <button
                  type="button"
                  disabled={currentInstructionIndex >= (activeRoute.instructions?.length || 1) - 1}
                  onClick={() => setCurrentInstructionIndex(index => Math.min((activeRoute.instructions?.length || 1) - 1, index + 1))}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-sky-700 hover:bg-white disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Estimated Time</span>
              <p className="text-lg font-extrabold text-indigo-950 mt-0.5">
                ~{activeRoute.walkingTimeSeconds} <span className="text-xs font-normal text-indigo-700">sec</span>
              </p>
            </div>
          </div>

          {/* Route Characteristics Badges */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {activeRoute.isAccessible ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Step-Free / Accessible</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Uses Staircase (Stairs B)</span>
              </span>
            )}

            {activeRoute.usesLift && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                <Accessibility className="w-3.5 h-3.5 text-amber-600" />
                <span>Uses Elevator (Lift 2)</span>
              </span>
            )}
          </div>

          {/* Side-by-Side Comparison from Section IV.D if stairs used */}
          {accessibleAlternative && (
            <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1">
                  <Accessibility className="w-3.5 h-3.5 text-amber-700" />
                  <span>Accessible Alternative Available</span>
                </span>
                <span className="text-amber-800 text-[11px] font-semibold">
                  Cost: {accessibleAlternative.totalCost}m
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Standard quickest route uses <strong>Stairs B (Cost: {activeRoute.totalCost}m)</strong>. 
                Step-free route via <strong>Lift 2 is {accessibleAlternative.totalCost}m</strong> (+{accessibleAlternative.totalCost - activeRoute.totalCost}m), fully usable without stairs.
              </p>
              <button
                onClick={() => {
                  setAccessibleMode(true);
                  onCalculateRoute(true);
                }}
                className="w-full mt-1 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition-colors"
              >
                Switch to Accessible Route via Lift 2
              </button>
            </div>
          )}

          {/* Turn-by-Turn Guidance Steps */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1">
              <Footprints className="w-3.5 h-3.5 text-sky-600" />
              <span>Turn-by-Turn Navigation Steps</span>
            </h3>
            
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {activeRoute.instructions?.map((step, idx) => (
                <div 
                  key={idx}
                  className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50 hover:bg-sky-50/60 border border-slate-200/70 text-xs transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 leading-snug">{step.text}</p>
                    {step.floor && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Floor: {step.floor.replace('floor-', '').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeRoute && (
        <div className="pt-3 border-t border-slate-100">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Indoor Walking Tracker</h3>
                <p className="text-[11px] text-emerald-700">Motion sensor step detections.</p>
              </div>
              <button
                type="button"
                onClick={handleStartNavigation}
                disabled={!activeRoute}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Start Navigation</span>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span>Steps</span>
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-lg font-extrabold text-slate-900">{tracking.steps}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span>Remaining Steps</span>
                  <Gauge className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-lg font-extrabold text-slate-900">{estimatedRemainingSteps}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span>Distance Estimate</span>
                  <Footprints className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-lg font-extrabold text-slate-900">{detectedDistanceMeters.toFixed(1)} <span className="text-[10px] text-slate-500">m</span></p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span>Calories burned (est.)</span>
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-lg font-extrabold text-slate-900">
                  {caloriesBurned === null ? '—' : caloriesBurned.toFixed(1)} <span className="text-[10px] text-slate-500">kcal</span>
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white p-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span>Active Tracking</span>
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-lg font-extrabold text-slate-900">{Math.floor((tracking.elapsedMs || 0) / 1000)} <span className="text-[10px] text-slate-500">s</span></p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-emerald-200 bg-white/80 p-2.5 text-[11px] text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">Estimated route steps</span>
                <span className="font-bold text-emerald-700">{estimatedTotalRouteSteps}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">Step length</span>
                <input
                  type="number"
                  min="0.3"
                  max="1.5"
                  step="0.01"
                  value={tracking.stepLengthMeters}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    setTracking(prev => ({
                      ...prev,
                      stepLengthMeters: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0.72
                    }));
                  }}
                  className="w-20 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-right text-[11px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <label htmlFor="walking-weight" className="font-semibold text-slate-700">Weight for calorie estimate</label>
                <div className="flex items-center gap-1">
                  <input
                    id="walking-weight"
                    type="number"
                    min="25"
                    max="250"
                    step="1"
                    value={bodyWeightKg}
                    onChange={(event) => setBodyWeightKg(event.target.value)}
                    className="w-20 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-right text-[11px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-500">kg</span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">Estimated route calories</span>
                <span className="font-bold text-emerald-700">
                  {estimatedRouteCalories === null ? 'Enter 25–250 kg' : `${estimatedRouteCalories.toFixed(1)} kcal`}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">Progress</span>
                <span className="font-bold text-emerald-700">{estimatedNavigationProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, estimatedNavigationProgress)}%` }}
                ></div>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {tracking.sensorStatus} Calorie values are approximate estimates based on steps and weight.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartNavigation}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!activeRoute}
              >
                <Play className="h-3 w-3" />
                Start
              </button>
              <button
                type="button"
                onClick={handlePauseNavigation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!tracking.active || tracking.paused || tracking.completed}
              >
                <Pause className="h-3 w-3" />
                Pause
              </button>
              <button
                type="button"
                onClick={handleResumeNavigation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!tracking.active || !tracking.paused || tracking.completed}
              >
                <Play className="h-3 w-3" />
                Resume
              </button>
              <button
                type="button"
                onClick={handleStopNavigation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!tracking.active && !tracking.steps}
              >
                <Square className="h-3 w-3" />
                Stop
              </button>
              <button
                type="button"
                onClick={handleRestartNavigation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!activeRoute}
              >
                <RotateCcw className="h-3 w-3" />
                Restart
              </button>
            </div>

            {tracking.completed && (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-100 p-2.5 text-[11px] text-emerald-900">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">Navigation Completed</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="mt-1">Destination: {destinationName}</p>
                <p className="mt-1">Total steps: {tracking.steps}</p>
                <p className="mt-1">Estimated walking distance: {detectedDistanceMeters.toFixed(1)} m</p>
                <p className="mt-1">Total navigation duration: {Math.floor((tracking.elapsedMs || 0) / 1000)} s</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showQrScanner && (
        <QrLocationScanner
          nodes={nodes}
          onLocationSelected={setStartNodeId}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  );
}
