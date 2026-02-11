// src/pages/candidates/CandidatesListPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserPlus, Briefcase, MapPin, Award } from 'lucide-react';
import { toast } from 'sonner';

import { candidatesApi } from '../../api/candidates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';

export function CandidatesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [skills, setSkills] = useState('');
  const [page, setPage] = useState(1);

  // Fetch candidates
  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', { page, search, skills }],
    queryFn: () => candidatesApi.getCandidates({
      page,
      page_size: 20,
      search: search || undefined,
      skills: skills || undefined,
    }),
  });

  if (error) {
    toast.error('Failed to load candidates');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-muted-foreground mt-1">
            Manage your talent pool and candidate profiles
          </p>
        </div>
        <Button onClick={() => navigate('/candidates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Skills Filter */}
        <div className="relative sm:w-64">
          <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by skills..."
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data?.candidates.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first candidate
          </p>
          <Button onClick={() => navigate('/candidates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      )}

      {/* Candidates List */}
      {!isLoading && data && data.candidates.length > 0 && (
        <>
          <div className="space-y-4">
            {data.candidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold">
                      {candidate.first_name[0]}{candidate.last_name[0]}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {candidate.first_name} {candidate.last_name}
                        </h3>
                        
                        {candidate.current_designation && (
                          <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Briefcase className="h-4 w-4" />
                            {candidate.current_designation}
                            {candidate.current_company && ` at ${candidate.current_company}`}
                          </p>
                        )}

                        {candidate.current_location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" />
                            {candidate.current_location}
                          </p>
                        )}
                      </div>

                      {/* Experience & CTC */}
                      <div className="text-right flex-shrink-0">
                        {candidate.total_experience !== null && (
                          <div className="text-sm font-medium">
                            {candidate.total_experience} years exp
                          </div>
                        )}
                        {candidate.expected_ctc && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatCurrency(candidate.expected_ctc, candidate.currency || 'INR')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {candidate.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            +{candidate.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                      {candidate.phone && (
                        <span>{candidate.phone}</span>
                      )}
                      {candidate.email && (
                        <span>{candidate.email}</span>
                      )}
                      {candidate.notice_period_days !== null && (
                        <span>Notice: {candidate.notice_period_days} days</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} candidates
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
