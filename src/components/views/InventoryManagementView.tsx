import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { InventoryItem } from '../../types';

export const InventoryManagementView: React.FC = () => {
  const {
    inventory,
    stockMovements,
    addInventoryItem,
    updateInventoryItem,
    adjustStock,
    refreshData,
    currentUser,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'IN'>('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  // Add Item form state
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Mechanical');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newUnitPrice, setNewUnitPrice] = useState(500);
  const [newStandardCost, setNewStandardCost] = useState(350);
  const [newAvailableQty, setNewAvailableQty] = useState(10);
  const [newReorderLevel, setNewReorderLevel] = useState(5);
  const [newBinLocation, setNewBinLocation] = useState('A-01-1');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Adjust stock form state
  const [adjustMode, setAdjustMode] = useState<'adjust' | 'set'>('adjust');
  const [adjustDelta, setAdjustDelta] = useState<number | string>(0);
  const [adjustNewQty, setAdjustNewQty] = useState<number | string>(0);
  const [adjustReason, setAdjustReason] = useState('Physical cycle count adjustment');
  const [customReason, setCustomReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Edit item form state
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState(0);
  const [editStandardCost, setEditStandardCost] = useState(0);
  const [editReorderLevel, setEditReorderLevel] = useState(0);
  const [editBinLocation, setEditBinLocation] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const canManage = currentUser?.role === 'OPERATIONS' || currentUser?.role === 'ADMIN';

  // Categories list
  const categories = Array.from(new Set(inventory.map((i) => i?.category).filter(Boolean)));

  // Filtered inventory list
  const filteredInventory = inventory.filter((item) => {
    if (!item || typeof item !== 'object') return false;

    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

    if (activeStatusFilter === 'ACTIVE' && item.isActive === false) return false;
    if (activeStatusFilter === 'INACTIVE' && item.isActive !== false) return false;

    const availableQty = typeof item.availableQty === 'number' && !isNaN(item.availableQty) ? item.availableQty : 0;
    const reorderLevel = typeof item.reorderLevel === 'number' && !isNaN(item.reorderLevel) ? item.reorderLevel : 0;

    if (stockStatusFilter === 'LOW' && availableQty > reorderLevel) return false;
    if (stockStatusFilter === 'OUT' && availableQty > 0) return false;
    if (stockStatusFilter === 'IN' && availableQty <= reorderLevel) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (item.partNumber || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.binLocation || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleOpenAddModal = () => {
    setNewPartNumber(`SKU-${Date.now().toString().slice(-4)}`);
    setNewDescription('');
    setNewCategory(categories[0] || 'Mechanical');
    setNewUnit('pcs');
    setNewUnitPrice(500);
    setNewStandardCost(350);
    setNewAvailableQty(10);
    setNewReorderLevel(5);
    setNewBinLocation('B-02-1');
    setNewIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartNumber || !newDescription) return;
    setIsSubmittingAdd(true);
    try {
      const ok = await addInventoryItem({
        partNumber: newPartNumber.trim().toUpperCase(),
        description: newDescription.trim(),
        category: newCategory,
        unit: newUnit,
        unitPrice: Number(newUnitPrice) || 0,
        standardCost: Number(newStandardCost) || 0,
        availableQty: Number(newAvailableQty) || 0,
        reorderLevel: Number(newReorderLevel) || 0,
        binLocation: newBinLocation.trim(),
        isActive: newIsActive,
      });
      if (ok) {
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditDescription(item.description);
    setEditCategory(item.category);
    setEditUnitPrice(item.unitPrice);
    setEditStandardCost(item.standardCost || Math.round(item.unitPrice * 0.7));
    setEditReorderLevel(item.reorderLevel);
    setEditBinLocation(item.binLocation);
    setEditIsActive(item.isActive !== false);
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmittingEdit(true);
    try {
      const ok = await updateInventoryItem(editingItem.id, {
        description: editDescription.trim(),
        category: editCategory,
        unitPrice: Number(editUnitPrice) || 0,
        standardCost: Number(editStandardCost) || 0,
        reorderLevel: Number(editReorderLevel) || 0,
        binLocation: editBinLocation.trim(),
        isActive: editIsActive,
      });
      if (ok) {
        setEditingItem(null);
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustMode('adjust');
    setAdjustDelta(0);
    setAdjustNewQty(item.availableQty);
    setAdjustReason('Physical cycle count adjustment');
    setCustomReason('');
    setAdjustError(null);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    setAdjustError(null);

    const finalReason =
      adjustReason === 'Other' ? customReason.trim() : adjustReason.trim();

    if (!finalReason) {
      setAdjustError('A mandatory reason is required for every inventory stock adjustment.');
      return;
    }

    const prevQty = typeof adjustingItem.availableQty === 'number' && !isNaN(adjustingItem.availableQty) ? adjustingItem.availableQty : 0;
    let targetQty: number;
    let delta: number;

    if (adjustMode === 'adjust') {
      const deltaNum = typeof adjustDelta === 'string' ? parseFloat(adjustDelta) : adjustDelta;
      if (isNaN(deltaNum) || !Number.isFinite(deltaNum)) {
        setAdjustError('Please enter a valid numeric adjustment amount.');
        return;
      }
      delta = Math.round(deltaNum);
      targetQty = prevQty + delta;
    } else {
      const qtyNum = typeof adjustNewQty === 'string' ? parseFloat(adjustNewQty) : adjustNewQty;
      if (isNaN(qtyNum) || !Number.isFinite(qtyNum)) {
        setAdjustError('Please enter a valid numeric quantity.');
        return;
      }
      targetQty = Math.round(qtyNum);
      delta = targetQty - prevQty;
    }

    if (targetQty < 0) {
      setAdjustError(
        `Quantity cannot produce a negative stock level. Target would be ${targetQty} ${adjustingItem.unit || 'pcs'}.`
      );
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const ok = await adjustStock(adjustingItem.id, targetQty, finalReason, delta);
      if (ok) {
        setAdjustingItem(null);
        setAdjustError(null);
      } else {
        setAdjustError('The stock adjustment request was rejected by the server.');
      }
    } catch (err: any) {
      setAdjustError(err.message || 'An unexpected error occurred while updating inventory stock.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleToggleActive = async (item: InventoryItem) => {
    const nextStatus = !(item.isActive !== false);
    await updateInventoryItem(item.id, { isActive: nextStatus });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Warehouse Inventory & Parts Master Control
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {inventory.length} SKUs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain stock quantities, update reorder thresholds, record physical adjustments, and audit parts movements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canManage && (
            <button
              id="btn-add-inventory-item"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Inventory Part</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalog & Stock
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movement History ({stockMovements.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search SKU, description, bin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="LOW">Low Stock (≤ Threshold)</option>
                  <option value="OUT">Out of Stock (0)</option>
                  <option value="IN">In Stock</option>
                </select>

                <select
                  value={activeStatusFilter}
                  onChange={(e) => setActiveStatusFilter(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Part #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Bin</th>
                    <th className="p-3 text-right">Master Price</th>
                    <th className="p-3 text-right">Std Cost</th>
                    <th className="p-3 text-center">Available Stock</th>
                    <th className="p-3 text-center">Reorder Threshold</th>
                    <th className="p-3 text-center">Status</th>
                    {canManage && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => {
                    const isLow = item.availableQty <= item.reorderLevel;
                    const isOut = item.availableQty === 0;
                    const isActive = item.isActive !== false;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !isActive ? 'opacity-50 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {item.partNumber}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {item.description}
                        </td>
                        <td className="p-3 text-slate-500">{item.category}</td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">
                          {item.binLocation}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹{item.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          ₹{(item.standardCost || Math.round(item.unitPrice * 0.7)).toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span
                            className={`font-bold ${
                              isOut
                                ? 'text-rose-700'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-slate-800'
                            }`}
                          >
                            {item.availableQty} {item.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 text-[11px]">
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td className="p-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Optimal
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenAdjustModal(item)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                                  isActive
                                    ? 'text-slate-400 hover:text-rose-600'
                                    : 'text-emerald-700 hover:underline'
                                }`}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Stock Movement & Adjustments Audit Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological history of physical counts, write-offs, and Job Card issuances.
              </p>
            </div>
          </div>

          {stockMovements.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No stock movements recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjust stock quantities to record audit movements.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Part #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Previous Qty</th>
                    <th className="p-3 text-center">Adjustment</th>
                    <th className="p-3 text-center">New Qty</th>
                    <th className="p-3">Reason / Justification</th>
                    <th className="p-3 text-right">Authorized User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements.map((mov) => {
                    const isPositive = mov.difference >= 0;
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(mov.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {mov.partNumber}
                        </td>
                        <td className="p-3 text-slate-700">{mov.partDescription}</td>
                        <td className="p-3 text-center font-mono text-slate-500">
                          {mov.previousQty}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isPositive ? `+${mov.difference}` : mov.difference}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">
                          {mov.newQty}
                        </td>
                        <td className="p-3 text-slate-700">{mov.reason}</td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-slate-900">{mov.userName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{mov.userRole}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add New Inventory Part Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Inventory SKU</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register a new replacement component into standard warehouse stock.
              </p>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Part Number (SKU)</label>
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    placeholder="e.g. FLT-AIR-900"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Filtration, Electrical..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Part Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Heavy Duty Micro-Particle Air Filter Cartridge"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Master Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newStandardCost}
                    onChange={(e) => setNewStandardCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="pcs, ltr, m"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={newAvailableQty}
                    onChange={(e) => setNewAvailableQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={newReorderLevel}
                    onChange={(e) => setNewReorderLevel(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bin Location</label>
                  <input
                    type="text"
                    value={newBinLocation}
                    onChange={(e) => setNewBinLocation(e.target.value)}
                    placeholder="e.g. C-04-2"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-new-active"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="chk-new-active" className="text-slate-700 cursor-pointer font-medium">
                  Active SKU (Available for Field Engineer selection)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Add SKU to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inventory Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Part: {editingItem.partNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update master pricing, reorder thresholds, or active status.
              </p>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bin Location</label>
                  <input
                    type="text"
                    value={editBinLocation}
                    onChange={(e) => setEditBinLocation(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Master Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Standard Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editStandardCost}
                    onChange={(e) => setEditStandardCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={editReorderLevel}
                    onChange={(e) => setEditReorderLevel(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-amber-700"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-edit-active"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="chk-edit-active" className="text-slate-700 cursor-pointer font-medium">
                  Part is Active (Visible to Field Engineers in Job Card parts selector)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div id="modal-adjust-stock" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Stock Quantity</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold font-mono text-slate-700">{adjustingItem.partNumber}</span> — {adjustingItem.description}
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                Current: {adjustingItem.availableQty} {adjustingItem.unit}
              </span>
            </div>

            {/* Error Banner */}
            {adjustError && (
              <div id="adjust-stock-error" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{adjustError}</div>
              </div>
            )}

            {/* Mode Selector */}
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                id="btn-mode-adjust-delta"
                onClick={() => {
                  setAdjustMode('adjust');
                  setAdjustError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium text-center transition-all cursor-pointer ${
                  adjustMode === 'adjust'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock Adjustment (+ / -)
              </button>
              <button
                type="button"
                id="btn-mode-set-qty"
                onClick={() => {
                  setAdjustMode('set');
                  setAdjustError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-md font-medium text-center transition-all cursor-pointer ${
                  adjustMode === 'set'
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Set Exact Quantity
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4 text-xs">
              {/* Dynamic Calculation Summary */}
              {(() => {
                const prev = typeof adjustingItem.availableQty === 'number' ? adjustingItem.availableQty : 0;
                let calculatedDelta = 0;
                let calculatedNewQty = prev;

                if (adjustMode === 'adjust') {
                  const num = typeof adjustDelta === 'string' ? parseFloat(adjustDelta) : adjustDelta;
                  calculatedDelta = isNaN(num) ? 0 : Math.round(num);
                  calculatedNewQty = prev + calculatedDelta;
                } else {
                  const num = typeof adjustNewQty === 'string' ? parseFloat(adjustNewQty) : adjustNewQty;
                  calculatedNewQty = isNaN(num) ? 0 : Math.round(num);
                  calculatedDelta = calculatedNewQty - prev;
                }

                return (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-center">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Previous</span>
                      <span className="text-sm font-bold text-slate-800">{prev}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Adjustment</span>
                      <span
                        className={`text-sm font-bold ${
                          calculatedDelta > 0
                            ? 'text-emerald-700'
                            : calculatedDelta < 0
                            ? 'text-rose-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {calculatedDelta > 0 ? '+' : ''}
                        {calculatedDelta}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">New Quantity</span>
                      <span
                        className={`text-sm font-bold ${
                          calculatedNewQty < 0
                            ? 'text-rose-600 underline'
                            : 'text-blue-700'
                        }`}
                      >
                        {calculatedNewQty} {adjustingItem.unit}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Mode-specific Input */}
              {adjustMode === 'adjust' ? (
                <div>
                  <label htmlFor="input-adjust-delta" className="block font-semibold text-slate-700 mb-1">
                    Adjustment Delta (+ to add stock, - to deduct)
                  </label>
                  <input
                    id="input-adjust-delta"
                    type="number"
                    step="1"
                    value={adjustDelta}
                    onChange={(e) => {
                      setAdjustDelta(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                      setAdjustError(null);
                    }}
                    placeholder="e.g. +10 or -5"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formula: New Quantity = Previous Quantity ({adjustingItem.availableQty}) + Adjustment
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="input-adjust-new-qty" className="block font-semibold text-slate-700 mb-1">
                    New Exact Stock Count
                  </label>
                  <input
                    id="input-adjust-new-qty"
                    type="number"
                    min="0"
                    step="1"
                    value={adjustNewQty}
                    onChange={(e) => {
                      setAdjustNewQty(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                      setAdjustError(null);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    The previous quantity will be securely archived in the stock ledger.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="select-adjust-reason" className="block font-semibold text-slate-700 mb-1">
                  Reason for Adjustment <span className="text-rose-500">* (Required)</span>
                </label>
                <select
                  id="select-adjust-reason"
                  value={adjustReason}
                  onChange={(e) => {
                    setAdjustReason(e.target.value);
                    setAdjustError(null);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer mb-2 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Physical cycle count adjustment">Physical cycle count adjustment</option>
                  <option value="Supplier restock delivery received">Supplier restock delivery received</option>
                  <option value="Damaged / scrapped items write-off">Damaged / scrapped items write-off</option>
                  <option value="Returned to warehouse storage">Returned to warehouse storage</option>
                  <option value="Issued for Job Card">Issued for Job Card</option>
                  <option value="Other">Other (specify below)</option>
                </select>

                {adjustReason === 'Other' && (
                  <input
                    id="input-custom-reason"
                    type="text"
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setAdjustError(null);
                    }}
                    placeholder="Provide specific justification for audit history..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500">
                Authorized by: <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role}) • All adjustments are permanently recorded in the stock ledger.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-adjust"
                  onClick={() => {
                    setAdjustingItem(null);
                    setAdjustError(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-adjust"
                  disabled={isSubmittingAdjust}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmittingAdjust ? 'Recording...' : 'Save & Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
