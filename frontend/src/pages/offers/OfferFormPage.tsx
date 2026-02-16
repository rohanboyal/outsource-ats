// src/pages/offers/OfferFormPage.tsx - FINAL CORRECT
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

import { offersApi, type CreateOfferData } from '../../api/offers';
import { applicationsApi } from '../../api/applications';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const offerSchema = z.object({
  application_id: z.number({ required_error: 'Application is required' }),
  designation: z.string().min(1, 'Designation is required'),
  annual_ctc: z.number().min(0, 'Annual CTC is required'),
  base_salary: z.number().min(0).optional().or(z.literal(0)),
  variable_pay: z.number().min(0).optional().or(z.literal(0)),
  bonus: z.number().min(0).optional().or(z.literal(0)),
  joining_date: z.string().optional().or(z.literal('')),
  offer_valid_till: z.string().optional().or(z.literal('')),
  work_location: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
});

type OfferFormData = z.infer<typeof offerSchema>;

export function OfferFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: applicationsData } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getApplications({ page_size: 100 }),
  });

  const { data: offer, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => offersApi.getOffer(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      base_salary: 0,
      variable_pay: 0,
      bonus: 0,
    },
  });

  useEffect(() => {
    if (offer) {
      reset({
        application_id: offer.application_id,
        designation: offer.designation,
        annual_ctc: offer.ctc_annual,
        base_salary: offer.base_salary || 0,
        variable_pay: offer.variable_pay || 0,
        bonus: offer.bonus || 0,
        joining_date: offer.joining_date || '',
        offer_valid_till: offer.offer_valid_till || '',
        work_location: offer.work_location || '',
        remarks: offer.remarks || '',
      });
    }
  }, [offer, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateOfferData) => offersApi.createOffer(data),
    onSuccess: () => {
      toast.success('Offer created successfully');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      navigate('/offers');
    },
    onError: (error: any) => {
      console.error('Create error:', error);
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
        toast.error(error.response?.data?.detail || 'Failed to create offer');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateOfferData) => offersApi.updateOffer(Number(id), data),
    onSuccess: () => {
      toast.success('Offer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      navigate(`/offers/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update offer');
    },
  });

  const onSubmit = (data: OfferFormData) => {
    const payload: CreateOfferData = {
      application_id: data.application_id,
      designation: data.designation,
      annual_ctc: data.annual_ctc,
      base_salary: data.base_salary && data.base_salary > 0 ? data.base_salary : undefined,
      variable_pay: data.variable_pay && data.variable_pay > 0 ? data.variable_pay : undefined,
      bonus: data.bonus && data.bonus > 0 ? data.bonus : undefined,
      joining_date: data.joining_date || undefined,
      offer_valid_till: data.offer_valid_till || undefined,
      work_location: data.work_location || undefined,
      remarks: data.remarks || undefined,
    };

    console.log('Submitting payload:', payload);

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingOffer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/offers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Offer' : 'Create Offer'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update offer details' : 'Create a new job offer'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    Application #{app.id} - Candidate {app.candidate_id}
                  </option>
                ))}
              </select>
              {errors.application_id && (
                <p className="mt-1.5 text-sm text-destructive">{errors.application_id.message}</p>
              )}
            </div>

            <Input
              label="Designation *"
              placeholder="Senior Software Engineer"
              error={errors.designation?.message}
              {...register('designation')}
            />

            <Input
              label="Work Location"
              placeholder="Mumbai, India"
              error={errors.work_location?.message}
              {...register('work_location')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Annual CTC *"
              type="number"
              placeholder="1500000"
              error={errors.annual_ctc?.message}
              {...register('annual_ctc', { valueAsNumber: true })}
            />

            <div className="grid gap-6 sm:grid-cols-3">
              <Input
                label="Base Salary"
                type="number"
                placeholder="1200000"
                error={errors.base_salary?.message}
                {...register('base_salary', { valueAsNumber: true })}
              />
              <Input
                label="Variable Pay"
                type="number"
                placeholder="200000"
                error={errors.variable_pay?.message}
                {...register('variable_pay', { valueAsNumber: true })}
              />
              <Input
                label="Bonus"
                type="number"
                placeholder="100000"
                error={errors.bonus?.message}
                {...register('bonus', { valueAsNumber: true })}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Joining Date"
                type="date"
                error={errors.joining_date?.message}
                {...register('joining_date')}
              />
              <Input
                label="Offer Valid Till"
                type="date"
                error={errors.offer_valid_till?.message}
                {...register('offer_valid_till')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Remarks
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Additional notes..."
                {...register('remarks')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/offers')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Offer' : 'Create Offer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
