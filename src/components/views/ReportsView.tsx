import React from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, CheckCircle2, Clock, DollarSign, ShieldAlert } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { jobCards } = useApp();

  const totalJobs = jobCards.length;
  const completedJobs = jobCards.filter((jc) => jc.status === 'Completed' || jc.status === 'Approved').length;
  const inProgressJobs = jobCards.filter((jc) => jc.status === 'In Progress' || jc.status === 'Draft').length;
  const pendingJobs = jobCards.filter((jc) => jc.status === 'Pending Review' || jc.status === 'Submitted').length;

  const totalRevenue = jobCards.reduce((sum, jc) => sum + jc.pricing.total, 0);
  const totalPartsCost = jobCards.reduce((sum, jc) => sum + jc.pricing.parts, 0);

  const statusDistribution = [
    { label: 'Completed / Approved', count: completedJobs, color: 'bg-emerald-500' },
    { label: 'Pending Manager Review', count: pendingJobs, color: 'bg-amber-500' },
    { label: 'In Progress / Draft', count: inProgressJobs, color: 'bg-blue-500' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Service Operations & SLA Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise reporting on Job Card turnover, parts consumption, and SLA fulfillment.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Cumulative Billing</span>
          <div className="text-xl font-extrabold text-blue-900 mt-2 font-mono">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all work orders</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">First-Time Fix Rate</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-2 font-mono">94.2%</div>
          <div className="text-[11px] text-slate-400 mt-1">Target: &gt;90%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Average Turnaround</span>
          <div className="text-xl font-extrabold text-slate-900 mt-2 font-mono">3.8 Hours</div>
          <div className="text-[11px] text-slate-400 mt-1">From dispatch to submission</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Parts Consumption</span>
          <div className="text-xl font-extrabold text-purple-700 mt-2 font-mono">
            ₹{totalPartsCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Materials issued</div>
        </div>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Job Card Lifecycle Breakdown
          </h3>

          <div className="space-y-3">
            {statusDistribution.map((item) => {
              const pct = totalJobs > 0 ? Math.round((item.count / totalJobs) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-mono">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            SLA & Operational Health Summary
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-900 flex justify-between items-center">
              <span>Preventive Maintenance Schedule Compliance:</span>
              <strong className="font-mono text-sm">98.5%</strong>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-900 flex justify-between items-center">
              <span>Average Manager Approval Lead Time:</span>
              <strong className="font-mono text-sm">45 mins</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 flex justify-between items-center">
              <span>Customer Verification Sign-Off Rate:</span>
              <strong className="font-mono text-sm">100%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
