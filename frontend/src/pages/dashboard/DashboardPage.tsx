// src/pages/dashboard/DashboardPage.tsx - ENHANCED WITH REAL DATA
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { statsApi } from '../../api/stats';
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
  Activity,
  BarChart3,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Fetch real data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => statsApi.getOverview(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['stats-pipeline'],
    queryFn: () => statsApi.getPipeline(),
    refetchInterval: 60000,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['stats-trends'],
    queryFn: () => statsApi.getMonthlyTrends(6),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['stats-alerts'],
    queryFn: () => statsApi.getAlerts(),
    refetchInterval: 60000,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['stats-activity'],
    queryFn: () => statsApi.getRecentActivity(8),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: clientPerformance } = useQuery({
    queryKey: ['stats-clients'],
    queryFn: () => statsApi.getClientPerformance(10),
    refetchInterval: 300000,
  });

  // Show loading state
  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Build stats array from real data
  const stats = overview ? [
    {
      title: 'Total Clients',
      value: overview.total_clients,
      description: `${overview.active_clients} active`,
      icon: Building2,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Active JDs',
      value: overview.active_jds,
      description: `${overview.total_jds} total`,
      icon: FileText,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Total Candidates',
      value: overview.total_candidates,
      description: `${overview.candidates_this_month} this month`,
      icon: Users,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Active Applications',
      value: overview.active_applications,
      description: `${overview.total_applications} total`,
      icon: Briefcase,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Interviews Today',
      value: overview.interviews_today,
      description: `${overview.interviews_this_week} this week`,
      icon: Calendar,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Pending Offers',
      value: overview.pending_offers,
      description: `${overview.accepted_offers} accepted`,
      icon: FileCheck,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Upcoming Joinings',
      value: overview.upcoming_joinings,
      description: `${overview.joinings_this_month} this month`,
      icon: UserCheck,
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Success Rate',
      value: pipeline ? `${Math.round((pipeline.joined / (pipeline.joined + pipeline.rejected + pipeline.withdrawn || 1)) * 100)}%` : '0%',
      description: 'Overall conversion',
      icon: TrendingUp,
      trend: { value: 0, isPositive: true },
    },
  ] : [];

  const quickActions = [
    { label: 'Add Client', onClick: () => navigate('/clients/new') },
    { label: 'Create JD', onClick: () => navigate('/jds/new') },
    { label: 'Add Candidate', onClick: () => navigate('/candidates/new') },
    { label: 'New Pitch', onClick: () => navigate('/pitches/new') },
  ];

  // Prepare pipeline data for chart
  const pipelineData = pipeline ? [
    { stage: 'Sourced', count: pipeline.sourced, color: '#3b82f6' },
    { stage: 'Screened', count: pipeline.screened, color: '#8b5cf6' },
    { stage: 'Submitted', count: pipeline.submitted, color: '#eab308' },
    { stage: 'Interviewing', count: pipeline.interviewing, color: '#f97316' },
    { stage: 'Offered', count: pipeline.offered, color: '#10b981' },
    { stage: 'Joined', count: pipeline.joined, color: '#059669' },
  ] : [];

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
      {!alertsLoading && alerts && alerts.length > 0 && (
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

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recruitment Pipeline</h3>
          </div>
          {pipelineLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Monthly Trends</h3>
          </div>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="interviews" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="offers" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="joinings" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity & Client Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          {activityLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.type === 'candidate' ? Users : 
                            activity.type === 'interview' ? Calendar : 
                            activity.type === 'offer' ? FileCheck : 
                            activity.type === 'joining' ? UserCheck : Briefcase;
                
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
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </div>

        {/* Client Performance */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Top Clients</h3>
          </div>
          {clientPerformance && clientPerformance.length > 0 ? (
            <div className="space-y-3">
              {clientPerformance.slice(0, 5).map((client) => (
                <div
                  key={client.client_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/clients/${client.client_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.positions_filled} filled • {client.active_jds} active JDs
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-green-600">
                      {client.success_rate}%
                    </p>
                    <p className="text-xs text-muted-foreground">success</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No client data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
