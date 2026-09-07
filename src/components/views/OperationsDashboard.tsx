import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  FileText,
  Plus,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem } from '../../types';

export const OperationsDashboard: React.FC = () => {
  const {
    inventory,
    jobCards,
    stockMovements,
    auditLogs,
    setActiveTab,
    openJobCard,
    adjustStock,
    showToast,
  } = useApp();

  const [selectedAdjustItem, setSelectedAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustNewQty, setAdjustNewQty] = useState<number | string>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Physical cycle count adjustment');
  const [customReason, setCustomReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Metrics
  const lowStockItems = inventory.filter((item) => item.availableQty <= item.reorderLevel);
  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.unitPrice * item.availableQty,
    0
  );

  // Parts usage across all Job Cards
  const totalPartsUsedCount = jobCards.reduce((acc, jc) => {
    const cardParts = (jc.parts || []).reduce((pSum, p) => pSum + (p.quantity || 0), 0);
    return acc + cardParts;
  }, 0);

  // Total Job Card value
  const totalJobCardValue = jobCards.reduce((acc, jc) => acc + (jc.pricing?.total || 0), 0);

  // Pending Commercial Review
  const pendingCommercialReview = jobCards.filter(
    (jc) =>
      jc.aiReview?.pricingVariances?.some((v) => v.flag !== 'normal') ||
      jc.status === 'Pending Review' ||
      jc.status === 'Submitted'
  );

  // Recent operational activity
  const recentOpsLogs = auditLogs
    .filter(
      (log) =>
        log.eventType.includes('Stock') ||
        log.eventType.includes('Inventory') ||
        log.eventType.includes('Pricing') ||
        log.userRole === 'OPERATIONS'
    )
    .slice(0, 6);

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setSelectedAdjustItem(item);
    setAdjustNewQty(item.availableQty);
    setAdjustReason('Physical cycle count adjustment');
    setCustomReason('');
    setAdjustError(null);
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustItem) return;
    setAdjustError(null);

    const finalReason =
      adjustReason === 'Other / Manual adjustment' ? customReason.trim() : adjustReason.trim();

    if (!finalReason) {
      setAdjustError('A mandatory reason is required for stock adjustments.');
      return;
    }

    const qtyNum = typeof adjustNewQty === 'string' ? parseFloat(adjustNewQty) : adjustNewQty;
    if (isNaN(qtyNum) || !Number.isFinite(qtyNum)) {
      setAdjustError('Please enter a valid numeric quantity.');
      return;
    }
    const finalQty = Math.round(qtyNum);
    if (finalQty < 0) {
      setAdjustError('Stock quantity cannot be negative.');
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const ok = await adjustStock(selectedAdjustItem.id, finalQty, finalReason);
      if (ok) {
        setSelectedAdjustItem(null);
      } else {
        setAdjustError('The stock adjustment could not be processed.');
      }
    } catch (err: any) {
      setAdjustError(err.message || 'An error occurred while adjusting stock.');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Commercial & Warehouse Operations Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inventory thresholds, stock movement ledger, and commercial pricing governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Manage Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pricing Catalogue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock Alerts</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
            {lowStockItems.length} SKUs
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {lowStockItems.length > 0 ? 'Requires immediate warehouse restock' : 'All stock levels optimal'}
          </div>
        </div>

        {/* Parts Usage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Parts Installed</span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {totalPartsUsedCount} units
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across active field service orders</div>
        </div>

        {/* Pending Commercial Review */}
        <div
          onClick={() => setActiveTab('pricing')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Commercial Review</span>
            <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2 font-mono">
            {pendingCommercialReview.length} Cards
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Margin variance / review queue</div>
        </div>

        {/* Job Card Commercial Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Job Card Value</span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            ₹{totalJobCardValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Warehouse value: ₹{totalInventoryValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2-Column Split: Low Stock Alerts & Parts Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low Stock Alerts Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Low Stock Threshold Alerts ({lowStockItems.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full Inventory →
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1" />
              <p className="text-xs font-semibold text-slate-700">Inventory levels healthy</p>
              <p className="text-[11px] text-slate-400">All parts exceed required minimum reorder thresholds.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{item.partNumber}</span>
                      <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">
                        {item.description}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Bin: <span className="font-mono">{item.binLocation}</span> • Reorder Threshold:{' '}
                      <span className="font-mono font-bold text-amber-700">{item.reorderLevel}</span> {item.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-700">
                        {item.availableQty} {item.unit} left
                      </div>
                      <div className="text-[10px] text-slate-400">Master: ₹{item.unitPrice}</div>
                    </div>
                    <button
                      onClick={() => handleOpenAdjustModal(item)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Adjust
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parts Movement History Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Parts Movement ({stockMovements.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Full Ledger →
            </button>
          </div>

          {stockMovements.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Package className="w-7 h-7 mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No stock movements recorded yet</p>
              <p className="text-[11px] text-slate-400">
                Stock movements are recorded automatically when Operations adjusts quantities or issues parts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
              {stockMovements.slice(0, 5).map((mov) => {
                const isPositive = mov.difference >= 0;
                return (
                  <div key={mov.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{mov.partNumber}</span>
                        <span className="text-slate-700 truncate">{mov.partDescription}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Reason: <span className="text-slate-700 font-medium">"{mov.reason}"</span> • By {mov.userName}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono font-bold text-xs flex items-center justify-end gap-0.5 ${
                          isPositive ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        <span>{isPositive ? `+${mov.difference}` : mov.difference}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {mov.previousQty} → {mov.newQty}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Operational Activity Trail */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Operational Activity</h3>
          </div>
          <button
            onClick={() => setActiveTab('audit')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Full Audit Trail →
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {recentOpsLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No recent operational activity</div>
          ) : (
            recentOpsLogs.map((log) => (
              <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50/70">
                <div>
                  <span className="font-semibold text-slate-900">{log.eventType}</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[10px] text-slate-500">{log.userName}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      {selectedAdjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedAdjustItem.partNumber} - {selectedAdjustItem.description}
              </p>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{adjustError}</div>
              </div>
            )}

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Current Stock</span>
                  <span className="text-base font-bold text-slate-900">
                    {selectedAdjustItem.availableQty} {selectedAdjustItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Net Difference</span>
                  {(() => {
                    const parsed = typeof adjustNewQty === 'string' ? parseFloat(adjustNewQty) : adjustNewQty;
                    const diff = (isNaN(parsed) ? 0 : parsed) - selectedAdjustItem.availableQty;
                    return (
                      <span
                        className={`text-base font-bold ${
                          diff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {diff >= 0 ? '+' : ''}
                        {diff} {selectedAdjustItem.unit}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Available Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={adjustNewQty}
                  onChange={(e) => {
                    setAdjustNewQty(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                    setAdjustError(null);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Reason (Recorded in Audit)</label>
                <select
                  value={adjustReason}
                  onChange={(e) => {
                    setAdjustReason(e.target.value);
                    setAdjustError(null);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer mb-2"
                >
                  <option value="Physical cycle count adjustment">Physical cycle count adjustment</option>
                  <option value="Supplier restock delivery received">Supplier restock delivery received</option>
                  <option value="Damaged / scrapped items write-off">Damaged / scrapped items write-off</option>
                  <option value="Returned to warehouse storage">Returned to warehouse storage</option>
                  <option value="Issued for field emergency service">Issued for field emergency service</option>
                  <option value="Other / Manual adjustment">Other / Manual adjustment</option>
                </select>
                {adjustReason === 'Other / Manual adjustment' && (
                  <input
                    type="text"
                    value={customReason}
                    placeholder="Specify precise reason..."
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setAdjustError(null);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAdjustItem(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingAdjustment ? 'Adjusting...' : 'Save & Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
