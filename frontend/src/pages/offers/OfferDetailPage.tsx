// src/pages/offers/OfferDetailPage.tsx - FINAL
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Send, CheckCircle, XCircle, DollarSign, MapPin, FileText } from 'lucide-react';
import { offersApi } from '../../api/offers';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { OfferStatus } from '../../types';

export function OfferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => offersApi.getOffer(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => offersApi.deleteOffer(Number(id)),
    onSuccess: () => {
      toast.success('Offer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      navigate('/offers');
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => offersApi.sendOffer(Number(id)),
    onSuccess: () => {
      toast.success('Offer sent successfully');
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OfferStatus) => offersApi.updateStatus(Number(id), status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!offer) return <div>Offer not found</div>;

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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/offers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{offer.designation}</h1>
            <p className="text-muted-foreground">{offer.offer_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/offers/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />Edit
          </Button>
          <Button variant="destructive" onClick={() => { if (confirm('Delete offer?')) deleteMutation.mutate(); }}>
            <Trash2 className="h-4 w-4 mr-2" />Delete
          </Button>
        </div>
      </div>

      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[offer.status]}`}>{offer.status}</span>

      <div className="flex gap-2">
        {offer.status === 'draft' && <Button onClick={() => sendMutation.mutate()}><Send className="h-4 w-4 mr-2" />Send Offer</Button>}
        {offer.status === 'sent' && (
          <>
            <Button onClick={() => updateStatusMutation.mutate('accepted')}><CheckCircle className="h-4 w-4 mr-2" />Mark Accepted</Button>
            <Button variant="destructive" onClick={() => updateStatusMutation.mutate('rejected')}><XCircle className="h-4 w-4 mr-2" />Mark Rejected</Button>
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Compensation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Annual CTC</span>
            <span className="text-2xl font-bold">₹{offer.ctc_annual.toLocaleString()}</span>
          </div>
          {offer.base_salary && <div className="flex justify-between"><span>Base Salary</span><span className="font-medium">₹{offer.base_salary.toLocaleString()}</span></div>}
          {offer.variable_pay && <div className="flex justify-between"><span>Variable Pay</span><span className="font-medium">₹{offer.variable_pay.toLocaleString()}</span></div>}
          {offer.bonus && <div className="flex justify-between"><span>Bonus</span><span className="font-medium">₹{offer.bonus.toLocaleString()}</span></div>}
        </CardContent>
      </Card>

      {(offer.work_location || offer.joining_date || offer.offer_valid_till) && (
        <Card>
          <CardHeader><CardTitle>Offer Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {offer.work_location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{offer.work_location}</p>
                </div>
              </div>
            )}
            {offer.joining_date && <div className="flex justify-between"><span>Joining Date</span><span>{offer.joining_date}</span></div>}
            {offer.offer_valid_till && <div className="flex justify-between"><span>Valid Till</span><span>{offer.offer_valid_till}</span></div>}
          </CardContent>
        </Card>
      )}

      {offer.remarks && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Remarks</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{offer.remarks}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


