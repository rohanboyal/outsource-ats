// src/components/admin/TeamStatsCards.tsx

import { Users, UserCheck, UserX, Shield } from 'lucide-react';

interface TeamStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: Record<string, number>;
}

interface TeamStatsCardsProps {
  stats?: TeamStats;
}

export function TeamStatsCards({ stats }: TeamStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2"></div>
            <div className="h-8 bg-muted rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: 'Admins',
    recruiter: 'Recruiters',
    account_manager: 'Account Managers',
    bd_sales: 'BD / Sales',
    finance: 'Finance',
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
    },
    {
      label: 'Active',
      value: stats.active_users,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-500',
    },
    {
      label: 'Inactive',
      value: stats.inactive_users,
      icon: UserX,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
    },
    {
      label: 'Admins',
      value: stats.by_role.admin || 0,
      icon: Shield,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">
          Team Breakdown by Role
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.by_role).map(([role, count]) => (
            <div key={role} className="text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {roleLabels[role] || role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
