// src/pages/offers/OffersListPage.tsx - FINAL
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, DollarSign, Filter } from 'lucide-react';
import { offersApi } from '../../api/offers';
import { Button } from '../../components/ui/Button';
import type { OfferStatus } from '../../types';

export function OffersListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['offers', { page, status: status === 'all' ? undefined : status }],
    queryFn: () => offersApi.getOffers({
      page,
      page_size: 20,
      status: status === 'all' ? undefined : status,
    }),
  });

  const statusColors: Record<OfferStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    negotiating: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
    superseded: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offers</h1>
          <p className="text-muted-foreground mt-1">Manage job offers</p>
        </div>
        <Button onClick={() => navigate('/offers/new')}>
          <Plus className="h-4 w-4 mr-2" />Create Offer
        </Button>
      </div>

      <div className="relative w-48">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="negotiating">Negotiating</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading && <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}

      {!isLoading && data?.offers.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No offers found</h3>
          <p className="text-muted-foreground mb-4">Create your first offer</p>
          <Button onClick={() => navigate('/offers/new')}><Plus className="h-4 w-4 mr-2" />Create Offer</Button>
        </div>
      )}

      {!isLoading && data && data.offers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.offers.map((offer) => (
            <div key={offer.id} onClick={() => navigate(`/offers/${offer.id}`)}
                 className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all bg-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{offer.designation}</h3>
                  <p className="text-sm text-muted-foreground">{offer.offer_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[offer.status]}`}>
                  {offer.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">₹{offer.ctc_annual.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
