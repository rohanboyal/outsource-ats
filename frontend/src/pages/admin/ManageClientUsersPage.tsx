// src/pages/admin/ManageClientUsersPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientUsersAdminApi } from '../../api/clientPortal';
import { clientsApi } from '../../api/clients';
import { toast } from 'sonner';
import { UserPlus, Users, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

function CreateClientUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_id: 0,
    email: '',
    full_name: '',
    password: '',
    send_welcome_email: true,
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients({ page_size: 100 }),
  });

  const mutation = useMutation({
    mutationFn: () => clientUsersAdminApi.createClientUser(form),
    onSuccess: () => {
      toast.success('Client portal user created successfully!');
      queryClient.invalidateQueries({ queryKey: ['client-users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create client user');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-5">Create Client Portal Login</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Client *</label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}
            >
              <option value={0}>Select client</option>
              {clientsData?.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Full Name *"
            placeholder="John Smith"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />

          <Input
            label="Email *"
            type="email"
            placeholder="john@clientcompany.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <Input
            label="Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="welcome_email"
              checked={form.send_welcome_email}
              onChange={(e) => setForm({ ...form, send_welcome_email: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="welcome_email" className="text-sm text-blue-800 font-medium cursor-pointer">
              Send welcome email with login credentials
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.client_id || !form.email || !form.full_name || !form.password || mutation.isPending}
            isLoading={mutation.isPending}
            className="flex-1"
          >
            Create Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ManageClientUsersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['client-users'],
    queryFn: clientUsersAdminApi.listClientUsers,
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: number) => clientUsersAdminApi.toggleAccess(userId),
    onSuccess: (data) => {
      toast.success(`User ${data.is_active ? 'enabled' : 'disabled'}`);
      queryClient.invalidateQueries({ queryKey: ['client-users'] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Portal Users</h1>
          <p className="text-muted-foreground mt-1">Manage client access to the portal</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4 mr-2" />Create Client Login
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Client Logins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No client portal users yet.</p>
              <p className="text-sm text-muted-foreground">Click "Create Client Login" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.is_active ? '✅ Active' : '❌ Disabled'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleMutation.mutate(user.id)}
                      disabled={toggleMutation.isPending}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title={user.is_active ? 'Disable access' : 'Enable access'}
                    >
                      {user.is_active
                        ? <ToggleRight className="h-6 w-6 text-green-500" />
                        : <ToggleLeft className="h-6 w-6 text-gray-400" />
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreate && <CreateClientUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
