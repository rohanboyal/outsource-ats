// src/pages/admin/TeamMembersPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

import { teamUsersApi } from '../../api/teamUsers';
import { TeamStatsCards } from '../../components/admin/TeamStatsCards';
import { TeamUsersTable } from '../../components/admin/TeamUsersTable';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import { EditUserModal } from '../../components/admin/EditUserModal';

export function TeamMembersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch team stats
  const { data: stats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: teamUsersApi.getStats,
  });

  // Fetch team users
  const { data: users, isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: teamUsersApi.getAll,
  });

  // Toggle user status mutation
  const toggleMutation = useMutation({
    mutationFn: teamUsersApi.toggle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: teamUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: teamUsersApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset successfully. New password sent to user email.');
    },
    onError: () => {
      toast.error('Failed to reset password');
    },
  });

  // Filter users
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Team Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your recruitment team
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      {/* Stats Cards */}
      <TeamStatsCards stats={stats} />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="recruiter">Recruiter</option>
          <option value="account_manager">Account Manager</option>
          <option value="bd_sales">BD / Sales</option>
          <option value="finance">Finance</option>
        </select>
      </div>

      {/* Users Table */}
      <TeamUsersTable
        users={filteredUsers || []}
        isLoading={isLoading}
        onEdit={setEditingUser}
        onToggle={(id) => toggleMutation.mutate(id)}
        onDelete={(id, userName) => {
          if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
          }
        }}
        onResetPassword={(id, userName) => {
          if (confirm(`Reset password for ${userName}? A new password will be sent to their email.`)) {
            resetPasswordMutation.mutate(id);
          }
        }}
      />

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={true}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}
