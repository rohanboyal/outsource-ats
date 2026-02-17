// src/pages/pitches/PitchFormPage.tsx
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { pitchesApi, type CreatePitchData } from '../../api/pitches';
import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const pitchSchema = z.object({
  client_id: z.number({ required_error: 'Client is required' }),
  pitch_title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  expected_headcount: z.number().min(1).optional().or(z.literal(0)),
  notes: z.string().optional().or(z.literal('')),
});

type PitchFormData = z.infer<typeof pitchSchema>;

export function PitchFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients({ page_size: 100 }),
  });

  const { data: pitch, isLoading: isLoadingPitch } = useQuery({
    queryKey: ['pitch', id],
    queryFn: () => pitchesApi.getPitch(Number(id)),
    enabled: isEdit,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PitchFormData>({
    resolver: zodResolver(pitchSchema),
  });

  useEffect(() => {
    if (pitch) {
      reset({
        client_id: pitch.client_id,
        pitch_title: pitch.pitch_title,
        description: pitch.description ?? '',
        expected_headcount: pitch.expected_headcount ?? 0,
        notes: pitch.notes ?? '',
      });
    }
  }, [pitch, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePitchData) => pitchesApi.createPitch(data),
    onSuccess: () => {
      toast.success('Pitch created successfully');
      queryClient.invalidateQueries({ queryKey: ['pitches'] });
      navigate('/pitches');
    },
    onError: (error: any) => {
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          detail.forEach((err: any) => toast.error(`${err.loc?.join(' > ')}: ${err.msg}`));
        } else {
          toast.error(detail || 'Validation failed');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create pitch');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreatePitchData) => pitchesApi.updatePitch(Number(id), data),
    onSuccess: () => {
      toast.success('Pitch updated successfully');
      queryClient.invalidateQueries({ queryKey: ['pitches'] });
      navigate(`/pitches/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update pitch');
    },
  });

  const onSubmit = (data: PitchFormData) => {
    const payload: CreatePitchData = {
      client_id: data.client_id,
      pitch_title: data.pitch_title,
      description: data.description || undefined,
      expected_headcount: data.expected_headcount && data.expected_headcount > 0 ? data.expected_headcount : undefined,
      notes: data.notes || undefined,
      status: 'draft',
    };

    console.log('Submitting payload:', payload);
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingPitch) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pitches')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Pitch' : 'New Pitch'}</h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update pitch details' : 'Create a new business pitch'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pitch Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Client *
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('client_id', { valueAsNumber: true })}
              >
                <option value="">Select a client</option>
                {clientsData?.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1.5 text-sm text-destructive">{errors.client_id.message}</p>
              )}
            </div>

            <Input
              label="Pitch Title *"
              placeholder="Q1 2024 Staffing Proposal"
              error={errors.pitch_title?.message}
              {...register('pitch_title')}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Description
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe the pitch, roles, requirements..."
                {...register('description')}
              />
            </div>

            <Input
              label="Expected Headcount"
              type="number"
              placeholder="10"
              error={errors.expected_headcount?.message}
              {...register('expected_headcount', { valueAsNumber: true })}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Notes
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Additional notes..."
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/pitches')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Pitch' : 'Create Pitch'}
          </Button>
        </div>
      </form>
    </div>
  );
}
