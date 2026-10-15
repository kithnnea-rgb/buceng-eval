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
      comments,
      submission_type,
      assignments (
        evaluators (full_name, role),
        council_members (full_name, position)
      )
    `);

    if (!data) return;

    const headers = 'Evaluator,Role,Subject,Position,Q1,Q2,Q3,Comments,Status\n';
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

  if (loading) return <div className="p-8 text-center">Loading Administrator Portal...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow border">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Administrator Dashboard</h1>
            <p className="text-sm text-gray-500">System Administrator: Krisie</p>
          </div>
          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
          >
            Export CSV Report
          </button>
        </div>

        {/* Statistic Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Council Members</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalMembers}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Evaluators</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalEvaluators}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Total Assigned</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalAssignments}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}