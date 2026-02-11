// src/pages/clients/ClientFormPage.tsx
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

import { clientsApi, type CreateClientData } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

// Validation schema
const clientSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'on_hold']),
  default_sla_days: z.number().min(1).optional(),
  billing_address: z.string().optional(),
  payment_terms: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // Fetch client if editing
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getClient(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'active',
      default_sla_days: 7,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (client) {
      reset({
        company_name: client.company_name,
        industry: client.industry || '',
        company_size: client.company_size || '',
        website: client.website || '',
        status: client.status,
        default_sla_days: client.default_sla_days || 7,
        billing_address: client.billing_address || '',
        payment_terms: client.payment_terms || '',
      });
    }
  }, [client, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientsApi.createClient(data),
    onSuccess: () => {
      toast.success('Client created successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create client');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientsApi.updateClient(Number(id), data),
    onSuccess: () => {
      toast.success('Client updated successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      navigate(`/clients/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update client');
    },
  });

  const onSubmit = (data: ClientFormData) => {
    const payload = {
      ...data,
      website: data.website || undefined,
      industry: data.industry || undefined,
      company_size: data.company_size || undefined,
      billing_address: data.billing_address || undefined,
      payment_terms: data.payment_terms || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingClient) {
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clients')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update client information' : 'Create a new client company'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Name */}
            <Input
              label="Company Name *"
              placeholder="Acme Corporation"
              error={errors.company_name?.message}
              {...register('company_name')}
            />

            {/* Industry & Company Size */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Industry"
                placeholder="Technology"
                error={errors.industry?.message}
                {...register('industry')}
              />
              <Input
                label="Company Size"
                placeholder="51-200"
                error={errors.company_size?.message}
                {...register('company_size')}
              />
            </div>

            {/* Website */}
            <Input
              label="Website"
              type="url"
              placeholder="https://example.com"
              error={errors.website?.message}
              {...register('website')}
            />

            {/* Status & SLA */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Status *
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('status')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_hold">On Hold</option>
                </select>
                {errors.status && (
                  <p className="mt-1.5 text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              <Input
                label="Default SLA (days)"
                type="number"
                placeholder="7"
                error={errors.default_sla_days?.message}
                {...register('default_sla_days', { valueAsNumber: true })}
              />
            </div>

            {/* Billing Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Billing Address
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter billing address"
                {...register('billing_address')}
              />
              {errors.billing_address && (
                <p className="mt-1.5 text-sm text-destructive">{errors.billing_address.message}</p>
              )}
            </div>

            {/* Payment Terms */}
            <Input
              label="Payment Terms"
              placeholder="Net 30"
              error={errors.payment_terms?.message}
              {...register('payment_terms')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/clients')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  );
}
