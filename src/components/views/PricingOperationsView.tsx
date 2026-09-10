import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Sliders,
  FileText,
  ArrowRight,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { InventoryItem } from '../../types';

export const PricingOperationsView: React.FC = () => {
  const { inventory, jobCards, updateInventoryItem, openJobCard, setActiveTab } = useApp();
  const [search, setSearch] = useState('');
  const [activeTabSub, setActiveTabSub] = useState<'catalog' | 'variances'>('catalog');

  // Master total value
  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.unitPrice * item.availableQty,
    0
  );

  // Cards with pricing variances detected by AI review
  const cardsWithVariances = jobCards.filter((jc) =>
    jc.aiReview?.pricingVariances?.some((pv) => pv.flag !== 'normal')
  );

  const filteredInventory = inventory.filter(
    (item) =>
      item.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Commercial Pricing Governance & Margin Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard master price book, labor hourly rates, margin threshold enforcement, and variance monitoring.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTabSub('catalog')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTabSub === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Price Book Catalog
          </button>
          <button
            onClick={() => setActiveTabSub('variances')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTabSub === 'variances' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Variance Review ({cardsWithVariances.length})
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Warehouse Valuation</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalInventoryValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across {inventory.length} active SKUs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Flagged Price Variances</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
            {cardsWithVariances.length} Job Cards
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Deviations beyond ±5% standard reference</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Standard Labour Rate</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2 font-mono">
            ₹500 / hr
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Certified field technician billing baseline</div>
        </div>
      </div>

      {activeTabSub === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Standard Master Price Reference
            </h3>

            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Part #</th>
                    <th className="p-3 whitespace-nowrap">Description</th>
                    <th className="p-3 whitespace-nowrap">Category</th>
                    <th className="p-3 text-right whitespace-nowrap">Standard Cost</th>
                    <th className="p-3 text-right whitespace-nowrap">Master Selling Price</th>
                    <th className="p-3 text-right whitespace-nowrap">Target Margin</th>
                    <th className="p-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => {
                    const cost = item.standardCost || Math.round(item.unitPrice * 0.7);
                    const marginPct = item.unitPrice > 0 ? Math.round(((item.unitPrice - cost) / item.unitPrice) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">{item.partNumber}</td>
                        <td className="p-3 text-slate-800 whitespace-nowrap">{item.description}</td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">{item.category}</td>
                        <td className="p-3 text-right font-mono text-slate-500 whitespace-nowrap">₹{cost.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{item.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                          {marginPct}%
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Active Master
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTabSub === 'variances' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Field Job Card Pricing Variances
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Job cards where engineers applied line item parts prices different from standard catalog pricing.
            </p>
          </div>

          {cardsWithVariances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No commercial pricing variances detected</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All submitted Job Cards conform to the approved master price book.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {cardsWithVariances.map((jc) => (
                <div key={jc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{jc.id}</span>
                      <span className="text-xs font-medium text-slate-700">{jc.customerName}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {jc.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Assigned: <strong>{jc.assignedEngineerName}</strong> • Equipment: {jc.equipmentName}
                    </div>

                    {/* Variance pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {jc.aiReview?.pricingVariances?.filter((pv) => pv.flag !== 'normal').map((pv, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{pv.partNumber}: {pv.differencePct > 0 ? `+${pv.differencePct}%` : `${pv.differencePct}%`} (₹{pv.appliedPrice} vs ₹{pv.standardPrice})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => openJobCard(jc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  >
                    <span>Inspect Job Card</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
