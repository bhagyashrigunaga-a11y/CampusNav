import React from 'react';
import { 
  Navigation, 
  Accessibility, 
  Sparkles,
  Calendar,
  Flame,
  LockKeyhole,
  LogOut
} from 'lucide-react';

export default function Navbar({ 
  accessibleMode, 
  setAccessibleMode, 
  onRunDemo,
  onOpenEvacuation,
  onOpenTimetable,
  onOpenAdmin,
  isAdminAuthenticated,
  onAdminLogout
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & University Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Navigation className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">CampusNav</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Smart Indoor GPS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                School of Computer Science & Engineering • RV University
              </p>
            </div>
          </div>

          {/* Center Action Shortcuts */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Find My Class Button */}
            <button
              onClick={onOpenTimetable}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition-colors shadow-sm"
              title="View today's lecture schedule and navigate to class"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Find My Class</span>
            </button>

            {/* Quick Demo Button */}
            <button
              onClick={onRunDemo}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80 transition-colors shadow-sm"
              title="Runs Dijkstra example from project report (Entrance -> CS Lab 2)"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Quick Route Demo (CS Lab 2)</span>
            </button>
          </div>

          {/* Right Controls: Evacuation, Accessibility & Admin */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Emergency Evacuation Button */}
            <button
              onClick={onOpenEvacuation}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors shadow-sm"
              title="Instant fire safety evacuation route to ground safety assembly"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Emergency Exit</span>
            </button>

            {/* Accessibility Mode Switch (Algorithm 1) */}
            <button
              onClick={() => setAccessibleMode(!accessibleMode)}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                accessibleMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/25 ring-2 ring-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
              title="Algorithm 1: Assigns large penalty M to stairs; prefers lifts and ramps"
            >
              <Accessibility className={`w-4 h-4 ${accessibleMode ? 'text-white' : 'text-slate-600'}`} />
              <span className="hidden sm:inline">
                {accessibleMode ? 'Accessible: ON' : '♿ Step-Free Mode'}
              </span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
              title={isAdminAuthenticated ? 'Open the administrator dashboard' : 'Sign in to manage campus records'}
            >
              <LockKeyhole className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdminAuthenticated ? 'Admin Portal' : 'Admin Login'}</span>
            </button>
            {isAdminAuthenticated && (
              <button
                onClick={onAdminLogout}
                className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Sign out of the administrator account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
