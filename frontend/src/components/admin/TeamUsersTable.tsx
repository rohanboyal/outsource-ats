// src/components/admin/TeamUsersTable.tsx

import { Edit, Trash2, Power, KeyRound, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TeamUsersTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number, userName: string) => void;
  onResetPassword: (id: number, userName: string) => void;
}

export function TeamUsersTable({
  users,
  isLoading,
  onEdit,
  onToggle,
  onDelete,
  onResetPassword,
}: TeamUsersTableProps) {
  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    recruiter: 'Recruiter',
    account_manager: 'Account Manager',
    bd_sales: 'BD / Sales',
    finance: 'Finance',
  };

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    recruiter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    account_manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    bd_sales: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    finance: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No users found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      roleBadgeColors[user.role] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-600"></span>
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => onResetPassword(user.id, user.full_name)}
                      className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors"
                      title="Reset password"
                    >
                      <KeyRound className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </button>
                    <button
                      onClick={() => onToggle(user.id)}
                      className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900 rounded-lg transition-colors"
                      title={user.is_active ? 'Disable user' : 'Enable user'}
                    >
                      <Power
                        className={`h-4 w-4 ${
                          user.is_active
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => onDelete(user.id, user.full_name)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
