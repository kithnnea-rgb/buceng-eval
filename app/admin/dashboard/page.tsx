'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface EvaluatorProgress {
  id: string;
  full_name: string;
  role: string;
  committee: string;
  unique_code: string;
  total_assigned: number;
  completed_count: number;
  is_complete: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [evaluatorList, setEvaluatorList] = useState<EvaluatorProgress[]>([]);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [completedAssignments, setCompletedAssignments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    // Session Guard
    const role = localStorage.getItem('evaluator_role') || sessionStorage.getItem('evaluator_role');
    const id = localStorage.getItem('evaluator_id') || sessionStorage.getItem('evaluator_id');

    if (!id || role !== 'Admin') {
      router.replace('/');
      return;
    }

    fetchAdminMetrics();
  }, [router]);

  async function fetchAdminMetrics() {
    setLoading(true);

    // 1. Fetch all evaluators excluding Admin
    const { data: evaluatorsData, error: evalErr } = await supabase
      .from('evaluators')
      .select('id, full_name, role, committee, unique_code')
      .neq('role', 'Admin')
      .order('full_name', { ascending: true });

    // 2. Fetch all assignments using .range(0, 4999) to bypass Supabase's default 1,000-row cap
    const { data: assignmentsData, error: assignErr } = await supabase
      .from('assignments')
      .select('id, evaluator_id, status')
      .range(0, 4999);

    if (evalErr || assignErr) {
      console.error('Error fetching admin data:', evalErr || assignErr);
      setLoading(false);
      return;
    }

    const assignments = assignmentsData || [];
    const evaluators = evaluatorsData || [];

    // Calculate global assignment totals
    const totalCount = assignments.length;
    const completedCount = assignments.filter((a) => a.status === 'Submitted').length;

    setTotalAssignments(totalCount);
    setCompletedAssignments(completedCount);

    // Map progress per evaluator
    const progressList: EvaluatorProgress[] = evaluators.map((evaluator) => {
      const userAssignments = assignments.filter((a) => a.evaluator_id === evaluator.id);
      const userTotal = userAssignments.length;
      const userCompleted = userAssignments.filter((a) => a.status === 'Submitted').length;

      return {
        id: evaluator.id,
        full_name: evaluator.full_name,
        role: evaluator.role,
        committee: evaluator.committee || 'N/A',
        unique_code: evaluator.unique_code,
        total_assigned: userTotal,
        completed_count: userCompleted,
        is_complete: userTotal > 0 && userCompleted === userTotal,
      };
    });

    setEvaluatorList(progressList);
    setLoading(false);
  }

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    router.replace('/');
  }

  function exportCSV() {
    const headers = ['Full Name', 'Role', 'Committee', 'Access Code', 'Completed', 'Total Assigned', 'Status'];
    const rows = evaluatorList.map((e) => [
      `"${e.full_name}"`,
      `"${e.role}"`,
      `"${e.committee}"`,
      `"${e.unique_code}"`,
      e.completed_count,
      e.total_assigned,
      e.is_complete ? 'Completed' : 'Pending',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BUCENG_Evaluation_Progress_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const overallPercent = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
  const completedEvaluatorsCount = evaluatorList.filter((e) => e.is_complete).length;

  const filteredEvaluators = evaluatorList.filter((e) => {
    const matchesSearch =
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.committee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.unique_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || e.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF0D0] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-[#C04A06] text-white p-6 rounded-xl shadow-md flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider bg-amber-200/20 px-3 py-1 rounded-full font-semibold">
              Administrator Access
            </span>
            <h1 className="text-2xl font-bold mt-2">Evaluation Control Panel</h1>
            <p className="text-amber-100 text-sm mt-1">
              Bicol University College of Engineering — CSC Internal Evaluation
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Overall Completion Bar Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-200/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Evaluate Members</h2>
            <span className="text-xs font-bold text-[#E8760A] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {overallPercent}% Total Completion
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 pt-1">
            <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
              Progress: <span className="font-bold text-gray-900">{completedAssignments}</span> of{' '}
              <span className="font-bold text-gray-900">{totalAssignments}</span> completed
            </div>

            <div className="flex-1 bg-amber-100/60 h-4 rounded-full overflow-hidden p-0.5 border border-amber-200/40">
              <div
                className="bg-gradient-to-r from-[#C04A06] via-[#E8760A] to-[#F2A91E] h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Evaluators Completed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {completedEvaluatorsCount} <span className="text-sm font-normal text-gray-500">/ {evaluatorList.length}</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Submitted Evaluations</p>
            <p className="text-2xl font-bold text-[#E8760A] mt-1">{completedAssignments}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pending Evaluations</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalAssignments - completedAssignments}</p>
          </div>
        </div>

        {/* Directory & Progress Table */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-gray-900 text-lg">Evaluator Progress Directory</h3>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-[#E8760A] hover:bg-[#d26807] text-white rounded-lg text-sm font-bold transition shadow-sm"
            >
              Export CSV Report
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, committee, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E8760A] focus:outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#E8760A] focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="CSC Exec">CSC Exec Only</option>
              <option value="JC">JC Only</option>
            </select>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-amber-50/50">
                  <th className="py-3 px-4">Evaluator Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Committee</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEvaluators.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No evaluators found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvaluators.map((item) => {
                    const evalPercent =
                      item.total_assigned > 0 ? Math.round((item.completed_count / item.total_assigned) * 100) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{item.full_name}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                            {item.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">{item.committee}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-700">{item.unique_code}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#E8760A] h-full rounded-full"
                                style={{ width: `${evalPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {item.completed_count}/{item.total_assigned} ({evalPercent}%)
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              item.is_complete
                                ? 'bg-green-100 text-green-800'
                                : item.completed_count > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.is_complete ? 'Completed' : item.completed_count > 0 ? 'In Progress' : 'Not Started'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}