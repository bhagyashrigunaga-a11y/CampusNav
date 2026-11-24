import React, { useEffect, useState } from 'react';
import { ArrowRight, Search, UserRound } from 'lucide-react';
import { fetchFaculty } from '../services/api';

export default function FacultyFinder({ onNavigateToOffice }) {
  const [query, setQuery] = useState('');
  const [faculty, setFaculty] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await fetchFaculty(query.trim());
        if (active) setFaculty(results);
      } catch (requestError) {
        if (active) setError(requestError.message || 'Could not load faculty records.');
      } finally {
        if (active) setIsLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
      <header className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <UserRound className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Faculty & Staff Finder</h2>
            <p className="text-xs text-slate-500">Search administrator-maintained staff records and route to a linked office.</p>
          </div>
        </div>
      </header>

      <label className="relative block max-w-xl">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search name, department, designation, cabin, room, or floor"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {isLoading && <p role="status" className="text-sm text-slate-500">Searching campus records…</p>}
      {!isLoading && !error && faculty.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          No faculty records are available. An administrator must add verified staff and office information before it can be searched.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {faculty.map(person => (
          <article key={person.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
            <div className="min-w-0">
              <h3 className="truncate font-bold text-slate-900">{person.name}</h3>
              <p className="text-xs text-slate-600">{person.designation} · {person.department}</p>
              <p className="mt-1 text-xs text-slate-500">
                {[
                  person.cabin && `Cabin number: ${person.cabin}`,
                  person.room_no && `Room: ${person.room_no}`,
                  person.floor && `Floor: ${person.floor}`
                ].filter(Boolean).join(' · ') || 'Cabin and room details not provided'}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                Office: {person.office_name || 'Not linked to a campus location'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToOffice(person.office_node_id)}
              disabled={!person.office_node_id}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Route <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
