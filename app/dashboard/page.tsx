'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface AssignmentItem {
  id: string;
  status: string;
  council_members: {
    full_name: string;
    position: string;
    committee: string;
    council_type: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [evaluatorName, setEvaluatorName] = useState('');
  const [evaluatorRole, setEvaluatorRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('evaluator_id') || sessionStorage.getItem('evaluator_id');
    const name = localStorage.getItem('evaluator_name') || sessionStorage.getItem('evaluator_name');
    const role = localStorage.getItem('evaluator_role') || sessionStorage.getItem('evaluator_role');

    if (!id) {
      router.replace('/');
      return;
    }

    if (name) setEvaluatorName(name);
    if (role) setEvaluatorRole(role);

    async function fetchAssignments() {
      // Explicit foreign key relation matching target_member_id column in database schema
      const { data, error } = await supabase
        .from('assignments')
        .select('id, status, council_members:target_member_id(full_name, position, committee, council_type)')
        .eq('evaluator_id', id);

      if (error) {
        console.error('Error loading assignments:', error);
      } else if (data) {
        setAssignments(data as unknown as AssignmentItem[]);
      }
      setLoading(false);
    }

    fetchAssignments();
  }, [router]);

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    router.replace('/');
  }

  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'Submitted').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF0D0] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-[#C04A06] text-white p-6 rounded-xl shadow-md flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider bg-amber-200/20 px-3 py-1 rounded-full font-semibold">
              {evaluatorRole} Portal
            </span>
            <h1 className="text-2xl font-bold mt-2">Welcome, {evaluatorName}!</h1>
            <p className="text-amber-100 text-sm mt-1">
              Complete your assigned internal evaluations below.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Progress Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Evaluation Progress</span>
            <span>{completedCount} of {totalCount} Completed ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#F2A91E] h-3 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Assigned List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Assigned Evaluations</h2>
          
          {assignments.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-gray-200 text-gray-500">
              No assigned evaluations found for this evaluator code.
            </div>
          ) : (
            assignments.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {item.council_members?.full_name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      {item.council_members?.council_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.council_members?.position} — {item.council_members?.committee} Committee
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      item.status === 'Submitted'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.status || 'Not Started'}
                  </span>

                  <Link
                    href={`/evaluate/${item.id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      item.status === 'Submitted'
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-[#E8760A] hover:bg-[#d26807] text-white shadow-sm'
                    }`}
                  >
                    {item.status === 'Submitted' ? 'View Evaluation' : 'Evaluate'}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}