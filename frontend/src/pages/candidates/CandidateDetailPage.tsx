// src/pages/candidates/CandidateDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, 
  Briefcase, Award, Calendar, DollarSign 
} from 'lucide-react';

import { candidatesApi } from '../../api/candidates';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';

export function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: candidate, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.getCandidate(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => candidatesApi.deleteCandidate(Number(id)),
    onSuccess: () => {
      toast.success('Candidate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      navigate('/candidates');
    },
    onError: () => {
      toast.error('Failed to delete candidate');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/candidates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold">
              {candidate.first_name[0]}{candidate.last_name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {candidate.first_name} {candidate.last_name}
              </h1>
              {candidate.current_designation && (
                <p className="text-muted-foreground mt-1">
                  {candidate.current_designation}
                  {candidate.current_company && ` at ${candidate.current_company}`}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/candidates/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this candidate?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                {candidate.email}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                {candidate.phone}
              </a>
            </div>
          </div>
          {candidate.current_location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Location</p>
                <p>{candidate.current_location}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {candidate.total_experience !== null && (
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Experience</p>
                <p className="font-medium">{candidate.total_experience} years</p>
              </div>
            </div>
          )}
          {candidate.notice_period_days !== null && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Notice Period</p>
                <p className="font-medium">{candidate.notice_period_days} days</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferred Locations */}
      {candidate.preferred_locations && candidate.preferred_locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Preferred Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidate.preferred_locations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
                >
                  {location}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Compensation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {candidate.current_ctc && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current CTC</p>
              <p className="text-lg font-semibold">
                {formatCurrency(candidate.current_ctc, candidate.currency || 'INR')}
              </p>
            </div>
          )}
          {candidate.expected_ctc && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expected CTC</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(candidate.expected_ctc, candidate.currency || 'INR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source */}
      {candidate.source && (
        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{candidate.source}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
