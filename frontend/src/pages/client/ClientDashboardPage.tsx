// src/pages/client/ClientDashboardPage.tsx - FIXED IMPORTS
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { clientPortalApi } from '../../api/clientPortal';
import { FileText, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
// ✅ REMOVED: Briefcase, TrendingUp, Clock - these were not used

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: number | string; subtitle: string;
  icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export function ClientDashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['client-dashboard'],
    queryFn: clientPortalApi.getDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your recruitment pipeline overview.</p>
      </div>

      {stats && stats.candidates_pending_review > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Action Required</p>
            <p className="text-sm text-amber-700">
              {stats.candidates_pending_review} candidate(s) are awaiting your review and feedback.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Positions" value={stats?.open_jds ?? 0} subtitle={`${stats?.total_jds ?? 0} total JDs`} icon={FileText} color="bg-blue-500" />
        <StatCard title="Candidates Submitted" value={stats?.total_candidates_submitted ?? 0} subtitle={`${stats?.candidates_pending_review ?? 0} pending review`} icon={Users} color="bg-purple-500" />
        <StatCard title="Interviews Scheduled" value={stats?.interviews_scheduled ?? 0} subtitle="Active interviews" icon={Calendar} color="bg-orange-500" />
        <StatCard title="Positions Filled" value={stats?.positions_filled ?? 0} subtitle={`${stats?.offers_extended ?? 0} offers extended`} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* Pipeline visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Recruitment Pipeline</h2>
        <div className="space-y-4">
          {[
            { label: 'Candidates Submitted', value: stats?.total_candidates_submitted ?? 0, color: 'bg-blue-500', max: stats?.total_candidates_submitted || 1 },
            { label: 'Pending Your Review', value: stats?.candidates_pending_review ?? 0, color: 'bg-amber-500', max: stats?.total_candidates_submitted || 1 },
            { label: 'In Interviews', value: stats?.interviews_scheduled ?? 0, color: 'bg-purple-500', max: stats?.total_candidates_submitted || 1 },
            { label: 'Offers Extended', value: stats?.offers_extended ?? 0, color: 'bg-orange-500', max: stats?.total_candidates_submitted || 1 },
            { label: 'Positions Filled', value: stats?.positions_filled ?? 0, color: 'bg-green-500', max: stats?.total_candidates_submitted || 1 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}