// src/pages/applications/ApplicationFormPage.tsx
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

import { applicationsApi, type CreateApplicationData } from '../../api/applications';
import { candidatesApi } from '../../api/candidates';
import { jdsApi } from '../../api/jds';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

// Validation schema
const applicationSchema = z.object({
  candidate_id: z.number({ required_error: 'Candidate is required' }),
  jd_id: z.number({ required_error: 'Job Description is required' }),
  status: z.enum(['sourced', 'screened', 'submitted', 'interviewing', 'offered', 'joined', 'rejected', 'withdrawn'] as const),
  screening_notes: z.string().optional(),
  internal_rating: z.number().min(1).max(5).optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export function ApplicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // Fetch candidates
  const { data: candidatesData } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidatesApi.getCandidates({ page_size: 100 }),
  });

  // Fetch JDs
  const { data: jdsData } = useQuery({
    queryKey: ['jds'],
    queryFn: () => jdsApi.getJDs({ page_size: 100 }),
  });

  // Fetch application if editing
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getApplication(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      status: 'sourced',
    },
  });

  const internalRating = watch('internal_rating');

  useEffect(() => {
    if (application) {
      reset({
        candidate_id: application.candidate_id,
        jd_id: application.jd_id,
        status: application.status,
        screening_notes: application.screening_notes || '',
        internal_rating: application.internal_rating || undefined,
      });
    }
  }, [application, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateApplicationData) => applicationsApi.createApplication(data),
    onSuccess: () => {
      toast.success('Application created successfully');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      navigate('/applications');
    },
    onError: (error: any) => {
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          detail.forEach((err: any) => {
            toast.error(`${err.loc?.join(' > ')}: ${err.msg}`);
          });
        } else {
          toast.error(detail || 'Validation failed');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create application');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateApplicationData) => applicationsApi.updateApplication(Number(id), data),
    onSuccess: () => {
      toast.success('Application updated successfully');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      navigate(`/applications/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update application');
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    const payload: CreateApplicationData = {
      ...data,
      screening_notes: data.screening_notes || undefined,
      internal_rating: data.internal_rating || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingApplication) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Application' : 'New Application'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update application details' : 'Add a candidate to a job opening'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Candidate *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('candidate_id', { valueAsNumber: true })}
              >
                <option value="">Select a candidate</option>
                {candidatesData?.candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.first_name} {candidate.last_name} - {candidate.email}
                  </option>
                ))}
              </select>
              {errors.candidate_id && (
                <p className="mt-1.5 text-sm text-destructive">{errors.candidate_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Job Description *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('jd_id', { valueAsNumber: true })}
              >
                <option value="">Select a job description</option>
                {jdsData?.job_descriptions.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.title} - {jd.jd_code}
                  </option>
                ))}
              </select>
              {errors.jd_id && (
                <p className="mt-1.5 text-sm text-destructive">{errors.jd_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Status *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="sourced">Sourced</option>
                <option value="screened">Screened</option>
                <option value="submitted">Submitted to Client</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="joined">Joined</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Internal Rating (1-5)
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="Rate 1-5"
                  error={errors.internal_rating?.message}
                  {...register('internal_rating', { valueAsNumber: true })}
                />
                {internalRating && (
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xl ${
                          i < internalRating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Screening Notes
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Add notes about screening, interviews, etc..."
                {...register('screening_notes')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/applications')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Application' : 'Create Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}