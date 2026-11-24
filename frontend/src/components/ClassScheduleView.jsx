import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function ClassScheduleView({
  nodes = [],
  onNavigateToRoom
}) {
  const [selectedSemester, setSelectedSemester] = useState('cse-5a');

  const timetables = {
    'cse-5a': {
      title: 'B.Tech CSE - 5th Semester (Section A)',
      department: 'School of Computer Science & Engineering (SoCSE)',
      today: 'Wednesday Schedule',
      classes: [
        {
          id: 'cls-1',
          time: '09:00 AM - 10:30 AM',
          subject: 'Analysis & Design of Algorithms (ADA)',
          code: 'CS501',
          professor: 'Dr. Ramesh Kumar',
          roomName: 'C Block - Computer Science Lab 201',
          nodeId: 'block-c-2-cslab',
          floor: 'C Block - 2nd Floor',
          status: 'ongoing',
          type: 'Practical Lab'
        },
        {
          id: 'cls-2',
          time: '10:45 AM - 12:15 PM',
          subject: 'Operating Systems & Cloud Architecture',
          code: 'CS502',
          professor: 'Prof. Ananya Sen',
          roomName: 'A Block - Classroom 101',
          nodeId: 'block-a-1-cr101',
          floor: 'A Block - 1st Floor',
          status: 'upcoming',
          type: 'Theory & Smart Class'
        },
        {
          id: 'cls-3',
          time: '01:15 PM - 02:45 PM',
          subject: 'Artificial Intelligence & Neural Networks',
          code: 'CS503',
          professor: 'Dr. Vikramaditya M',
          roomName: 'F Block - Advanced AI & Cloud Lab 302',
          nodeId: 'block-f-3-advlab',
          floor: 'F Block - 3rd Floor',
          status: 'upcoming',
          type: 'Advanced Workshop'
        },
        {
          id: 'cls-4',
          time: '03:00 PM - 04:30 PM',
          subject: 'Research & Literature Survey',
          code: 'CS504',
          professor: 'Faculty Mentor',
          roomName: 'Central University Library & Digital Hall',
          nodeId: 'out-node-library',
          floor: 'Library Building',
          status: 'upcoming',
          type: 'Research Study'
        }
      ]
    },
    'cse-3b': {
      title: 'B.Tech CSE - 3rd Semester (Section B)',
      department: 'School of Computer Science & Engineering (SoCSE)',
      today: 'Wednesday Schedule',
      classes: [
        {
          id: 'cls-201',
          time: '09:00 AM - 10:30 AM',
          subject: 'Data Structures & OOP in C++',
          code: 'CS301',
          professor: 'Prof. Sneha Patil',
          roomName: 'B Block - Computer Science Lab 201',
          nodeId: 'block-b-2-cslab',
          floor: 'B Block - 2nd Floor',
          status: 'ongoing',
          type: 'Programming Lab'
        },
        {
          id: 'cls-202',
          time: '11:00 AM - 12:30 PM',
          subject: 'Digital Electronics & Microprocessors',
          code: 'CS302',
          professor: 'Dr. Anand K',
          roomName: 'D Block - Advanced Laboratory 302',
          nodeId: 'block-d-3-advlab',
          floor: 'D Block - 3rd Floor',
          status: 'upcoming',
          type: 'Hardware Lab'
        },
        {
          id: 'cls-203',
          time: '02:00 PM - 04:00 PM',
          subject: 'Library Self-Study & Project Work',
          code: 'CS303',
          professor: 'Academic Mentor',
          roomName: 'Central University Library & Reading Hall',
          nodeId: 'out-node-library',
          floor: 'Library Building',
          status: 'upcoming',
          type: 'Self-Study'
        }
      ]
    }
  };

  const currentTimetable = timetables[selectedSemester] || timetables['cse-5a'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Timetable Integration
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Class Schedule & Lecture Navigator ("Find My Class")
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Example schedule data: replace it with an approved timetable feed for live classes. Room availability is shown only when reported by an administrator.
          </p>
        </div>

        {/* Semester Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Cohort / Section:</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="cse-5a">CSE 5th Sem - Section A</option>
            <option value="cse-3b">CSE 3rd Sem - Section B</option>
          </select>
        </div>
      </div>

      {/* Cohort Header Info */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">{currentTimetable.title}</h3>
          </div>
          <p className="text-xs text-indigo-200 mt-0.5">{currentTimetable.department} • {currentTimetable.today}</p>
        </div>
        <div className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md text-xs font-medium text-emerald-300 border border-white/10 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Sample schedule</span>
        </div>
      </div>

      {/* Class Schedule Cards Table */}
      <div className="space-y-3">
        {currentTimetable.classes.map((cls, idx) => {
          const isOngoing = cls.status === 'ongoing';
          const roomNode = nodes.find(node => node.id === cls.nodeId);
          const availability = roomNode?.availability_status || 'unknown';
          const availabilityLabels = {
            available: 'Available',
            occupied: 'Occupied',
            reserved: 'Reserved',
            unavailable: 'Unavailable',
            unknown: 'Status not reported'
          };
          return (
            <div
              key={cls.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isOngoing
                  ? 'bg-indigo-50/70 border-indigo-200 shadow-sm ring-1 ring-indigo-300'
                  : 'bg-slate-50/80 hover:bg-slate-100/70 border-slate-200'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isOngoing ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isOngoing ? 'Current / Next Lecture' : `Lecture ${idx + 1}`}
                  </span>
                  
                  <span className="text-xs font-mono font-bold text-slate-700 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cls.time}</span>
                  </span>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-100 font-semibold">
                    {cls.type}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                    availability === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    availability === 'occupied' || availability === 'unavailable' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    availability === 'reserved' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    Room: {availabilityLabels[availability] || availabilityLabels.unknown}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{cls.subject} ({cls.code})</h4>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Instructor: <strong className="text-slate-800">{cls.professor}</strong></span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>Location: <strong className="text-slate-900">{cls.roomName}</strong> ({cls.floor})</span>
                  </span>
                </div>
              </div>

              {/* Action Button: Navigate */}
              <button
                onClick={() => onNavigateToRoom(cls.nodeId)}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95 flex-shrink-0 ${
                  isOngoing
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                    : 'bg-sky-600 hover:bg-sky-500 text-white'
                }`}
              >
                <span>Navigate to Class</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
