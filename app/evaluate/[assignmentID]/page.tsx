'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Criterion {
  title: string;
  description: string;
  indicators: string[];
}

const EXEC_CRITERIA: Criterion[] = [
  {
    title: '1. Leadership and Governance',
    description: 'Assesses ability to lead with integrity, provide direction, and uphold organizational values.',
    indicators: ['Vision & Direction', 'Integrity & Accountability', 'Decision-Making & Problem-Solving', 'Delegation & Empowerment', 'Conflict Resolution', 'Accountability'],
  },
  {
    title: '2. Organizational Contribution',
    description: "Measures active involvement, initiative, and tangible impact on the council's growth.",
    indicators: ['Active Participation', 'Initiative & Innovation', 'Program & Project Support', 'Organizational Impact'],
  },
  {
    title: '3. Communication and Collaboration',
    description: 'Evaluates clear communication, teamwork, and inclusive relationships within the council.',
    indicators: ['Clarity & Transparency', 'Active Listening & Responsiveness', 'Interpersonal Relations'],
  },
  {
    title: '4. Performance and Productivity',
    description: 'Evaluates efficiency, reliability, and quality of outputs in fulfilling responsibilities.',
    indicators: ['Execution & Reliability', 'Efficiency & Resource Management', 'Performance Standards', 'Consistency & Initiative', 'Performance Outcomes'],
  },
  {
    title: '5. Professionalism and Conduct',
    description: 'Evaluates ethical behavior, discipline, and representation of the organization.',
    indicators: ['Ethical Standards & Integrity', 'Respect & Workplace Harmony'],
  },
];

const JC_CRITERIA: Criterion[] = [
  {
    title: '1. Commitment and Participation',
    description: 'Evaluates dedication, reliability, and active involvement in organizational activities.',
    indicators: ['Attendance', 'Active Engagement', 'Reliability & Responsibility', 'Resource Mobilization', 'Initiative'],
  },
  {
    title: '2. Performance and Productivity',
    description: 'Evaluates ability to complete assigned responsibilities efficiently, accurately, and with impact.',
    indicators: ['Timeliness & Reliability', 'Efficiency in Execution', 'Initiative & Proactivity', 'Consistency', 'Adaptability & Progress', 'Prioritization & Organization'],
  },
  {
    title: '3. Collaboration and Teamwork',
    description: 'Evaluates working harmoniously with peers, fostering inclusivity, and shared success.',
    indicators: ['Cooperation & Support', 'Shared Responsibility', 'Collaborative Engagement', 'Organizational Unity'],
  },
  {
    title: '4. Communication and Responsiveness',
    description: 'Evaluates clarity, timeliness, and effectiveness in information exchange.',
    indicators: ['Timeliness & Responsiveness', 'Active Listening & Feedback', 'Professional Tone & Medium Use'],
  },
  {
    title: '5. Professionalism and Conduct',
    description: 'Evaluates ethical behavior, discipline, and representation of the organization.',
    indicators: ['Ethical Standards & Integrity', 'Respect & Workplace Harmony'],
  },
];

export default function EvaluatePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const router = useRouter();

  const [member, setMember] = useState<any>(null);
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0, 0]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: assign, error: assignErr } = await supabase
        .from('assignments')
        .select('id, evaluator_id, council_members(full_name, position, committee, council_type)')
        .eq('id', assignmentId)
        .single();

      if (assignErr || !assign) {
        router.push('/dashboard');
        return;
      }

      setMember(assign.council_members);

      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (evalData) {
        setRatings([
          evalData.q1_rating || 0,
          evalData.q2_rating || 0,
          evalData.q3_rating || 0,
          evalData.q4_rating || 0,
          evalData.q5_rating || 0,
        ]);
        setComments(evalData.comments || '');
      }

      setLoading(false);
    }

    loadData();
  }, [assignmentId, router]);

  function handleRatingChange(index: number, val: number) {
    const updated = [...ratings];
    updated[index] = val;
    setRatings(updated);
  }

  async function saveEvaluation(submissionType: 'Draft' | 'Final') {
    if (submissionType === 'Final') {
      if (ratings.some((r) => r === 0)) {
        alert('Please provide a rating (1–5) for all 5 criteria before final submission.');
        return;
      }
      if (!confirm('Are you sure you want to finalize this submission? You will not be able to edit it afterward.')) {
        return;
      }
    }

    const { error: evalErr } = await supabase.from('evaluations').upsert(
      {
        assignment_id: assignmentId,
        q1_rating: ratings[0],
        q2_rating: ratings[1],
        q3_rating: ratings[2],
        q4_rating: ratings[3],
        q5_rating: ratings[4],
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

    const newStatus = submissionType === 'Final' ? 'Submitted' : 'In Progress';
    await supabase.from('assignments').update({ status: newStatus }).eq('id', assignmentId);

    alert(submissionType === 'Final' ? 'Evaluation submitted successfully!' : 'Draft saved.');
    router.push('/dashboard');
  }

  if (loading) return <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">Loading evaluation form...</div>;

  const criteriaList = member?.council_type === 'JC' ? JC_CRITERIA : EXEC_CRITERIA;

  return (
    <div className="min-h-screen bg-[#FDF0D0] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-[#C04A06] text-white p-6 rounded-xl shadow-md">
          <span className="text-xs uppercase tracking-wider bg-amber-200/20 px-3 py-1 rounded-full font-semibold">
            {member?.council_type} Evaluation
          </span>
          <h1 className="text-2xl font-bold mt-2">{member?.full_name}</h1>
          <p className="text-amber-100 text-sm mt-1">{member?.position} — {member?.committee} Committee</p>
        </div>

        {/* Criteria Rating Cards */}
        <div className="space-y-4">
          {criteriaList.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.indicators.map((ind, i) => (
                    <span key={i} className="text-[11px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-medium border border-amber-200/60">
                      • {ind}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rating Scale (1 = Poor, 5 = Excellent)</label>
                <div className="flex space-x-3">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleRatingChange(idx, val)}
                      className={`flex-1 py-3 rounded-lg font-bold border transition shadow-xs ${
                        ratings[idx] === val
                          ? 'bg-[#E8760A] text-white border-[#E8760A]'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-amber-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Qualitative Feedback */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Qualitative Feedback & Comments</h3>
            <p className="text-xs text-gray-500 mb-3">Provide constructive observations, recommendations, or key achievements.</p>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Write feedback here..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#E8760A] focus:outline-none"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
          >
            Cancel
          </button>
          <div className="space-x-3">
            <button
              onClick={() => saveEvaluation('Draft')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-semibold transition"
            >
              Save Draft
            </button>
            <button
              onClick={() => saveEvaluation('Final')}
              className="px-4 py-2 bg-[#E8760A] hover:bg-[#d26807] text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              Submit Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}