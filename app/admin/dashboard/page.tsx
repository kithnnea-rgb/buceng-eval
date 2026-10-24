'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalEvaluators: 0,
    totalAssignments: 0,
    completed: 0,
    pending: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const role = sessionStorage.getItem('evaluator_role');
    if (role !== 'Admin') {
      router.push('/');
      return;
    }

    async function loadMetrics() {
      const { count: memberCount } = await supabase.from('council_members').select('*', { count: 'exact', head: true });
      const { count: evalCount } = await supabase.from('evaluators').select('*', { count: 'exact', head: true });
      const { data: assignData } = await supabase.from('assignments').select('status');

      if (assignData) {
        const total = assignData.length;
        const done = assignData.filter((a) => a.status === 'Submitted').length;
        const pend = total - done;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        setStats({
          totalMembers: memberCount || 0,
          totalEvaluators: evalCount || 0,
          totalAssignments: total,
          completed: done,
          pending: pend,
          percentage: pct,
        });
      }
      setLoading(false);
    }

    loadMetrics();
  }, [router]);

  async function exportCSV() {
    const { data } = await supabase.from('evaluations').select(`
      id,
      q1_rating,
      q2_rating,
      q3_rating,
      q4_rating,
      q5_rating,
      comments,
      submission_type,
      assignments (
        evaluators (full_name, role),
        council_members (full_name, position)
      )
    `);

    if (!data) return;

    const headers = 'Evaluator,Role,Subject,Position,Q1,Q2,Q3,Q4,Q5,Comments,Status\n';
    const rows = data
      .map((row: any) =>
        [
          `"${row.assignments?.evaluators?.full_name || ''}"`,
          `"${row.assignments?.evaluators?.role || ''}"`,
          `"${row.assignments?.council_members?.full_name || ''}"`,
          `"${row.assignments?.council_members?.position || ''}"`,
          row.q1_rating,
          row.q2_rating,
          row.q3_rating,
          row.q4_rating,
          row.q5_rating,
          `"${(row.comments || '').replace(/"/g, '""')}"`,
          row.submission_type,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BUCENG_Evaluation_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (loading) return <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">Loading Administrator Portal...</div>;

  return (
    <div className="min-h-screen bg-[#FDF0D0] p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Ember Header Banner */}
        <div className="flex justify-between items-center bg-[#C04A06] text-white p-6 rounded-xl shadow-md">
          <div>
            <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
            <p className="text-sm text-amber-100">System Administrator: Krisie</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-[#E8760A] hover:bg-[#d26807] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition shadow-sm"
          >
            Export CSV Report
          </button>
        </div>

        {/* Statistic Cards with Gold Numbers (#F7C95A) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm text-gray-400 font-medium">Total Council Members</p>
            <p className="text-3xl font-extrabold text-[#F7C95A] mt-1">{stats.totalMembers}</p>
          </div>
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm text-gray-400 font-medium">Total Evaluators</p>
            <p className="text-3xl font-extrabold text-[#F7C95A] mt-1">{stats.totalEvaluators}</p>
          </div>
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm text-gray-400 font-medium">Total Assigned</p>
            <p className="text-3xl font-extrabold text-[#F7C95A] mt-1">{stats.totalAssignments}</p>
          </div>
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm text-gray-400 font-medium">Completed</p>
            <p className="text-3xl font-extrabold text-[#F7C95A] mt-1">{stats.completed}</p>
          </div>
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm text-gray-400 font-medium">Pending</p>
            <p className="text-3xl font-extrabold text-[#F7C95A] mt-1">{stats.pending}</p>
          </div>
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 shadow-sm">
            <p className="text-sm text-gray-400 font-medium">Completion Rate</p>
            <p className="text-3xl font-extrabold text-[#F7C95A] mt-1">{stats.percentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}