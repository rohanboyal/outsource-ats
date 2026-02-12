// src/pages/clients/ClientsListPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Globe, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function ClientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Fetch clients
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients', { page, search, status: status === 'all' ? undefined : status }],
    queryFn: () => clientsApi.getClients({
      page,
      page_size: 20,
      search: search || undefined,
      status: status === 'all' ? undefined : status,
    }),
  });

  if (error) {
    toast.error('Failed to load clients');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client companies and contacts
          </p>
        </div>
        <Button onClick={() => navigate('/clients/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data?.clients.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No clients found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first client
          </p>
          <Button onClick={() => navigate('/clients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      )}

      {/* Clients Grid */}
      {!isLoading && data && data.clients.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.clients.map((client) => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : client.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                {/* Company Icon */}
                <div className="mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Company Name */}
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {client.company_name}
                </h3>

                {/* Industry */}
                {client.industry && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {client.industry}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2">
                  {client.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span className="truncate">{client.website}</span>
                    </div>
                  )}
                  {client.company_size && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{client.company_size} employees</span>
                    </div>
                  )}
                </div>

                {/* SLA Badge */}
                {client.default_sla_days && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      SLA: {client.default_sla_days} days
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} clients
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
