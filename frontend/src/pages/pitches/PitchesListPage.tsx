// src/pages/pitches/PitchesListPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Filter, Search } from 'lucide-react';
import { pitchesApi } from '../../api/pitches';
import { Button } from '../../components/ui/Button';
import type { PitchStatus } from '../../types';

export function PitchesListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pitches', { status: status === 'all' ? undefined : status, search }],
    queryFn: () => pitchesApi.getPitches({
      page: 1,
      page_size: 100,
      status: status === 'all' ? undefined : status,
      search: search || undefined,
    }),
  });

  const statusColors: Record<PitchStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pitches</h1>
          <p className="text-muted-foreground mt-1">Manage business development pitches</p>
        </div>
        <Button onClick={() => navigate('/pitches/new')}>
          <Plus className="h-4 w-4 mr-2" />New Pitch
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pitches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && data?.pitches?.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No pitches found</h3>
          <p className="text-muted-foreground mb-4">Create your first pitch</p>
          <Button onClick={() => navigate('/pitches/new')}>
            <Plus className="h-4 w-4 mr-2" />New Pitch
          </Button>
        </div>
      )}

      {!isLoading && data && data.pitches.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.pitches.map((pitch) => (
            <div
              key={pitch.id}
              onClick={() => navigate(`/pitches/${pitch.id}`)}
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all bg-card"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{pitch.pitch_title}</h3>
                  {pitch.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {pitch.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[pitch.status]}`}>
                  {pitch.status}
                </span>
                {pitch.expected_headcount && (
                  <span className="text-sm text-muted-foreground">
                    {pitch.expected_headcount} positions
                  </span>
                )}
              </div>

              {pitch.sent_date && (
                <p className="text-xs text-muted-foreground mt-2">
                  Sent: {new Date(pitch.sent_date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
