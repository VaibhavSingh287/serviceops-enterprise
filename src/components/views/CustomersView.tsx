import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, MapPin, Phone, Mail, PlusCircle, Search, Cpu } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, equipment, jobCards, openJobCard, createNewJobCard } = useApp();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Accounts & Plant Sites</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage enterprise accounts, facility sites, and historical service records.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search customer name, industry, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((cust) => {
          const custEquipment = equipment.filter((eq) => eq.customerId === cust.id);
          const custJobCards = jobCards.filter((jc) => jc.customerId === cust.id);

          return (
            <div
              key={cust.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{cust.name}</h3>
                  <span className="text-xs font-semibold text-blue-700">{cust.industry}</span>
                </div>
                <button
                  onClick={() => createNewJobCard(cust.id)}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer"
                >
                  + New Job Card
                </button>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{cust.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{cust.contactPerson} ({cust.phone})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{cust.email}</span>
                </div>
              </div>

              {/* Registered Machinery */}
              <div>
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                  <span>Installed Machinery Assets ({custEquipment.length})</span>
                </div>
                <div className="space-y-1.5">
                  {custEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="text-xs p-2 bg-slate-50/80 rounded border border-slate-200/60 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{eq.name}</span>
                        <span className="text-slate-400 font-mono ml-2">S/N: {eq.serialNumber}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{eq.operatingHours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Job Cards */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {custJobCards.length} historical service records
                </span>
                {custJobCards.length > 0 && (
                  <button
                    onClick={() => openJobCard(custJobCards[0].id)}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    View Latest ({custJobCards[0].id}) →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
