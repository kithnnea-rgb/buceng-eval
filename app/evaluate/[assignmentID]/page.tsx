'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Criterion {
  title: string;
  description: string;
  indicators: string[];
}

const EXEC_CRITERIA: Criterion[] = [
  {
    title: "1. Leadership and Governance",
    description: "Assesses the officer's ability to lead with integrity, provide direction, and uphold organizational values.",
    indicators: [
      "Vision and Direction",
      "Integrity and Accountability",
      "Decision-Making and Problem-Solving",
      "Delegation and Empowerment",
      "Conflict Resolution and Peacebuilding",
      "Accountability and Responsibility",
    ],
  },
  {
    title: "2. Organizational Contribution",
    description: "Measures the officer's active involvement, initiative, and tangible impact on the organization's growth and sustainability.",
    indicators: [
      "Active Participation",
      "Initiative and Innovation",
      "Program and Project Support",
      "Organizational Impact",
    ],
  },
  {
    title: "3. Communication and Collaboration",
    description: "Evaluates the officer's ability to communicate clearly, foster teamwork, and build inclusive relationships within the organization.",
    indicators: [
      "Clarity and Transparency",
      "Active Listening and Responsiveness",
      "Interpersonal Relations",
    ],
  },
  {
    title: "4. Performance and Productivity",
    description: "Evaluates the officer's efficiency, reliability, and quality of outputs in fulfilling organizational responsibilities.",
    indicators: [
      "Execution and Reliability",
      "Efficiency and Resource Management",
      "Performance Standards",
      "Consistency and Initiative",
      "Performance Outcomes",
    ],
  },
  {
    title: "5. Professionalism and Conduct",
    description: "Evaluates the officer's ethical behavior, discipline, and representation of the organization.",
    indicators: [
      "Ethical Standards and Integrity",
      "Respect and Workplace Harmony",
    ],
  },
];

const JC_CRITERIA: Criterion[] = [
  {
    title: "1. Commitment and Participation",
    description: "Evaluates the officer's dedication, reliability, and active involvement in organizational activities.",
    indicators: [
      "Attendance",
      "Active Engagement",
      "Reliability and Responsibility",
      "Resource Mobilization",
      "Initiative",
    ],
  },
  {
    title: "2. Performance and Productivity",
    description: "Evaluates the officer's ability to complete assigned responsibilities efficiently, accurately, and with measurable impact.",
    indicators: [
      "Timeliness and Reliability",
      "Efficiency in Execution",
      "Initiative and Proactivity",
      "Consistency of Performance",
      "Adaptability and Progress",
      "Prioritization and Organization",
    ],
  },
  {
    title: "3. Collaboration and Teamwork",
    description: "Evaluates the officer's ability to work harmoniously with peers, foster inclusivity, and contribute to collective organizational success.",
    indicators: [
      "Cooperation and Support",
      "Shared Responsibility",
      "Collaborative Engagement",
      "Organizational Unity",
    ],
  },
  {
    title: "4. Communication and Responsiveness",
    description: "Evaluates the officer's clarity, timeliness, and effectiveness in exchanging information and responding to organizational needs.",
    indicators: [
      "Timeliness and Responsiveness",
      "Active Listening and Feedback",
      "Professional Tone and Medium Use",
    ],
  },
  {
    title: "5. Professionalism and Conduct",
    description: "Evaluates the officer's ethical behavior, discipline, and representation of the organization.",
    indicators: [
      "Ethical Standards and Integrity",
      "Respect and Workplace Harmony",
    ],
  },
];

const COMMITTEE_CRITERIA: Criterion[] = [
  {
    title: "1. Mandate Fulfillment and Strategic Goal Attainment",
    description: "Evaluates the committee's overall effectiveness in fulfilling assigned responsibilities, achieving performance targets, and contributing to strategic priorities.",
    indicators: [
      "Target Achievement",
      "Quality of Outputs and Deliverables",
      "Strategic Alignment",
    ],
  },
  {
    title: "2. Operational Execution and Crisis Management",
    description: "Assesses the committee's efficiency, reliability, and adaptability in planning, implementing, and monitoring activities, including addressing unexpected challenges.",
    indicators: [
      "Operational Efficiency and Timeliness",
      "Adaptability and Problem-Solving",
      "Risk Assessment and Mitigation",
    ],
  },
  {
    title: "3. Resource Management and Accountability",
    description: "Evaluates the committee's responsible and transparent use of financial, material, informational, and other organizational resources.",
    indicators: [
      "Financial and Material Resource Management",
      "Documentation and Records Management",
      "Asset Protection and Sustainability",
    ],
  },
  {
    title: "4. Cross-Committee Collaboration and Institutional Alignment",
    description: "Measures the committee's ability to coordinate effectively with other committees and maintain alignment with established council policies and priorities.",
    indicators: [
      "Inter-Committee Coordination",
      "Communication and Information Sharing",
      "Participation in Council-Wide Initiatives",
    ],
  },
  {
    title: "5. Team Effectiveness, Morale, and Member Development",
    description: "Evaluates the committee's internal management, working environment, member engagement, and commitment to developing members' skills.",
    indicators: [
      "Equitable Workload Distribution",
      "Teamwork and Conflict Resolution",
      "Member Engagement and Capacity Building",
    ],
  },
  {
    title: "6. Stakeholder Engagement and Organizational Impact",
    description: "Assesses the committee's effectiveness in engaging its intended audience, responding to stakeholder needs, maintaining credibility, and contributing to overall impact.",
    indicators: [
      "Student and Stakeholder Engagement",
      "Professionalism and Institutional Representation",
      "Feedback and Continuous Improvement",
    ],
  },
];

const COUNCIL_CRITERIA: Criterion[] = [
  {
    title: "1. Mission Fulfillment and Strategic Goal Attainment",
    description: "Evaluates the council's overall effectiveness in fulfilling its mandate, achieving its plans and targets for the term, and advancing student welfare.",
    indicators: [
      "Target Achievement",
      "Quality of Programs and Outputs",
      "Strategic Alignment and Student Responsiveness",
    ],
  },
  {
    title: "2. Governance, Policy Compliance, and Transparency",
    description: "Assesses how well the council upholds its constitution, bylaws, and institutional policies, and how soundly it makes and communicates decisions.",
    indicators: [
      "Constitutional and Policy Compliance",
      "Decision-Making and Accountability",
      "Transparency and Records Management",
    ],
  },
  {
    title: "3. Operational Execution and Crisis Management",
    description: "Assesses the council's efficiency, reliability, and adaptability in planning, implementing, and monitoring its activities.",
    indicators: [
      "Operational Efficiency and Timeliness",
      "Adaptability and Problem-Solving",
      "Risk Assessment and Mitigation",
    ],
  },
  {
    title: "4. Resource Management and Financial Stewardship",
    description: "Evaluates the council's responsible and transparent use of its financial, material, and informational resources.",
    indicators: [
      "Financial Management and Compliance",
      "Financial Transparency and Reporting",
      "Asset Protection and Turnover",
    ],
  },
  {
    title: "5. Internal Coordination, Teamwork, and Member Development",
    description: "Measures how well the Executive Board, committees, and members work together as one body, and how the council sustains morale.",
    indicators: [
      "Inter-Committee and Executive Board Coordination",
      "Teamwork and Conflict Resolution",
      "Member Engagement and Capacity Building",
    ],
  },
  {
    title: "6. Stakeholder Engagement and Institutional Representation",
    description: "Assesses the council's effectiveness in engaging students, partner organizations, and institutional offices while upholding credibility.",
    indicators: [
      "Student Engagement and Participation",
      "External Partnerships and Representation",
      "Feedback and Continuous Improvement",
    ],
  },
];

function getCriteriaList(councilType?: string): Criterion[] {
  const type = councilType?.toUpperCase() || '';
  if (type === 'JC' || type === 'JUNIOR COUNCILOR') return JC_CRITERIA;
  if (type === 'COMMITTEE') return COMMITTEE_CRITERIA;
  if (type === 'COUNCIL') return COUNCIL_CRITERIA;
  return EXEC_CRITERIA;
}

interface MemberData {
  full_name: string;
  position: string;
  committee: string;
  council_type: string;
}

function EvaluateForm() {
  const router = useRouter();
  const routeParams = useParams();

  const assignmentId = (routeParams?.assignmentID || routeParams?.assignmentId) as string;

  const [member, setMember] = useState<MemberData | null>(null);
  const [ratings, setRatings] = useState<number[]>([]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;

    async function loadData() {
      const { data: assign, error: assignErr } = await supabase
        .from('assignments')
        .select('id, evaluator_id, council_members(full_name, position, committee, council_type)')
        .eq('id', assignmentId)
        .maybeSingle();

      if (assignErr || !assign) {
        alert('Assignment record not found or inaccessible.');
        router.push('/dashboard');
        return;
      }

      const memberData = assign.council_members as unknown as MemberData;
      setMember(memberData);

      const activeCriteria = getCriteriaList(memberData?.council_type);

      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (evalData) {
        const loadedRatings = activeCriteria.map((_, idx) => (evalData as Record<string, number>)[`q${idx + 1}_rating`] || 0);
        setRatings(loadedRatings);
        setComments(evalData.comments || '');
      } else {
        setRatings(new Array(activeCriteria.length).fill(0));
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
    const activeCriteria = getCriteriaList(member?.council_type);

    if (submissionType === 'Final') {
      if (ratings.length < activeCriteria.length || ratings.some((r) => r === 0)) {
        alert(`Please provide a rating (1–5) for all ${activeCriteria.length} criteria before final submission.`);
        return;
      }
      if (!confirm('Are you sure you want to finalize this submission? You will not be able to edit it afterward.')) {
        return;
      }
    }

    const evalPayload: Record<string, unknown> = {
      assignment_id: assignmentId,
      comments,
      submission_type: submissionType,
      updated_at: new Date().toISOString(),
    };

    activeCriteria.forEach((_, idx) => {
      evalPayload[`q${idx + 1}_rating`] = ratings[idx] || 0;
    });

    const { error: evalErr } = await supabase.from('evaluations').upsert(
      evalPayload,
      { onConflict: 'assignment_id' }
    );

    if (evalErr) {
      console.error('Supabase save error:', evalErr);
      alert(`Error saving evaluation: ${evalErr.message}`);
      return;
    }

    const newStatus = submissionType === 'Final' ? 'Submitted' : 'In Progress';
    const { error: statusErr } = await supabase
      .from('assignments')
      .update({ status: newStatus })
      .eq('id', assignmentId);

    if (statusErr) {
      console.error('Supabase status update error:', statusErr);
      alert(`Error updating status: ${statusErr.message}`);
      return;
    }

    alert(submissionType === 'Final' ? 'Evaluation submitted successfully!' : 'Draft saved.');
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">
        Loading evaluation form...
      </div>
    );
  }

  const criteriaList = getCriteriaList(member?.council_type);

  return (
    <div className="min-h-screen bg-[#FDF0D0] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="bg-[#C04A06] text-white p-6 rounded-xl shadow-md">
          <span className="text-xs uppercase tracking-wider bg-amber-200/20 px-3 py-1 rounded-full font-semibold">
            {member?.council_type} Evaluation
          </span>
          <h1 className="text-2xl font-bold mt-2">{member?.full_name}</h1>
          <p className="text-amber-100 text-sm mt-1">
            {member?.position} — {member?.committee} Committee
          </p>
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
                    <span
                      key={i}
                      className="text-[11px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-medium border border-amber-200/60"
                    >
                      • {ind}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Rating Scale (1 = Poor, 5 = Excellent)
                </label>
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
            <p className="text-xs text-gray-500 mb-3">
              Provide constructive observations, recommendations, or key achievements.
            </p>
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

export default function EvaluatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF0D0] p-8 text-center text-gray-700 font-medium">
          Loading evaluation form...
        </div>
      }
    >
      <EvaluateForm />
    </Suspense>
  );
}