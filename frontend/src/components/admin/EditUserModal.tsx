// src/components/admin/EditUserModal.tsx

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Mail, User, Briefcase, Power } from 'lucide-react';
import { toast } from 'sonner';
import { teamUsersApi } from '../../api/teamUsers';

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserModal({ user, isOpen, onClose }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
    is_active: true,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => teamUsersApi.update(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      toast.success('User updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit User: {user.full_name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@company.com"
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                required
              >
                <option value="recruiter">Recruiter</option>
                <option value="account_manager">Account Manager</option>
                <option value="bd_sales">BD / Sales</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Power
                className={`h-4 w-4 ${
                  formData.is_active ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm cursor-pointer flex-1">
                {formData.is_active ? 'Active' : 'Inactive'}
              </label>
            </div>
          </div>

          {/* Warning for status change */}
          {!formData.is_active && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                ⚠️ Disabling this user will prevent them from logging in.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
