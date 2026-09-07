import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard, ChecklistItem, ChecklistItemStatus, JobCardPart, AttachmentItem } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Sparkles,
  Plus,
  Trash2,
  Camera,
  Upload,
  Info,
  ShieldCheck,
  Building2,
  Cpu,
  FileText,
  AlertCircle,
  HelpCircle,
  X,
  RefreshCw,
} from 'lucide-react';

export const JobCardEditor: React.FC<{ jobCardId: string }> = ({ jobCardId }) => {
  const {
    jobCards,
    saveJobCardDraft,
    submitJobCard,
    setActiveJobCardId,
    customers,
    equipment,
    inventory,
    showToast,
    currentUser,
    setDocumentJobCard,
  } = useApp();

  const originalCard = jobCards.find((jc) => jc.id === jobCardId);
  const [formData, setFormData] = useState<JobCard | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [activeIssueChecklistId, setActiveIssueChecklistId] = useState<string | null>(null);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState<boolean>(false);

  // Initialize form state
  useEffect(() => {
    if (originalCard) {
      setFormData(JSON.parse(JSON.stringify(originalCard)));
      setActiveStep(originalCard.currentStep || 1);
    }
  }, [originalCard?.id]);

  if (!formData) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
        Loading Job Card...
      </div>
    );
  }

  // Handle step completion tracking
  const markStepComplete = (stepNum: number) => {
    if (!formData.completedSteps.includes(stepNum)) {
      const updated = {
        ...formData,
        completedSteps: [...formData.completedSteps, stepNum],
        currentStep: Math.max(formData.currentStep, stepNum),
      };
      setFormData(updated);
      saveJobCardDraft(updated);
    }
  };

  const handleNextStep = () => {
    markStepComplete(activeStep);
    if (activeStep < 7) {
      setActiveStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleManualSave = () => {
    setIsSaving(true);
    saveJobCardDraft(formData);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Draft autosaved successfully', 'success');
    }, 400);
  };

  // Recalculate totals
  const recalculatePricing = (card: JobCard) => {
    const partsTotal = card.parts.reduce((sum, p) => sum + p.total, 0);
    const labourTotal = card.pricing.labourHours * card.pricing.labourRate;
    const subtotal = partsTotal + labourTotal + card.pricing.serviceCharges - card.pricing.discount;
    const tax = Math.round(subtotal * card.pricing.taxRate);
    const total = subtotal + tax;

    return {
      ...card.pricing,
      parts: partsTotal,
      labour: labourTotal,
      tax,
      total,
    };
  };

  // Checklist updates
  const handleChecklistStatusChange = (
    checkId: string,
    newStatus: ChecklistItemStatus
  ) => {
    const updatedChecklist = formData.checklist.map((item) => {
      if (item.id === checkId) {
        if (newStatus === 'Issue Found') {
          return {
            ...item,
            status: newStatus,
            issue: item.issue || {
              description: '',
              severity: 'Moderate',
              recommendation: '',
            },
          };
        }
        return {
          ...item,
          status: newStatus,
        };
      }
      return item;
    });

    const updated = { ...formData, checklist: updatedChecklist };
    setFormData(updated);
    saveJobCardDraft(updated);

    if (newStatus === 'Issue Found') {
      setActiveIssueChecklistId(checkId);
    }
  };

  const handleIssueDetailsUpdate = (checkId: string, field: string, value: any) => {
    const updatedChecklist = formData.checklist.map((item) => {
      if (item.id === checkId) {
        return {
          ...item,
          issue: {
            ...item.issue!,
            [field]: value,
          },
        };
      }
      return item;
    });
    const updated = { ...formData, checklist: updatedChecklist };
    setFormData(updated);
  };

  // Parts updates
  const handleAddPart = (invItem: any) => {
    const existingIndex = formData.parts.findIndex((p) => p.partNumber === invItem.partNumber);
    let newParts: JobCardPart[];

    if (existingIndex >= 0) {
      newParts = formData.parts.map((p, idx) => {
        if (idx === existingIndex) {
          const newQty = p.quantity + 1;
          return {
            ...p,
            quantity: newQty,
            total: newQty * p.unitPrice,
          };
        }
        return p;
      });
    } else {
      const newPart: JobCardPart = {
        id: `part-${Date.now()}`,
        partNumber: invItem.partNumber,
        description: invItem.description,
        category: invItem.category,
        quantity: 1,
        unitPrice: invItem.unitPrice,
        total: invItem.unitPrice,
        standardPrice: invItem.unitPrice,
        inStock: invItem.availableQty,
      };
      newParts = [...formData.parts, newPart];
    }

    const updated = { ...formData, parts: newParts };
    const withPricing = { ...updated, pricing: recalculatePricing(updated) };
    setFormData(withPricing);
    saveJobCardDraft(withPricing);
    showToast(`Added ${invItem.partNumber} to bill of materials`, 'info');
  };

  const handleRemovePart = (partNumber: string) => {
    const newParts = formData.parts.filter((p) => p.partNumber !== partNumber);
    const updated = { ...formData, parts: newParts };
    const withPricing = { ...updated, pricing: recalculatePricing(updated) };
    setFormData(withPricing);
    saveJobCardDraft(withPricing);
  };

  const handleUpdatePartQty = (partNumber: string, delta: number) => {
    const newParts = formData.parts
      .map((p) => {
        if (p.partNumber === partNumber) {
          const newQty = Math.max(1, p.quantity + delta);
          return { ...p, quantity: newQty, total: newQty * p.unitPrice };
        }
        return p;
      });

    const updated = { ...formData, parts: newParts };
    const withPricing = { ...updated, pricing: recalculatePricing(updated) };
    setFormData(withPricing);
    saveJobCardDraft(withPricing);
  };

  // AI Assist: Suggest Parts
  const handleAiSuggestParts = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: formData.equipmentName,
          problemReported: formData.problemReported,
          availableInventory: inventory,
        }),
      });
      const data = await res.json();
      setAiSuggestions(data);
      showToast('AI diagnostics matched relevant parts', 'info');
    } catch (e) {
      console.error(e);
      showToast('AI suggestions currently unavailable', 'warning');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Assist: Generate Service Summary
  const handleAiGenerateSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/service-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemReported: formData.problemReported,
          checklist: formData.checklist,
          parts: formData.parts,
          currentNotes: formData.engineerNotes,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        const updated = {
          ...formData,
          workPerformed: data.summary,
          recommendations: data.recommendations || formData.recommendations,
        };
        setFormData(updated);
        saveJobCardDraft(updated);
        showToast('AI service summary populated successfully', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to generate summary', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Assist: Pre-Submission Quality Check
  const handleAiQualityCheck = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/check-jobcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobCard: formData }),
      });
      const data = await res.json();
      const updated = {
        ...formData,
        aiReview: data,
      };
      setFormData(updated);
      saveJobCardDraft(updated);
      showToast('Pre-submission quality check complete', 'info');
    } catch (e) {
      console.error(e);
      showToast('Quality check unavailable', 'warning');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Attachments
  const handleSimulateAddAttachment = (category: string) => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
    ];
    const randomPhoto = mockPhotos[formData.attachments.length % mockPhotos.length];

    const newAtt: AttachmentItem = {
      id: `att-${Date.now()}`,
      category: category as any,
      name: `${category.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.jpg`,
      dataUrl: randomPhoto,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sizeKb: 320,
      type: 'image/jpeg',
    };

    const updated = { ...formData, attachments: [...formData.attachments, newAtt] };
    setFormData(updated);
    saveJobCardDraft(updated);
    showToast(`Attached evidence: ${newAtt.name}`, 'success');
  };

  const handleRemoveAttachment = (attId: string) => {
    const updated = {
      ...formData,
      attachments: formData.attachments.filter((a) => a.id !== attId),
    };
    setFormData(updated);
    saveJobCardDraft(updated);
  };

  // Final Submit
  const handleConfirmSubmit = () => {
    setSubmitConfirmOpen(false);
    const success = submitJobCard(formData.id);
    if (success) {
      setActiveJobCardId(null);
    }
  };

  // Steps definition
  const steps = [
    { num: 1, title: 'Customer & Equipment' },
    { num: 2, title: 'Service Details' },
    { num: 3, title: 'Inspection Checklist' },
    { num: 4, title: 'Parts & Materials' },
    { num: 5, title: 'Work Performed' },
    { num: 6, title: 'Attachments' },
    { num: 7, title: 'Review & Submit' },
  ];

  // Validation checks for step 7
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  if (!formData.customerName) validationErrors.push('Customer information is missing');
  if (!formData.equipmentName) validationErrors.push('Equipment information is missing');
  if (!formData.serviceType) validationErrors.push('Service type must be selected');
  if (!formData.workPerformed || formData.workPerformed.length < 15) {
    validationErrors.push('Work performed description is required (min 15 characters)');
  }
  const pendingChecks = formData.checklist.filter((c) => c.status === 'Pending');
  if (pendingChecks.length > 0) {
    validationErrors.push(`${pendingChecks.length} checklist items remain uninspected`);
  }
  const issuesFound = formData.checklist.filter((c) => c.status === 'Issue Found');
  if (issuesFound.length > 0 && formData.parts.length === 0) {
    validationWarnings.push('Inspection issues were recorded, but no replacement parts were added.');
  }
  if (formData.attachments.length === 0) {
    validationWarnings.push('No photo evidence or nameplate attachments have been uploaded.');
  }

  return (
    <div className="min-h-full pb-16 bg-slate-50/60">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveJobCardId(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-100 rounded text-xs font-medium text-slate-600 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Queue</span>
            </button>
            <div className="border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {formData.id}
                </span>
                <StatusBadge status={formData.status} size="sm" />
                <PriorityBadge priority={formData.priority} />
                <span className="text-xs text-slate-500 font-medium hidden lg:inline">
                  • Assigned: <strong>{formData.assignedEngineerName}</strong>
                </span>
                <span className="text-xs text-slate-400 font-mono hidden xl:inline">
                  • {formData.lastSavedAt}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                <span className="font-semibold text-slate-900">{formData.customerName}</span> — {formData.equipmentName} ({formData.serialNumber})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDocumentJobCard(formData)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Export</span>
            </button>
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            {activeStep === 7 ? (
              <button
                onClick={() => setSubmitConfirmOpen(true)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Changes Requested Banner (if applicable) */}
        {formData.status === 'Changes Requested' && (
          <div className="bg-amber-50 border-t border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong>Manager Requested Revisions: </strong>
                <span>"{formData.managerNotes || 'Please review highlighted checklist items and evidence.'}"</span>
                {formData.changesRequestedSections && (
                  <span className="ml-2 font-semibold">
                    (Sections: {formData.changesRequestedSections.join(', ')})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Bar */}
        <div className="border-t border-slate-200 bg-slate-50 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between min-w-[700px]">
            {steps.map((step) => {
              const isCurrent = activeStep === step.num;
              const isDone = formData.completedSteps.includes(step.num);

              return (
                <button
                  key={step.num}
                  onClick={() => {
                    markStepComplete(activeStep);
                    setActiveStep(step.num);
                  }}
                  className={`flex items-center gap-2 py-2.5 px-2 border-b-2 text-xs font-medium cursor-pointer transition-colors ${
                    isCurrent
                      ? 'border-blue-600 text-blue-700 font-semibold'
                      : isDone
                      ? 'border-transparent text-slate-700 hover:text-slate-900'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? '✓' : step.num}
                  </span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content Container */}
      <div className="max-w-4xl mx-auto p-6 mt-4">
        {/* STEP 1: CUSTOMER & EQUIPMENT */}
        {activeStep === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Step 1: Customer & Equipment Specification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select customer account and the specific machinery unit under service contract.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Customer Account *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c) {
                      const firstEq = equipment.find((eq) => eq.customerId === c.id) || equipment[0];
                      setFormData({
                        ...formData,
                        customerId: c.id,
                        customerName: c.name,
                        contactPerson: c.contactPerson,
                        contactPhone: c.phone,
                        siteLocation: c.sites[0]?.name || c.address,
                        equipmentId: firstEq.id,
                        equipmentName: firstEq.name,
                        equipmentType: firstEq.equipmentType,
                        model: firstEq.model,
                        serialNumber: firstEq.serialNumber,
                        operatingHours: firstEq.operatingHours,
                      });
                    }
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry})
                    </option>
                  ))}
                </select>
              </div>

              {/* Site Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Site / Facility Location</label>
                <input
                  type="text"
                  value={formData.siteLocation}
                  onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Customer Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Customer Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Equipment Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Equipment Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Select Registered Asset *</label>
                  <select
                    value={formData.equipmentId}
                    onChange={(e) => {
                      const eq = equipment.find((item) => item.id === e.target.value);
                      if (eq) {
                        setFormData({
                          ...formData,
                          equipmentId: eq.id,
                          equipmentName: eq.name,
                          equipmentType: eq.equipmentType,
                          model: eq.model,
                          serialNumber: eq.serialNumber,
                          operatingHours: eq.operatingHours,
                        });
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {equipment
                      .filter((eq) => eq.customerId === formData.customerId)
                      .map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} — {eq.model} (S/N: {eq.serialNumber})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    readOnly
                    className="w-full text-xs p-2.5 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Model Specification</label>
                  <input
                    type="text"
                    value={formData.model}
                    readOnly
                    className="w-full text-xs p-2.5 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Current Operating Hours</label>
                  <input
                    type="number"
                    value={formData.operatingHours}
                    onChange={(e) =>
                      setFormData({ ...formData, operatingHours: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICE DETAILS */}
        {activeStep === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Step 2: Service Classification & Work Order Scope
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the urgency, schedule, and symptom reported by the customer desk.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Service Classification *</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Preventive Maintenance">Preventive Maintenance (PM)</option>
                  <option value="Breakdown Repair">Breakdown Repair</option>
                  <option value="Installation">Installation & Commissioning</option>
                  <option value="Calibration & Testing">Calibration & Testing</option>
                  <option value="Emergency Service">Emergency Critical Callout</option>
                  <option value="Inspection & Audit">Inspection & Energy Audit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Priority Level *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white font-semibold"
                >
                  <option value="Low">Low — Standard Service</option>
                  <option value="Medium">Medium — Scheduled Maintenance</option>
                  <option value="High">High — Operational Degradation</option>
                  <option value="Critical">Critical — Factory Line Down</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Service Execution Date</label>
                <input
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Assigned Engineer</label>
                <input
                  type="text"
                  value={formData.assignedEngineerName}
                  readOnly
                  className="w-full text-xs p-2.5 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-700 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">Customer Reported Symptom / Problem *</label>
              <textarea
                rows={3}
                value={formData.problemReported}
                onChange={(e) => setFormData({ ...formData, problemReported: e.target.value })}
                placeholder="Describe reported alarms, trip codes, abnormal vibrations, temperature rise, or scheduled PM items..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Engineer Initial On-Site Assessment</label>
              <textarea
                rows={2}
                value={formData.engineerNotes}
                onChange={(e) => setFormData({ ...formData, engineerNotes: e.target.value })}
                placeholder="Initial visual conditions observed upon arrival at customer premises..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* STEP 3: INSPECTION CHECKLIST */}
        {activeStep === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Step 3: Technical Inspection Checklist
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify all mandatory checkpoints. If an anomaly is identified, mark "Issue Found" to record evidence.
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                {formData.checklist.filter((c) => c.status !== 'Pending').length} of{' '}
                {formData.checklist.length} Completed
              </div>
            </div>

            {/* Checklist items list */}
            <div className="space-y-3">
              {formData.checklist.map((item) => {
                const isIssue = item.status === 'Issue Found';
                const isCompleted = item.status === 'Completed';
                const isNA = item.status === 'Not Applicable';

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isIssue
                        ? 'border-red-300 bg-red-50/30'
                        : isCompleted
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
                          {item.code}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.label}</div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">
                            Category: {item.category}
                          </div>
                        </div>
                      </div>

                      {/* 3 Status Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleChecklistStatusChange(item.id, 'Completed')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ✓ Completed
                        </button>
                        <button
                          onClick={() => handleChecklistStatusChange(item.id, 'Issue Found')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            isIssue
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ⚠ Issue Found
                        </button>
                        <button
                          onClick={() => handleChecklistStatusChange(item.id, 'Not Applicable')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            isNA
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>

                    {/* Issue Details Inline Drawer */}
                    {isIssue && item.issue && (
                      <div className="mt-4 pt-4 border-t border-red-200/80 space-y-3 bg-white p-3.5 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Issue Details & Corrective Recommendation
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Mandatory for review
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Fault Description *
                            </label>
                            <input
                              type="text"
                              value={item.issue.description}
                              onChange={(e) =>
                                handleIssueDetailsUpdate(item.id, 'description', e.target.value)
                              }
                              placeholder="e.g. Filter contaminated with fine foundry dust, 0.85 bar drop..."
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-red-400 focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Severity</label>
                            <select
                              value={item.issue.severity}
                              onChange={(e) =>
                                handleIssueDetailsUpdate(item.id, 'severity', e.target.value)
                              }
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-red-400 focus:bg-white font-semibold"
                            >
                              <option value="Minor">Minor</option>
                              <option value="Moderate">Moderate</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Recommended Corrective Action
                          </label>
                          <input
                            type="text"
                            value={item.issue.recommendation}
                            onChange={(e) =>
                              handleIssueDetailsUpdate(item.id, 'recommendation', e.target.value)
                            }
                            placeholder="e.g. Replace intake filter cartridge, seat new Viton seal..."
                            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-red-400 focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: PARTS & MATERIALS */}
        {activeStep === 4 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Step 4: Parts & Consumables Consumption
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record parts taken from warehouse stock. Quantities are validated against live inventory.
                </p>
              </div>

              {/* AI Suggest Parts Button */}
              <button
                onClick={handleAiSuggestParts}
                disabled={isAiLoading}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAiLoading ? 'Analyzing...' : 'AI Suggest Parts'}</span>
              </button>
            </div>

            {/* AI Suggestions Box (if present) */}
            {aiSuggestions && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900">AI Diagnostic Recommendations</span>
                  </div>
                  <button
                    onClick={() => setAiSuggestions(null)}
                    className="text-blue-500 hover:text-blue-800 text-xs"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs text-blue-800 mt-1">{aiSuggestions.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {aiSuggestions.suggestions.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => handleAddPart(s)}
                      className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-900 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{s.partNumber} — {s.description} (₹{s.unitPrice})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Quick Add Picker */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">Available Inventory Catalog</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/40">
                {inventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:border-blue-400 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{inv.partNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                          Stock: {inv.availableQty}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1">{inv.description}</div>
                      <div className="text-xs font-bold text-blue-700 mt-0.5">₹{inv.unitPrice} / {inv.unit}</div>
                    </div>
                    <button
                      onClick={() => handleAddPart(inv)}
                      disabled={inv.availableQty === 0}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill of Materials Table */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">Bill of Materials (Added to Job Card)</span>
                <span className="text-xs font-semibold text-blue-700">
                  Subtotal: ₹{formData.parts.reduce((sum, p) => sum + p.total, 0).toLocaleString()}
                </span>
              </div>

              {formData.parts.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                  No parts or consumables added yet. Select from the inventory catalog above.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2.5">Part #</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.parts.map((part) => (
                        <tr key={part.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-slate-900">{part.partNumber}</td>
                          <td className="p-2.5 text-slate-700">{part.description}</td>
                          <td className="p-2.5 text-center">
                            <div className="inline-flex items-center gap-2 border border-slate-200 rounded px-1.5 py-0.5">
                              <button
                                onClick={() => handleUpdatePartQty(part.partNumber, -1)}
                                className="text-slate-500 hover:text-slate-900 font-bold"
                              >
                                -
                              </button>
                              <span className="font-bold">{part.quantity}</span>
                              <button
                                onClick={() => handleUpdatePartQty(part.partNumber, 1)}
                                className="text-slate-500 hover:text-slate-900 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono">₹{part.unitPrice}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{part.total.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleRemovePart(part.partNumber)}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: WORK PERFORMED */}
        {activeStep === 5 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Step 5: Work Performed & Technical Narrative
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summarize specific technical steps executed on the machine, test metrics, and customer recommendations.
                </p>
              </div>

              {/* AI Synthesize Summary Button */}
              <button
                onClick={handleAiGenerateSummary}
                disabled={isAiLoading}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiLoading ? 'Synthesizing...' : 'AI Generate Summary'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Detailed Work Performed Narrative *</label>
                <span className="text-[11px] text-slate-400">
                  {formData.workPerformed.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={formData.workPerformed}
                onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
                placeholder="Example: Removed contaminated intake filter cartridge. Cleaned housing assembly. Fitted 2x OEM cartridges. Executed 30-min load test..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Recommendations for Customer / Plant Crew</label>
              <textarea
                rows={3}
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                placeholder="Guidance on air filtration, room ventilation, lubrication intervals, or routine operator checks..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Additional Internal Service Notes</label>
              <textarea
                rows={2}
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                placeholder="Optional notes for supervisory staff or future field service visits..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* STEP 6: ATTACHMENTS & EVIDENCE */}
        {activeStep === 6 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Step 6: Photographic Evidence & Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Attach photographic evidence: Before Service condition, After Service clean state, and Equipment Nameplate.
              </p>
            </div>

            {/* Category Quick Capture Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { cat: 'Before Service', label: 'Before Service Photo' },
                { cat: 'After Service', label: 'After Service Photo' },
                { cat: 'Equipment Plate', label: 'Nameplate / Serial' },
                { cat: 'Damaged Part', label: 'Damaged Part Evidence' },
              ].map((btn) => (
                <button
                  key={btn.cat}
                  onClick={() => handleSimulateAddAttachment(btn.cat)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-blue-400 rounded-lg text-left cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4 text-blue-600 mb-1" />
                  <div className="text-xs font-bold text-slate-800">{btn.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">+ Capture / Upload</div>
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-900 mb-3">
                Uploaded Evidence ({formData.attachments.length})
              </div>

              {formData.attachments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  No photos attached yet. Click the buttons above to capture or attach photos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {formData.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs group relative"
                    >
                      <div className="h-36 bg-slate-100 overflow-hidden relative">
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                          {att.category}
                        </span>
                        <button
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-semibold text-slate-900 truncate">{att.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                          <span>{att.uploadedAt}</span>
                          <span>{att.sizeKb} KB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW & SUBMIT */}
        {activeStep === 7 && (
          <div className="space-y-6">
            {/* Validation Feedback Banner */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-red-900">
                      {validationErrors.length} Item(s) Require Completion Before Submission
                    </h3>
                    <ul className="mt-1.5 space-y-1 text-xs text-red-700 list-disc list-inside">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-amber-900">Advisory Quality Warnings</h3>
                    <ul className="mt-1 space-y-1 text-xs text-amber-800 list-disc list-inside">
                      {validationWarnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* AI Review Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    AI Pre-Submission Quality Check
                  </h3>
                </div>
                <button
                  onClick={handleAiQualityCheck}
                  disabled={isAiLoading}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                  <span>{isAiLoading ? 'Auditing...' : 'Run Quality Audit'}</span>
                </button>
              </div>

              {formData.aiReview ? (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="font-semibold text-slate-900">
                    {formData.aiReview.executiveSummary}
                  </div>
                  {formData.aiReview.inconsistencies.map((inc: any, i: number) => (
                    <div key={i} className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      <strong>Warning: </strong> {inc.recommendation}
                    </div>
                  ))}
                  {formData.aiReview.pricingVariances.map((pv: any, i: number) => (
                    <div key={i} className="text-purple-800 bg-purple-50 p-2 rounded border border-purple-200">
                      <strong>Pricing: </strong> {pv.message}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Click "Run Quality Audit" to verify diagnostic consistency and check for price variances.
                </p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Financial Breakdown & Estimates
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Parts Total</span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    ₹{formData.pricing.parts.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Labour ({formData.pricing.labourHours} hrs @ ₹{formData.pricing.labourRate})</span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    ₹{formData.pricing.labour.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">GST (18%)</span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    ₹{formData.pricing.tax.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-blue-700 font-semibold">Total Cost</span>
                  <div className="text-lg font-black text-blue-900 font-mono mt-0.5">
                    ₹{formData.pricing.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Action Bar */}
            <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <div className="text-sm font-bold text-slate-900">Ready to route to Manager?</div>
                <div className="text-xs text-slate-500">
                  Submitting will lock engineer inputs and queue this card for supervisory signoff.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleManualSave}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => setSubmitConfirmOpen(true)}
                  disabled={validationErrors.length > 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Submit */}
      {submitConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Send className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Confirm Submission to Manager</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you ready to submit Job Card <strong>{formData.id}</strong>? The status will update to <strong>Pending Review</strong> and deduct inventory stocks accordingly.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 space-y-1">
              <div><strong>Customer:</strong> {formData.customerName}</div>
              <div><strong>Equipment:</strong> {formData.equipmentName}</div>
              <div><strong>Parts Used:</strong> {formData.parts.length} items (₹{formData.pricing.parts.toLocaleString()})</div>
              <div><strong>Total Estimated:</strong> ₹{formData.pricing.total.toLocaleString()}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSubmitConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
