import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Cpu, Calendar, Clock, Wrench, Search, PlusCircle } from 'lucide-react';

export const EquipmentView: React.FC = () => {
  const { equipment, jobCards, openJobCard, createNewJobCard } = useApp();
  const [search, setSearch] = useState('');

  const filtered = equipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.customerName.toLowerCase().includes(search.toLowerCase()) ||
      eq.model.toLowerCase().includes(search.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Industrial Machinery & Asset Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track asset operating hours, maintenance lifecycle, and serial number specifications.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search asset name, serial number, model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-3.5">Equipment Asset</th>
              <th className="p-3.5">Customer & Site</th>
              <th className="p-3.5">Model / Type</th>
              <th className="p-3.5">Serial Number</th>
              <th className="p-3.5 text-center">Operating Hours</th>
              <th className="p-3.5">Last Service</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((eq) => {
              const eqCards = jobCards.filter((jc) => jc.equipmentId === eq.id);
              return (
                <tr key={eq.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{eq.name}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{eq.customerName}</div>
                    <div className="text-[11px] text-slate-500">{eq.siteName}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{eq.model}</div>
                    <div className="text-[11px] text-slate-500">{eq.equipmentType}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600">{eq.serialNumber}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-blue-700">
                    {eq.operatingHours.toLocaleString()} hrs
                  </td>
                  <td className="p-3.5 text-slate-600">{eq.lastServiceDate}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        eq.status === 'Operational'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => createNewJobCard(eq.customerId, eq.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded text-xs transition-colors cursor-pointer"
                    >
                      + Service Job
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
