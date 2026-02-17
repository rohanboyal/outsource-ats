// src/pages/pitches/PitchDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import { pitchesApi } from '../../api/pitches';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { PitchStatus } from '../../types';

export function PitchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pitch, isLoading } = useQuery({
    queryKey: ['pitch', id],
    queryFn: () => pitchesApi.getPitch(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => pitchesApi.deletePitch(Number(id)),
    onSuccess: () => {
      toast.success('Pitch deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['pitches'] });
      navigate('/pitches');
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => pitchesApi.sendPitch(Number(id)),
    onSuccess: () => {
      toast.success('Pitch sent successfully');
      queryClient.invalidateQueries({ queryKey: ['pitch', id] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => pitchesApi.approvePitch(Number(id)),
    onSuccess: () => {
      toast.success('Pitch approved');
      queryClient.invalidateQueries({ queryKey: ['pitch', id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => pitchesApi.rejectPitch(Number(id), reason),
    onSuccess: () => {
      toast.success('Pitch rejected');
      queryClient.invalidateQueries({ queryKey: ['pitch', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pitch) return <div>Pitch not found</div>;

  const statusColors: Record<PitchStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
  };

  const handleReject = () => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate(reason);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pitches')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{pitch.pitch_title}</h1>
            <p className="text-muted-foreground">Pitch #{pitch.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {pitch.status === 'draft' && (
            <Button variant="outline" onClick={() => navigate(`/pitches/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </Button>
          )}
          {pitch.status === 'draft' && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Delete this pitch?')) deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
          )}
        </div>
      </div>

      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[pitch.status]}`}>
        {pitch.status}
      </span>

      <div className="flex gap-2">
        {pitch.status === 'draft' && (
          <Button onClick={() => sendMutation.mutate()}>
            <Send className="h-4 w-4 mr-2" />Send to Client
          </Button>
        )}
        {pitch.status === 'sent' && (
          <>
            <Button onClick={() => approveMutation.mutate()}>
              <CheckCircle className="h-4 w-4 mr-2" />Approve
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />Reject
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pitch Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pitch.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="whitespace-pre-wrap">{pitch.description}</p>
            </div>
          )}

          {pitch.expected_headcount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Headcount</span>
              <span className="font-medium">{pitch.expected_headcount} positions</span>
            </div>
          )}

          {pitch.sent_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sent Date</span>
              <span className="font-medium">
                {new Date(pitch.sent_date).toLocaleDateString()}
              </span>
            </div>
          )}

          {pitch.decision_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Decision Date</span>
              <span className="font-medium">
                {new Date(pitch.decision_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {(pitch.notes || pitch.rejection_reason) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pitch.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="whitespace-pre-wrap">{pitch.notes}</p>
              </div>
            )}
            {pitch.rejection_reason && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                <p className="whitespace-pre-wrap text-red-600">{pitch.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
