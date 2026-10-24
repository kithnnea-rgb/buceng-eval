'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Assignment {
  id: string;
  status: 'Not Started' | 'In Progress' | 'Submitted';
  council_members: {
    full_name: string;
    position: string;
    committee: string;
  };
}

export default function EvaluatorDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const evalId = sessionStorage.getItem('evaluator_id');
    const name = sessionStorage.getItem('evaluator_name');

    if (!evalId) {
      router.push('/');
      return;
    }

    setUserName(name || 'Evaluator');

    async function loadAssignments() {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          status,
          council_members (
            full_name,
            position,
            committee
          )
        `)
        .eq('evaluator_id', evalId);

      if (!error && data) {
        setAssignments(data as unknown as Assignment[]);
      }
      setLoading(false);
    }

    loadAssignments();
  }, [router]);

  function handleLogout() {
    sessionStorage.clear();
    router.push('/');
  }

  const completedCount = assignments.filter((a) => a.status === 'Submitted').length;

  if (loading) return <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">Loading assignments...</div>;

  return (
    <div className="min-h-screen bg-[#FDF0D0] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Ember Banner */}
        <div className="bg-[#C04A06] text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Hi, {userName}</h1>
            <p className="text-amber-100 text-sm mt-1">
              Please evaluate your assigned council members based on the AY 2026–2027 Internal Evaluation Criteria.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white text-[#C04A06] hover:bg-amber-50 rounded-lg text-sm font-bold transition shadow-sm"
          >
            Logout
          </button>
        </div>

        {/* Progress Tracker with Amber Progress Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
            <span>Evaluation Progress</span>
            <span>{completedCount} of {assignments.length} Completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-[#F2A91E] h-3.5 rounded-full transition-all duration-300"
              style={{ width: assignments.length ? `${(completedCount / assignments.length) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-amber-50 font-bold text-gray-800 border-b">Assigned Members</div>
          <div className="divide-y divide-gray-200">
            {assignments.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-amber-50/50 transition">
                <div>
                  <h3 className="font-bold text-gray-900">{item.council_members.full_name}</h3>
                  <p className="text-sm text-gray-600">{item.council_members.position} • {item.council_members.committee}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      item.status === 'Submitted'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.status}
                  </span>

                  <Link
                    href={`/evaluate/${item.id}`}
                    className="px-4 py-2 bg-[#E8760A] hover:bg-[#d26807] text-white rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    {item.status === 'Submitted' ? 'View' : 'Evaluate'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}