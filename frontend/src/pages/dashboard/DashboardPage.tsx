// src/pages/dashboard/DashboardPage.tsx
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import {
  Building2,
  FileText,
  Users,
  Briefcase,
  Calendar,
  FileCheck,
  UserCheck,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Mock data - will be replaced with real API calls
  const stats = [
    {
      title: 'Total Clients',
      value: 24,
      description: '+3 this month',
      icon: Building2,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active JDs',
      value: 47,
      description: '12 urgent priority',
      icon: FileText,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Total Candidates',
      value: 892,
      description: '45 added this week',
      icon: Users,
      trend: { value: 5, isPositive: true },
    },
    {
      title: 'Active Applications',
      value: 156,
      description: '23 need attention',
      icon: Briefcase,
      trend: { value: -3, isPositive: false },
    },
    {
      title: 'Interviews Scheduled',
      value: 18,
      description: '8 today',
      icon: Calendar,
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Pending Offers',
      value: 12,
      description: '3 expiring soon',
      icon: FileCheck,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Upcoming Joinings',
      value: 8,
      description: '2 this week',
      icon: UserCheck,
      trend: { value: 20, isPositive: true },
    },
    {
      title: 'Success Rate',
      value: '68%',
      description: 'Last 30 days',
      icon: TrendingUp,
      trend: { value: 4, isPositive: true },
    },
  ];

  const quickActions = [
    { label: 'Add Client', onClick: () => navigate('/clients/new') },
    { label: 'Create JD', onClick: () => navigate('/jds/new') },
    { label: 'Add Candidate', onClick: () => navigate('/candidates/new') },
    { label: 'View Pipeline', onClick: () => navigate('/applications/pipeline') },
  ];

  const recentActivity = [
    {
      title: 'New candidate added',
      description: 'John Doe - Senior Developer',
      time: '5 minutes ago',
      icon: Users,
    },
    {
      title: 'Interview scheduled',
      description: 'Sarah Johnson for TechCorp',
      time: '1 hour ago',
      icon: Calendar,
    },
    {
      title: 'Offer accepted',
      description: 'Michael Chen - React Developer',
      time: '2 hours ago',
      icon: FileCheck,
    },
    {
      title: 'New JD published',
      description: 'Python Developer - Client ABC',
      time: '3 hours ago',
      icon: FileText,
    },
  ];

  const alerts = [
    {
      title: 'SLA Breached',
      description: '5 applications exceeded SLA deadline',
      severity: 'high',
    },
    {
      title: 'Interviews Today',
      description: '8 interviews scheduled for today',
      severity: 'medium',
    },
    {
      title: 'Offers Expiring',
      description: '3 offers expiring in 2 days',
      severity: 'medium',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here's what's happening with your recruitment pipeline today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            onClick={action.onClick}
            variant="outline"
            size="sm"
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                alert.severity === 'high'
                  ? 'border-destructive/50 bg-destructive/5'
                  : 'border-yellow-500/50 bg-yellow-500/5'
              }`}
            >
              <AlertCircle
                className={`h-5 w-5 flex-shrink-0 ${
                  alert.severity === 'high' ? 'text-destructive' : 'text-yellow-600'
                }`}
              />
              <div className="flex-1">
                <h4 className="font-medium">{alert.title}</h4>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Pipeline Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Sourced</span>
                <span className="font-medium">45 candidates</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[45%] bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Screened</span>
                <span className="font-medium">32 candidates</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[32%] bg-purple-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">28 candidates</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[28%] bg-yellow-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Interviewing</span>
                <span className="font-medium">18 candidates</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[18%] bg-orange-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Offered</span>
                <span className="font-medium">12 candidates</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[12%] bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
