// src/pages/candidates/CandidateFormPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, X } from 'lucide-react';

import { candidatesApi, type CreateCandidateData } from '../../api/candidates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

// Validation schema
const candidateSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  current_company: z.string().optional(),
  current_designation: z.string().optional(),
  total_experience: z.number().min(0).optional(),
  current_location: z.string().optional(),
  notice_period_days: z.number().min(0).optional(),
  current_ctc: z.number().min(0).optional(),
  expected_ctc: z.number().min(0).optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

export function CandidateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');

  // Fetch candidate if editing
  const { data: candidate, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.getCandidate(Number(id)),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      currency: 'INR',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (candidate) {
      reset({
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        current_company: candidate.current_company || '',
        current_designation: candidate.current_designation || '',
        total_experience: candidate.total_experience || 0,
        current_location: candidate.current_location || '',
        notice_period_days: candidate.notice_period_days || 0,
        current_ctc: candidate.current_ctc || 0,
        expected_ctc: candidate.expected_ctc || 0,
        currency: candidate.currency || 'INR',
        source: candidate.source || '',
      });
      setSkills(candidate.skills || []);
      setPreferredLocations(candidate.preferred_locations || []);
    }
  }, [candidate, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCandidateData) => candidatesApi.createCandidate(data),
    onSuccess: () => {
      toast.success('Candidate created successfully');
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      navigate('/candidates');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create candidate');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateCandidateData) => candidatesApi.updateCandidate(Number(id), data),
    onSuccess: () => {
      toast.success('Candidate updated successfully');
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      navigate(`/candidates/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update candidate');
    },
  });

  const onSubmit = (data: CandidateFormData) => {
    const payload = {
      ...data,
      skills,
      preferred_locations: preferredLocations,
      current_company: data.current_company || undefined,
      current_designation: data.current_designation || undefined,
      current_location: data.current_location || undefined,
      source: data.source || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addLocation = () => {
    if (locationInput.trim() && !preferredLocations.includes(locationInput.trim())) {
      setPreferredLocations([...preferredLocations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const removeLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== location));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingCandidate) {
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
        <Button variant="ghost" size="sm" onClick={() => navigate('/candidates')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit Candidate' : 'Add New Candidate'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? 'Update candidate information' : 'Add a new candidate to your talent pool'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="First Name *"
                placeholder="John"
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label="Last Name *"
                placeholder="Doe"
                error={errors.last_name?.message}
                {...register('last_name')}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Email *"
                type="email"
                placeholder="john.doe@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone *"
                placeholder="+91 98765 43210"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Current Company"
                placeholder="Acme Corporation"
                error={errors.current_company?.message}
                {...register('current_company')}
              />
              <Input
                label="Current Designation"
                placeholder="Senior Developer"
                error={errors.current_designation?.message}
                {...register('current_designation')}
              />
            </div>

            <Input
              label="Total Experience (years)"
              type="number"
              step="0.1"
              placeholder="5.5"
              error={errors.total_experience?.message}
              {...register('total_experience', { valueAsNumber: true })}
            />

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Skills
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, Python, AWS"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addSkill}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
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

        {/* Location & Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Current Location"
              placeholder="Bangalore, India"
              error={errors.current_location?.message}
              {...register('current_location')}
            />

            {/* Preferred Locations */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Preferred Locations
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Mumbai, Pune"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLocation();
                    }
                  }}
                />
                <Button type="button" onClick={addLocation}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredLocations.map((location) => (
                  <span
                    key={location}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                  >
                    {location}
                    <button
                      type="button"
                      onClick={() => removeLocation(location)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <Input
              label="Notice Period (days)"
              type="number"
              placeholder="30"
              error={errors.notice_period_days?.message}
              {...register('notice_period_days', { valueAsNumber: true })}
            />
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <Input
                label="Current CTC"
                type="number"
                placeholder="1200000"
                error={errors.current_ctc?.message}
                {...register('current_ctc', { valueAsNumber: true })}
              />
              <Input
                label="Expected CTC"
                type="number"
                placeholder="1500000"
                error={errors.expected_ctc?.message}
                {...register('expected_ctc', { valueAsNumber: true })}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Currency
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('currency')}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <Input
              label="Source"
              placeholder="LinkedIn, Referral, Job Portal"
              error={errors.source?.message}
              {...register('source')}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/candidates')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Update Candidate' : 'Create Candidate'}
          </Button>
        </div>
      </form>
    </div>
  );
}
