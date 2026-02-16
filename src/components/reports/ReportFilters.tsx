"use client";

import { useState } from "react";

interface ReportFiltersProps {
  onFilter: (from: string, to: string) => void;
  initialFrom?: string;
  initialTo?: string;
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekAgoISO(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}

export default function ReportFilters({
  onFilter,
  initialFrom,
  initialTo,
}: ReportFiltersProps) {
  const [from, setFrom] = useState(initialFrom ?? getWeekAgoISO());
  const [to, setTo] = useState(initialTo ?? getTodayISO());

  function handleApply() {
    onFilter(from, to);
  }

  function setPreset(days: number) {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    setFrom(fromDate.toISOString().split("T")[0]);
    setTo(toDate.toISOString().split("T")[0]);
    onFilter(
      fromDate.toISOString().split("T")[0],
      toDate.toISOString().split("T")[0]
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      {/* From */}
      <div>
        <label
          htmlFor="filter-from"
          className="mb-1 block text-xs font-medium text-gray-600"
        >
          Desde
        </label>
        <input
          id="filter-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* To */}
      <div>
        <label
          htmlFor="filter-to"
          className="mb-1 block text-xs font-medium text-gray-600"
        >
          Hasta
        </label>
        <input
          id="filter-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Apply */}
      <button
        type="button"
        onClick={handleApply}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        Aplicar
      </button>

      {/* Quick presets */}
      <div className="flex gap-2 sm:ml-4">
        <button
          type="button"
          onClick={() => setPreset(0)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => setPreset(7)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          7 dias
        </button>
        <button
          type="button"
          onClick={() => setPreset(30)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          30 dias
        </button>
      </div>
    </div>
  );
}
