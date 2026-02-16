// src/pages/applications/ApplicationDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, User, Briefcase, FileText, Star,
  Calendar, TrendingUp, MessageSquare
} from 'lucide-react';

import { applicationsApi } from '../../api/applications';
import { candidatesApi } from '../../api/candidates';
import { jdsApi } from '../../api/jds';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { ApplicationStatus } from '../../types';

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getApplication(Number(id)),
  });

  const { data: candidate } = useQuery({
    queryKey: ['candidate', application?.candidate_id],
    queryFn: () => candidatesApi.getCandidate(application!.candidate_id),
    enabled: !!application,
  });

  const { data: jd } = useQuery({
    queryKey: ['jd', application?.jd_id],
    queryFn: () => jdsApi.getJD(application!.jd_id),
    enabled: !!application,
  });

  const deleteMutation = useMutation({
    mutationFn: () => applicationsApi.deleteApplication(Number(id)),
    onSuccess: () => {
      toast.success('Application deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      navigate('/applications');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete application');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => 
      applicationsApi.updateStatus(Number(id), status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!application) {
    return <div>Application not found</div>;
  }

  const statusColors: Record<ApplicationStatus, string> = {
    sourced: 'bg-blue-100 text-blue-800',
    screened: 'bg-purple-100 text-purple-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    interviewing: 'bg-orange-100 text-orange-800',
    offered: 'bg-green-100 text-green-800',
    joined: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/applications')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Application #{application.id}</h1>
            <p className="text-muted-foreground mt-1">
              {candidate ? `${candidate.first_name} ${candidate.last_name}` : `Candidate #${application.candidate_id}`}
              {' → '}
              {jd ? jd.title : `JD #${application.jd_id}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/applications/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this application?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status]}`}>
          {application.status}
        </span>
        {application.sla_status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            application.sla_status === 'on_track' ? 'bg-green-100 text-green-800' :
            application.sla_status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            SLA: {application.sla_status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate('screened')}>
          Mark as Screened
        </Button>
        <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate('submitted')}>
          Submit to Client
        </Button>
        <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate('interviewing')}>
          Mark Interviewing
        </Button>
        <Button size="sm" variant="primary" onClick={() => updateStatusMutation.mutate('offered')}>
          Mark Offered
        </Button>
        <Button size="sm" variant="primary" onClick={() => updateStatusMutation.mutate('joined')}>
          Mark Joined
        </Button>
      </div>

      {candidate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{candidate.first_name} {candidate.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{candidate.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{candidate.phone}</p>
            </div>
            {candidate.total_experience !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium">{candidate.total_experience} years</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {jd && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="font-medium">{jd.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">JD Code</p>
              <p className="font-medium">{jd.jd_code}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {application.internal_rating && (
            <div>
              <p className="text-sm text-muted-foreground">Internal Rating</p>
              <div className="flex gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < application.internal_rating!
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(application.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {application.screening_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Screening Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{application.screening_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}