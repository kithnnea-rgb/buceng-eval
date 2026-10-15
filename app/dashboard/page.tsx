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

  if (loading) return <div className="p-8 text-center text-gray-600">Loading assignments...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {userName}</h1>
            <p className="text-sm text-gray-600">Please complete ratings for all assigned council members below.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Evaluation Progress</span>
            <span>{completedCount} of {assignments.length} Completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: assignments.length ? `${(completedCount / assignments.length) * 100}%` : '0%' }}
            ></div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-100 font-semibold text-gray-700 border-b">Assigned Members</div>
          <div className="divide-y divide-gray-200">
            {assignments.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.council_members.full_name}</h3>
                  <p className="text-sm text-gray-500">{item.council_members.position} • {item.council_members.committee}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'Submitted'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.status}
                  </span>

                  <Link
                    href={`/evaluate/${item.id}`}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
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