// src/pages/joinings/JoiningFormPage.tsx - ALL TYPESCRIPT ERRORS FIXED
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { joiningsApi, type CreateJoiningData } from '../../api/joinings';
import { applicationsApi } from '../../api/applications';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const joiningSchema = z.object({
  application_id: z.number({ required_error: 'Application is required' }),
  expected_joining_date: z.string().min(1, 'Expected joining date is required'),
  actual_joining_date: z.string().optional().or(z.literal('')),
  employee_id: z.string().optional().or(z.literal('')),
  bgv_status: z.string().optional().or(z.literal('')),
  bgv_completion_date: z.string().optional().or(z.literal('')),
  replacement_reason: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
  status: z.enum(['confirmed', 'no_show', 'delayed', 'replacement_required'] as const).optional(),
});

type JoiningFormData = z.infer<typeof joiningSchema>;

export function JoiningFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications({ page_size: 100, status: 'offered' }),
  });

  const { data: joining, isLoading: isLoadingJoining } = useQuery({
    queryKey: ['joining', id],
    queryFn: () => joiningsApi.getJoining(Number(id)),
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<JoiningFormData>({
    resolver: zodResolver(joiningSchema),
    defaultValues: { status: 'confirmed' },
  });

  // ✅ FIXED: Use nullish coalescing and safe type conversion
  useEffect(() => {
    if (joining) {
      reset({
        application_id: joining.application_id,
        expected_joining_date: joining.expected_joining_date ? String(joining.expected_joining_date) : '',
        actual_joining_date: joining.actual_joining_date ? String(joining.actual_joining_date) : '',
        employee_id: joining.employee_id ?? '',
        bgv_status: joining.bgv_status ?? '',
        bgv_completion_date: joining.bgv_completion_date ? String(joining.bgv_completion_date) : '',
        replacement_reason: joining.replacement_reason ?? '',
        remarks: joining.remarks ?? '',
        status: joining.status,
      });
    }
  }, [joining, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateJoiningData) => joiningsApi.createJoining(data),
    onSuccess: () => {
      toast.success('Joining created successfully');
      queryClient.invalidateQueries({ queryKey: ['joinings'] });
      navigate('/joinings');
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          detail.forEach((err: any) => toast.error(`${err.loc?.join(' > ')}: ${err.msg}`));
        } else {
          toast.error(detail || 'Validation failed');
        }
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.detail || 'Bad request');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create joining');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateJoiningData) => joiningsApi.updateJoining(Number(id), data),
    onSuccess: () => {
      toast.success('Joining updated successfully');
      queryClient.invalidateQueries({ queryKey: ['joinings'] });
      navigate(`/joinings/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update joining');
    },
  });

  const onSubmit = (data: JoiningFormData) => {
    const payload: CreateJoiningData = {
      application_id: data.application_id,
      expected_joining_date: data.expected_joining_date,
      actual_joining_date: data.actual_joining_date || undefined,
      employee_id: data.employee_id || undefined,
      bgv_status: data.bgv_status || undefined,
      bgv_completion_date: data.bgv_completion_date || undefined,
      replacement_reason: data.replacement_reason || undefined,
      remarks: data.remarks || undefined,
      status: data.status || 'confirmed',
    };
    
    console.log('Submitting payload:', payload);
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingJoining) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/joinings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Joining' : 'New Joining'}</h1>
          <p className="text-muted-foreground mt-1">{isEdit ? 'Update joining details' : 'Create a new joining record'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Joining Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Application * (Must have accepted offer)
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('application_id', { valueAsNumber: true })}
              >
                <option value="">Select application</option>
                {applicationsData?.applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    Application #{app.id} - Candidate {app.candidate_id}
                  </option>
                ))}
              </select>
              {errors.application_id && <p className="mt-1.5 text-sm text-destructive">{errors.application_id.message}</p>}
            </div>

            <Input label="Expected Joining Date *" type="date" error={errors.expected_joining_date?.message} {...register('expected_joining_date')} />
            <Input label="Actual Joining Date" type="date" error={errors.actual_joining_date?.message} {...register('actual_joining_date')} />
            <Input label="Employee ID" placeholder="EMP001" error={errors.employee_id?.message} {...register('employee_id')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>BGV & Onboarding</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <Input label="BGV Status" placeholder="Pending/Completed" error={errors.bgv_status?.message} {...register('bgv_status')} />
            <Input label="BGV Completion Date" type="date" error={errors.bgv_completion_date?.message} {...register('bgv_completion_date')} />
            
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('status')}>
                  <option value="confirmed">Confirmed</option>
                  <option value="no_show">No Show</option>
                  <option value="delayed">Delayed</option>
                  <option value="replacement_required">Replacement Required</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Replacement Reason</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="If replacement needed..." {...register('replacement_reason')} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Remarks</label>
              <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Additional notes..." {...register('remarks')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/joinings')} disabled={isLoading}>Cancel</Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />{isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}