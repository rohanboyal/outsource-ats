// src/pages/clients/ClientDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Building2, Globe, Mail, Phone } from 'lucide-react';

import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getClient(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.deleteClient(Number(id)),
    onSuccess: () => {
      toast.success('Client deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate('/clients');
    },
    onError: () => {
      toast.error('Failed to delete client');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.company_name}</h1>
            <p className="text-muted-foreground mt-1">{client.industry}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this client?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
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
          {client.company_size && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Company Size</h4>
              <p>{client.company_size}</p>
            </div>
          )}
          {client.website && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Website</h4>
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {client.website}
              </a>
            </div>
          )}
          {client.default_sla_days && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Default SLA</h4>
              <p>{client.default_sla_days} days</p>
            </div>
          )}
          {client.billing_address && (
            <div className="sm:col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Billing Address</h4>
              <p className="whitespace-pre-wrap">{client.billing_address}</p>
            </div>
          )}
          {client.payment_terms && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Terms</h4>
              <p>{client.payment_terms}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
