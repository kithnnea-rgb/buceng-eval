'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function EvaluationForm() {
  const params = useParams();
  // Checks both capitalizations to prevent folder naming mismatches
  const assignmentId = (params?.assignmentID || params?.assignmentId) as string;
  const router = useRouter();

  const [member, setMember] = useState<any>(null);
  const [q1, setQ1] = useState<number>(0);
  const [q2, setQ2] = useState<number>(0);
  const [q3, setQ3] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;

    async function loadData() {
      // 1. Fetch assignment details
      const { data: assign, error: assignErr } = await supabase
        .from('assignments')
        .select('id, evaluator_id, council_members(full_name, position, committee)')
        .eq('id', assignmentId)
        .single();

      if (assignErr || !assign) {
        router.push('/dashboard');
        return;
      }

      setMember(assign.council_members);

      // 2. Fetch draft/submitted data if available
      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (evalData) {
        setQ1(evalData.q1_rating || 0);
        setQ2(evalData.q2_rating || 0);
        setQ3(evalData.q3_rating || 0);
        setComments(evalData.comments || '');
      }

      setLoading(false);
    }

    loadData();
  }, [assignmentId, router]);

  async function saveEvaluation(submissionType: 'Draft' | 'Final') {
    if (submissionType === 'Final') {
      if (!q1 || !q2 || !q3) {
        alert('Please answer all required rating criteria before submitting.');
        return;
      }
      if (!confirm('Are you sure you want to finalize this submission? You will not be able to edit it afterward.')) {
        return;
      }
    }

    // Upsert evaluation record
    const { error: evalErr } = await supabase.from('evaluations').upsert(
      {
        assignment_id: assignmentId,
        q1_rating: q1,
        q2_rating: q2,
        q3_rating: q3,
        comments,
        submission_type: submissionType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'assignment_id' }
    );

    if (evalErr) {
      alert('Error saving evaluation.');
      return;
    }

    // Update parent assignment status
    const newStatus = submissionType === 'Final' ? 'Submitted' : 'In Progress';
    await supabase.from('assignments').update({ status: newStatus }).eq('id', assignmentId);

    alert(submissionType === 'Final' ? 'Evaluation submitted successfully!' : 'Draft saved.');
    router.push('/dashboard');
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Loading evaluation form...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border p-6 space-y-6">
        {/* Subject Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">{member?.full_name}</h1>
          <p className="text-sm text-gray-500">{member?.position} — {member?.committee}</p>
        </div>

        {/* Question 1 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            1. Leadership & Initiative (Scale 1–5)
          </label>
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setQ1(val)}
                className={`w-12 h-12 rounded-lg font-bold border transition ${
                  q1 === val ? 'bg-blue-900 text-white border-blue-900' : 'bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Question 2 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            2. Communication & Teamwork (Scale 1–5)
          </label>
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setQ2(val)}
                className={`w-12 h-12 rounded-lg font-bold border transition ${
                  q2 === val ? 'bg-blue-900 text-white border-blue-900' : 'bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Question 3 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            3. Task Execution & Reliability (Scale 1–5)
          </label>
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setQ3(val)}
                className={`w-12 h-12 rounded-lg font-bold border transition ${
                  q3 === val ? 'bg-blue-900 text-white border-blue-900' : 'bg-gray-50 text-gray-700 border-gray-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Qualitative Feedback */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Comments & Recommendations
          </label>
          <textarea
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Write constructive feedback..."
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center border-t pt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
          >
            Cancel
          </button>
          <div className="space-x-3">
            <button
              onClick={() => saveEvaluation('Draft')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              Save Draft
            </button>
            <button
              onClick={() => saveEvaluation('Final')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-600">Loading form...</div>}>
      <EvaluationForm />
    </Suspense>
  );
}