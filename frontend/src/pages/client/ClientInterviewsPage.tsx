import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientPortalApi } from '../../api/clientPortal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, Video, Phone, MapPin } from 'lucide-react';

const modeIcons: Record<string, any> = {
  video: Video,
  phone: Phone,
  in_person: MapPin,
};

const resultColors: Record<string, string> = {
  selected: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  on_hold: 'bg-amber-100 text-amber-800',
  pending: 'bg-gray-100 text-gray-700',
};

function InterviewFeedbackModal({ interviewId, candidateName, onClose }: {
  interviewId: number; candidateName: string; onClose: () => void;
}) {
  const [result, setResult] = useState<'selected' | 'rejected' | 'on_hold'>('selected');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => clientPortalApi.submitInterviewFeedback(interviewId, { feedback, rating: rating || undefined, result }),
    onSuccess: () => {
      toast.success('Interview feedback submitted!');
      queryClient.invalidateQueries({ queryKey: ['client-interviews'] });
      onClose();
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-1">Interview Feedback</h3>
        <p className="text-sm text-gray-500 mb-5">{candidateName}</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {(['selected', 'on_hold', 'rejected'] as const).map((r) => (
            <button key={r} onClick={() => setResult(r)}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                result === r
                  ? r === 'selected' ? 'border-green-500 bg-green-50 text-green-700'
                    : r === 'rejected' ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {r === 'selected' ? '✅ Selected' : r === 'rejected' ? '❌ Rejected' : '⏸ On Hold'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((n) => (
                <button key={n} onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${rating >= n ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback *</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your interview feedback..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!feedback || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientInterviewsPage() {
  const [feedbackModal, setFeedbackModal] = useState<{ id: number; name: string } | null>(null);

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['client-interviews'],
    queryFn: clientPortalApi.getInterviews,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <p className="text-gray-500 mt-1">View scheduled interviews and submit feedback.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="space-y-3">
        {interviews?.map((interview) => {
          const ModeIcon = modeIcons[interview.interview_mode] || Video;
          return (
            <div key={interview.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 rounded-xl p-2.5">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{interview.candidate_name}</h3>
                    <p className="text-sm text-gray-500">{interview.round_name} • {interview.jd_title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ModeIcon className="h-3.5 w-3.5" />
                        <span>{interview.interview_mode.replace('_', ' ')}</span>
                      </div>
                      {interview.scheduled_date && (
                        <span className="text-xs text-gray-500">
                          {new Date(interview.scheduled_date).toLocaleDateString()} at {new Date(interview.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {interview.result && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultColors[interview.result] || 'bg-gray-100'}`}>
                          {interview.result.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {interview.meeting_link && (
                    <a href={interview.meeting_link} target="_blank" rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100">
                      Join Meeting
                    </a>
                  )}
                  {interview.status === 'completed' && !interview.result && (
                    <button
                      onClick={() => setFeedbackModal({ id: interview.id, name: interview.candidate_name })}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                    >
                      Add Feedback
                    </button>
                  )}
                </div>
              </div>

              {interview.feedback && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Feedback</p>
                  <p className="text-sm text-gray-700">{interview.feedback}</p>
                </div>
              )}
            </div>
          );
        })}

        {!isLoading && interviews?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700">No interviews scheduled</h3>
          </div>
        )}
      </div>

      {feedbackModal && (
        <InterviewFeedbackModal
          interviewId={feedbackModal.id}
          candidateName={feedbackModal.name}
          onClose={() => setFeedbackModal(null)}
        />
      )}
    </div>
  );
}