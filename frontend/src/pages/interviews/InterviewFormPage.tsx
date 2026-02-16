// src/pages/interviews/InterviewFormPage.tsx
import { useEffect, } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save,  } from 'lucide-react';

import { interviewsApi, type CreateInterviewData } from '../../api/interviews';
import { applicationsApi } from '../../api/applications';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

// Validation schema
const interviewSchema = z.object({
  application_id: z.number({ required_error: 'Application is required' }),
  round_number: z.number().min(1, 'Round number is required'),
  round_name: z.string().min(1, 'Round name is required'),
  scheduled_date: z.string().optional(),
  duration_minutes: z.number().min(15, 'Duration must be at least 15 minutes'),
  interviewer_name: z.string().optional(),
  interviewer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  interview_mode: z.enum(['video', 'phone', 'in_person'] as const),
  meeting_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'] as const).optional(),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

export function InterviewFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // Fetch applications for dropdown
  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications({ page_size: 100 }),
  });

  // Fetch interview if editing
  const { data: interview, isLoading: isLoadingInterview } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => interviewsApi.getInterview(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      round_number: 1,
      duration_minutes: 60,
      interview_mode: 'video',
      status: 'scheduled',
    },
  });

  const interviewMode = watch('interview_mode');

  // Populate form when editing
  useEffect(() => {
    if (interview) {
      reset({
        application_id: interview.application_id,
        round_number: interview.round_number,
        round_name: interview.round_name,
        scheduled_date: interview.scheduled_date || '',
        duration_minutes: interview.duration_minutes,
        interviewer_name: interview.interviewer_name || '',
        interviewer_email: interview.interviewer_email || '',
        interview_mode: interview.interview_mode,
        meeting_link: interview.meeting_link || '',
        status: interview.status,
      });
    }
  }, [interview, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInterviewData) => interviewsApi.createInterview(data),
    onSuccess: () => {
      toast.success('Interview scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      navigate('/interviews');
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          detail.forEach((err: any) => {
            toast.error(`${err.loc?.join(' > ')}: ${err.msg}`);
          });
        } else if (typeof detail === 'string') {
          toast.error(detail);
        } else {
          toast.error('Validation failed. Please check your inputs.');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Failed to schedule interview');
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateInterviewData) => interviewsApi.updateInterview(Number(id), data),
    onSuccess: () => {
      toast.success('Interview updated successfully');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interview', id] });
      navigate(`/interviews/${id}`);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          detail.forEach((err: any) => {
            toast.error(`${err.loc?.join(' > ')}: ${err.msg}`);
          });
        } else if (typeof detail === 'string') {
          toast.error(detail);
        } else {
          toast.error('Validation failed. Please check your inputs.');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update interview');
      }
    },
  });

  const onSubmit = (data: InterviewFormData) => {
    const payload: CreateInterviewData = {
      ...data,
      scheduled_date: data.scheduled_date || undefined,
      interviewer_name: data.interviewer_name || undefined,
      interviewer_email: data.interviewer_email || undefined,
      meeting_link: data.meeting_link || undefined,
    };

    console.log('Submitting payload:', payload);

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingInterview) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/interviews')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Interview' : 'Schedule Interview'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update interview details' : 'Schedule a new interview round'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Application Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Application *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('application_id', { valueAsNumber: true })}
              >
                <option value="">Select an application</option>
                {applicationsData?.applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    Application #{app.id} - Candidate {app.candidate_id} (JD {app.jd_id})
                  </option>
                ))}
              </select>
              {errors.application_id && (
                <p className="mt-1.5 text-sm text-destructive">{errors.application_id.message}</p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Round Number *"
                type="number"
                placeholder="1"
                error={errors.round_number?.message}
                {...register('round_number', { valueAsNumber: true })}
              />
              <Input
                label="Round Name *"
                placeholder="Technical Round, HR Round, etc."
                error={errors.round_name?.message}
                {...register('round_name')}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Scheduled Date & Time"
                type="datetime-local"
                error={errors.scheduled_date?.message}
                {...register('scheduled_date')}
              />
              <Input
                label="Duration (minutes) *"
                type="number"
                placeholder="60"
                error={errors.duration_minutes?.message}
                {...register('duration_minutes', { valueAsNumber: true })}
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Status
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('status')}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interviewer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Interviewer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Interviewer Name"
                placeholder="John Doe"
                error={errors.interviewer_name?.message}
                {...register('interviewer_name')}
              />
              <Input
                label="Interviewer Email"
                type="email"
                placeholder="john.doe@company.com"
                error={errors.interviewer_email?.message}
                {...register('interviewer_email')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interview Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Mode *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('interview_mode')}
              >
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
                <option value="in_person">In-Person</option>
              </select>
            </div>

            {(interviewMode === 'video' || interviewMode === 'phone') && (
              <Input
                label="Meeting Link"
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                error={errors.meeting_link?.message}
                {...register('meeting_link')}
              />
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/interviews')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Interview' : 'Schedule Interview'}
          </Button>
        </div>
      </form>
    </div>
  );
}
