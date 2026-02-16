// src/pages/interviews/InterviewDetailPage.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, Calendar, Clock, User, Video, Phone, Users,
  MessageSquare, Star, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

import { interviewsApi } from '../../api/interviews';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { InterviewStatus, InterviewResult } from '../../types';

export function InterviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [result, setResult] = useState<InterviewResult>('pending');

  const { data: interview, isLoading } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewsApi.getInterview(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => interviewsApi.deleteInterview(Number(id)),
    onSuccess: () => {
      toast.success('Interview deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      navigate('/interviews');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete interview');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: InterviewStatus) => 
      interviewsApi.updateStatus(Number(id), status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: () => 
      interviewsApi.submitFeedback(Number(id), feedback, rating, result),
    onSuccess: () => {
      toast.success('Feedback submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setShowFeedbackForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit feedback');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!interview) {
    return <div>Interview not found</div>;
  }

  const statusColors: Record<InterviewStatus, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800',
    rescheduled: 'bg-purple-100 text-purple-800',
  };

  const resultColors: Record<InterviewResult, string> = {
    pending: 'bg-gray-100 text-gray-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
  };

  const modeIcons = {
    video: Video,
    phone: Phone,
    in_person: Users,
  };

  const ModeIcon = modeIcons[interview.interview_mode] ?? Users;

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/interviews')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ModeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{interview.round_name}</h1>
                <p className="text-muted-foreground">
                  Round {interview.round_number} • Application #{interview.application_id}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/interviews/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this interview?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status & Result Badges */}
      <div className="flex gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[interview.status]}`}>
          {interview.status}
        </span>
        {interview.result && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${resultColors[interview.result]}`}>
            {interview.result}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        {interview.status === 'scheduled' && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => updateStatusMutation.mutate('completed')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Completed
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateStatusMutation.mutate('cancelled')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateStatusMutation.mutate('no_show')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Mark No Show
            </Button>
          </>
        )}
        {interview.status === 'completed' && !interview.feedback && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowFeedbackForm(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        )}
      </div>

      {/* Interview Details */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Date</p>
              <p className="font-medium">{formatDateTime(interview.scheduled_date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{interview.duration_minutes} minutes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ModeIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Interview Mode</p>
              <p className="font-medium capitalize">{interview.interview_mode.replace('_', ' ')}</p>
            </div>
          </div>

          {interview.interviewer_name && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Interviewer</p>
                <p className="font-medium">{interview.interviewer_name}</p>
                {interview.interviewer_email && (
                  <p className="text-sm text-muted-foreground">{interview.interviewer_email}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Link */}
      {interview.meeting_link && (
        <Card>
          <CardHeader>
            <CardTitle>Meeting Link</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={interview.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {interview.meeting_link}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Rating */}
      {interview.rating !== null && interview.rating !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < interview.rating!
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-lg font-semibold ml-2">{interview.rating}/5</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {interview.feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{interview.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Form */}
      {showFeedbackForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Result
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as InterviewResult)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            {/* Feedback Text */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Provide detailed feedback about the candidate's performance..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => feedbackMutation.mutate()}
                isLoading={feedbackMutation.isPending}
                disabled={feedbackMutation.isPending || !feedback}
              >
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
