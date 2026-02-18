// src/pages/client/ClientJDsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientPortalApi } from '../../api/clientPortal';
import { FileText, Filter } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-700',
  on_hold: 'bg-amber-100 text-amber-800',
  closed: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700',
};

export function ClientJDsPage() {
  const [filterStatus, setFilterStatus] = useState('');

  const { data: jds, isLoading } = useQuery({
    queryKey: ['client-jds', filterStatus],
    queryFn: () => clientPortalApi.getJDs(filterStatus || undefined),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Openings</h1>
        <p className="text-gray-500 mt-1">Track the status of all your open positions.</p>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="on_hold">On Hold</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {jds?.map((jd) => (
          <div key={jd.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{jd.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{jd.jd_code}</p>
              </div>
              <div className="flex gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[jd.status] || 'bg-gray-100 text-gray-700'}`}>
                  {jd.status.replace('_', ' ')}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[jd.priority] || 'bg-gray-100 text-gray-700'}`}>
                  {jd.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{jd.open_positions}</p>
                <p className="text-xs text-gray-400 mt-0.5">Open</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-700">{jd.filled_positions}</p>
                <p className="text-xs text-gray-400 mt-0.5">Filled</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{jd.total_applications}</p>
                <p className="text-xs text-gray-400 mt-0.5">Candidates</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Filling Progress</span>
                <span>{jd.filled_positions}/{jd.open_positions}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(100, (jd.filled_positions / (jd.open_positions || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {!isLoading && jds?.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-white rounded-xl border border-gray-200">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-700">No job openings found</h3>
          </div>
        )}
      </div>
    </div>
  );
}

