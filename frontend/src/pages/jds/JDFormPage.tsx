// src/pages/jds/JDFormPage.tsx - WITH PROPER ERROR HANDLING
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, X } from 'lucide-react';

import { jdsApi, type CreateJDData } from '../../api/jds';
import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

// Validation schema matching YOUR backend
const jdSchema = z.object({
  client_id: z.number({ required_error: 'Client is required' }),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(10, 'Description is required'),
  experience_min: z.number().min(0).optional(),
  experience_max: z.number().min(0).optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  currency: z.string().optional(),
  location: z.string().optional(),
  work_mode: z.string().optional(),
  contract_type: z.enum(['full_time', 'contract', 'part_time', 'temp_to_perm']).optional(),
  open_positions: z.number().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['draft', 'open', 'on_hold', 'closed']),
  sla_days: z.number().min(1).optional(),
});

type JDFormData = z.infer<typeof jdSchema>;

export function JDFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requiredSkillInput, setRequiredSkillInput] = useState('');
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [preferredSkillInput, setPreferredSkillInput] = useState('');

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients({ page_size: 100 }),
  });

  // Fetch JD if editing
  const { data: jd, isLoading: isLoadingJD } = useQuery({
    queryKey: ['jd', id],
    queryFn: () => jdsApi.getJD(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<JDFormData>({
    resolver: zodResolver(jdSchema),
    defaultValues: {
      currency: 'USD',
      priority: 'medium',
      status: 'draft',
      open_positions: 1,
      contract_type: 'full_time',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (jd) {
      reset({
        client_id: jd.client_id,
        title: jd.title,
        description: jd.description,
        experience_min: jd.experience_min || undefined,
        experience_max: jd.experience_max || undefined,
        budget_min: jd.budget_min || undefined,
        budget_max: jd.budget_max || undefined,
        currency: jd.currency || 'USD',
        location: jd.location || '',
        work_mode: jd.work_mode || '',
        contract_type: jd.contract_type || 'full_time',
        open_positions: jd.open_positions || 1,
        priority: jd.priority,
        status: jd.status,
        sla_days: jd.sla_days || undefined,
      });
      setRequiredSkills(jd.required_skills || []);
      setPreferredSkills(jd.preferred_skills || []);
    }
  }, [jd, reset]);

  // Create mutation with proper error handling
  const createMutation = useMutation({
    mutationFn: (data: CreateJDData) => jdsApi.createJD(data),
    onSuccess: () => {
      toast.success('Job description created successfully');
      queryClient.invalidateQueries({ queryKey: ['jds'] });
      navigate('/jds');
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          // Multiple validation errors
          detail.forEach((err: any) => {
            toast.error(`${err.loc?.join(' > ')}: ${err.msg}`);
          });
        } else if (typeof detail === 'string') {
          toast.error(detail);
        } else {
          toast.error('Validation failed. Please check your inputs.');
        }
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create job description');
      }
    },
  });

  // Update mutation with proper error handling
  const updateMutation = useMutation({
    mutationFn: (data: CreateJDData) => jdsApi.updateJD(Number(id), data),
    onSuccess: () => {
      toast.success('Job description updated successfully');
      queryClient.invalidateQueries({ queryKey: ['jds'] });
      queryClient.invalidateQueries({ queryKey: ['jd', id] });
      navigate(`/jds/${id}`);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      
      // Handle validation errors (422)
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
        toast.error(error.response?.data?.detail || 'Failed to update job description');
      }
    },
  });

  const onSubmit = (data: JDFormData) => {
    const payload: CreateJDData = {
      ...data,
      required_skills: requiredSkills.length > 0 ? requiredSkills : undefined,
      preferred_skills: preferredSkills.length > 0 ? preferredSkills : undefined,
      location: data.location || undefined,
      work_mode: data.work_mode || undefined,
    };

    console.log('Submitting payload:', payload); // Debug

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addRequiredSkill = () => {
    if (requiredSkillInput.trim() && !requiredSkills.includes(requiredSkillInput.trim())) {
      setRequiredSkills([...requiredSkills, requiredSkillInput.trim()]);
      setRequiredSkillInput('');
    }
  };

  const removeRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const addPreferredSkill = () => {
    if (preferredSkillInput.trim() && !preferredSkills.includes(preferredSkillInput.trim())) {
      setPreferredSkills([...preferredSkills, preferredSkillInput.trim()]);
      setPreferredSkillInput('');
    }
  };

  const removePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingJD) {
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
        <Button variant="ghost" size="sm" onClick={() => navigate('/jds')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Job Description' : 'Add New Job Description'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update job description details' : 'Create a new job opening'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection */}
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
              label="Job Title *"
              placeholder="Senior React Developer"
              error={errors.title?.message}
              {...register('title')}
            />

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Job Description *
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detailed job description, responsibilities, and requirements..."
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Status & Priority */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Status *
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('status')}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Priority *
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('priority')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Required Skills
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, TypeScript"
                  value={requiredSkillInput}
                  onChange={(e) => setRequiredSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRequiredSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addRequiredSkill}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeRequiredSkill(skill)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Preferred Skills
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., GraphQL, Docker"
                  value={preferredSkillInput}
                  onChange={(e) => setPreferredSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPreferredSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addPreferredSkill}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removePreferredSkill(skill)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experience & Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Experience & Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Experience Range */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Min Experience (years)"
                type="number"
                step="0.5"
                placeholder="2"
                error={errors.experience_min?.message}
                {...register('experience_min', { valueAsNumber: true })}
              />
              <Input
                label="Max Experience (years)"
                type="number"
                step="0.5"
                placeholder="5"
                error={errors.experience_max?.message}
                {...register('experience_max', { valueAsNumber: true })}
              />
            </div>

            {/* Salary Range */}
            <div className="grid gap-6 sm:grid-cols-3">
              <Input
                label="Min Budget"
                type="number"
                placeholder="1000000"
                error={errors.budget_min?.message}
                {...register('budget_min', { valueAsNumber: true })}
              />
              <Input
                label="Max Budget"
                type="number"
                placeholder="1500000"
                error={errors.budget_max?.message}
                {...register('budget_max', { valueAsNumber: true })}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Currency
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('currency')}
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Work Details */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Work Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Location"
              placeholder="Bangalore, India"
              error={errors.location?.message}
              {...register('location')}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Work Mode
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('work_mode')}
                >
                  <option value="">Select work mode</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Contract Type
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('contract_type')}
                >
                  <option value="full_time">Full Time</option>
                  <option value="contract">Contract</option>
                  <option value="part_time">Part Time</option>
                  <option value="temp_to_perm">Temp to Perm</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Number of Positions"
                type="number"
                placeholder="1"
                error={errors.open_positions?.message}
                {...register('open_positions', { valueAsNumber: true })}
              />
              <Input
                label="SLA Days"
                type="number"
                placeholder="30"
                error={errors.sla_days?.message}
                {...register('sla_days', { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/jds')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Job Description' : 'Create Job Description'}
          </Button>
        </div>
      </form>
    </div>
  );
}