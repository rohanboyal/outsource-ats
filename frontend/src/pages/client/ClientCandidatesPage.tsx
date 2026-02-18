// src/pages/client/ClientCandidatesPage.tsx - FIXED IMPORTS
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientPortalApi } from '../../api/clientPortal';
import { toast } from 'sonner';
import { User, ChevronDown, ChevronUp, Download, Filter } from 'lucide-react';

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-green-100 text-green-800',
  joined: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

function FeedbackModal({ applicationId, candidateName, onClose }: {
  applicationId: number; candidateName: string; onClose: () => void;
}) {
  const [decision, setDecision] = useState<'approve' | 'reject' | 'hold'>('approve');
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => clientPortalApi.submitCandidateFeedback(applicationId, { feedback, decision, notes }),
    onSuccess: () => {
      toast.success(`Candidate ${decision}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['client-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard'] });
      onClose();
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Candidate Feedback</h3>
        <p className="text-sm text-gray-500 mb-5">{candidateName}</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {(['approve', 'hold', 'reject'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDecision(d)}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                decision === d
                  ? d === 'approve' ? 'border-green-500 bg-green-50 text-green-700'
                    : d === 'reject' ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {d === 'approve' ? '✅ Approve' : d === 'reject' ? '❌ Reject' : '⏸ Hold'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback *</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your thoughts about this candidate..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!feedback || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientCandidatesPage() {
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ id: number; name: string } | null>(null);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['client-candidates', filterStatus],
    queryFn: () => clientPortalApi.getCandidates({ status: filterStatus || undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="text-gray-500 mt-1">Review and provide feedback on submitted candidates.</p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="submitted">Pending Review</option>
          <option value="interviewing">In Interviews</option>
          <option value="offered">Offered</option>
          <option value="joined">Joined</option>
          <option value="rejected">Rejected</option>
        </select>
        {candidates && <span className="text-sm text-gray-500">{candidates.length} candidates</span>}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="space-y-3">
        {candidates?.map((c) => (
          <div key={c.application_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 rounded-full p-2.5">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.candidate_name}</h3>
                    <p className="text-sm text-gray-500">{c.current_designation || 'N/A'} {c.current_company ? `at ${c.current_company}` : ''}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.application_status] || 'bg-gray-100 text-gray-700'}`}>
                        {c.application_status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">For: {c.jd_title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {c.resume_path && (
                    <a href={c.resume_path} target="_blank" rel="noreferrer"
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Download Resume"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  {c.application_status === 'submitted' && (
                    <button
                      onClick={() => setFeedbackModal({ id: c.application_id, name: c.candidate_name })}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Give Feedback
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expandedId === c.application_id ? null : c.application_id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
                  >
                    {expandedId === c.application_id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {expandedId === c.application_id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Experience</p>
                    <p className="font-medium">{c.total_experience ? `${c.total_experience} years` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Notice Period</p>
                    <p className="font-medium">{c.notice_period_days ? `${c.notice_period_days} days` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Current CTC</p>
                    <p className="font-medium">{c.current_ctc ? `₹${c.current_ctc.toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Expected CTC</p>
                    <p className="font-medium">{c.expected_ctc ? `₹${c.expected_ctc.toLocaleString()}` : 'N/A'}</p>
                  </div>
                </div>
                {c.skills && c.skills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <span key={s} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {c.client_feedback && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Your Previous Feedback</p>
                    <p className="text-sm text-gray-700">{c.client_feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {!isLoading && candidates?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700">No candidates yet</h3>
            <p className="text-gray-400 text-sm mt-1">Candidates submitted by your recruiter will appear here.</p>
          </div>
        )}
      </div>

      {feedbackModal && (
        <FeedbackModal
          applicationId={feedbackModal.id}
          candidateName={feedbackModal.name}
          onClose={() => setFeedbackModal(null)}
        />
      )}
    </div>
  );
}