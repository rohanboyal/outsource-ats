// src/pages/jds/JDDetailPage.tsx - FULLY CORRECTED
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, Building2, MapPin, Briefcase,
  DollarSign, Award, Users, Calendar, TrendingUp, FileText
} from 'lucide-react';

import { jdsApi } from '../../api/jds';
import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import type { JDStatus, ContractType } from '../../types';

export function JDDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: jd, isLoading } = useQuery({
    queryKey: ['jd', id],
    queryFn: () => jdsApi.getJD(Number(id)),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients({ page_size: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => jdsApi.deleteJD(Number(id)),
    onSuccess: () => {
      toast.success('Job description deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['jds'] });
      navigate('/jds');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete job description');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: JDStatus) => 
      jdsApi.updateStatus(Number(id), status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['jd', id] });
      queryClient.invalidateQueries({ queryKey: ['jds'] });
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

  if (!jd) {
    return <div>Job description not found</div>;
  }

  const client = clientsData?.clients.find(c => c.id === jd.client_id);

  const statusColors: Record<JDStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    open: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const contractTypeLabels: Record<ContractType, string> = {
    full_time: 'Full Time',
    contract: 'Contract',
    part_time: 'Part Time',
    temp_to_perm: 'Temp to Perm',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/jds')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{jd.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[jd.status]}`}>
                {jd.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[jd.priority]}`}>
                {jd.priority}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              {client && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {client.company_name}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {jd.jd_code}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/jds/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this job description?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={jd.status === 'open' ? 'outline' : 'primary'}
          onClick={() => updateStatusMutation.mutate('open')}
          disabled={jd.status === 'open'}
        >
          Mark as Open
        </Button>
        <Button
          size="sm"
          variant={jd.status === 'on_hold' ? 'outline' : 'secondary'}
          onClick={() => updateStatusMutation.mutate('on_hold')}
          disabled={jd.status === 'on_hold'}
        >
          Put On Hold
        </Button>
        <Button
          size="sm"
          variant={jd.status === 'closed' ? 'outline' : 'destructive'}
          onClick={() => updateStatusMutation.mutate('closed')}
          disabled={jd.status === 'closed'}
        >
          Close JD
        </Button>
      </div>

      {/* Statistics (if available) */}
      {(jd.total_applications || jd.active_applications || jd.positions_filled) && (
        <div className="grid gap-4 md:grid-cols-4">
          {jd.total_applications !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{jd.total_applications}</div>
                <p className="text-xs text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
          )}
          {jd.active_applications !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{jd.active_applications}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
          )}
          {jd.submitted_applications !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{jd.submitted_applications}</div>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </CardContent>
            </Card>
          )}
          {jd.positions_filled !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{jd.positions_filled || jd.filled_positions}</div>
                <p className="text-xs text-muted-foreground">Positions Filled</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {jd.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{jd.location}</p>
                {jd.work_mode && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted mt-1 inline-block">
                    {jd.work_mode}
                  </span>
                )}
              </div>
            </div>
          )}

          {jd.experience_min !== null && jd.experience_max !== null && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="font-medium">{jd.experience_min} - {jd.experience_max} years</p>
              </div>
            </div>
          )}

          {jd.contract_type && (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Contract Type</p>
                <p className="font-medium">{contractTypeLabels[jd.contract_type]}</p>
              </div>
            </div>
          )}

          {jd.open_positions && (
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="font-medium">
                  {jd.open_positions}
                  {jd.filled_positions > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({jd.filled_positions} filled)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {jd.sla_days && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">SLA</p>
                <p className="font-medium">{jd.sla_days} days</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compensation */}
      {jd.budget_min && jd.budget_max && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(jd.budget_min, jd.currency || 'USD')} - {formatCurrency(jd.budget_max, jd.currency || 'USD')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Annual Budget</p>
          </CardContent>
        </Card>
      )}

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{jd.description}</p>
        </CardContent>
      </Card>

      {/* Required Skills */}
      {jd.required_skills && jd.required_skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Required Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {jd.required_skills.map((skill, index) => (
                <span
                  key={`required-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferred Skills */}
      {jd.preferred_skills && jd.preferred_skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Preferred Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {jd.preferred_skills.map((skill, index) => (
                <span
                  key={`preferred-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      {jd.benefits && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{jd.benefits}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}