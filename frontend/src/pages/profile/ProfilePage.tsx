// src/pages/profile/ProfilePage.tsx - FIXED ALL TYPESCRIPT ERRORS

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Shield, Calendar, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '../../api/profile';
import { ChangePasswordModal } from '../../components/profile/ChangePasswordModal';

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });
  const queryClient = useQueryClient();

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileApi.getProfile,
  });

  // ✅ FIX 1: Use useEffect instead of onSuccess (deprecated in React Query v5)
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ FIX 2: Add safety check for profile
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    recruiter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    account_manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    bd_sales: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    finance: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    client: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    recruiter: 'Recruiter',
    account_manager: 'Account Manager',
    bd_sales: 'BD / Sales',
    finance: 'Finance',
    client: 'Client',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="h-8 w-8" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b border-border">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">
                {profile.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-muted-foreground mt-1">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    roleColors[profile.role] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  {roleLabels[profile.role] || profile.role}
                </span>
                {profile.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <span className="h-2 w-2 rounded-full bg-green-600"></span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    <span className="h-2 w-2 rounded-full bg-gray-600"></span>
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline h-4 w-4 mr-1.5" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="px-4 py-2 bg-muted rounded-lg">{profile.full_name}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="inline h-4 w-4 mr-1.5" />
                Email Address
              </label>
              <p className="px-4 py-2 bg-muted rounded-lg text-muted-foreground">
                {profile.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Phone className="inline h-4 w-4 mr-1.5" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="px-4 py-2 bg-muted rounded-lg">
                  {profile.phone || 'Not provided'}
                </p>
              )}
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline h-4 w-4 mr-1.5" />
                Member Since
              </label>
              <p className="px-4 py-2 bg-muted rounded-lg">
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="p-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">Security</h3>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Password</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Change your password to keep your account secure
              </p>
            </div>
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </div>
  );
}