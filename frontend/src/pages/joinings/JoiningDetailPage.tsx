// src/pages/joinings/JoiningDetailPage.tsx - FINAL COMPLETE FIX
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, CheckCircle, Calendar, User } from 'lucide-react';
import { joiningsApi } from '../../api/joinings';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { JoiningStatus } from '../../types';

export function JoiningDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: joining, isLoading } = useQuery({
    queryKey: ['joining', id],
    queryFn: () => joiningsApi.getJoining(Number(id)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => joiningsApi.deleteJoining(Number(id)),
    onSuccess: () => {
      toast.success('Joining deleted');
      queryClient.invalidateQueries({ queryKey: ['joinings'] });
      navigate('/joinings');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: JoiningStatus) => joiningsApi.updateStatus(Number(id), status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['joining', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!joining) return <div>Joining not found</div>;

  // ✅ FIXED: Only the 4 statuses that exist in your database
  const statusColors: Record<JoiningStatus, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-red-100 text-red-800',
    delayed: 'bg-yellow-100 text-yellow-800',
    replacement_required: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/joinings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Joining #{joining.id}</h1>
            {joining.employee_id && (
              <p className="text-muted-foreground">Employee ID: {joining.employee_id}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/joinings/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => { 
              if (confirm('Delete this joining?')) deleteMutation.mutate(); 
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />Delete
          </Button>
        </div>
      </div>

      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[joining.status]}`}>
        {joining.status.replace('_', ' ')}
      </span>

      {joining.status === 'confirmed' && (
        <Button onClick={() => updateStatusMutation.mutate('confirmed')}>
          <CheckCircle className="h-4 w-4 mr-2" />Confirm Joining
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Joining Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Expected Joining Date</p>
              <p className="font-medium">
                {new Date(joining.expected_joining_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {joining.actual_joining_date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Actual Joining Date</p>
                <p className="font-medium">
                  {new Date(joining.actual_joining_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {joining.employee_id && (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{joining.employee_id}</p>
              </div>
            </div>
          )}

          {joining.work_email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work Email</span>
              <span className="font-medium">{joining.work_email}</span>
            </div>
          )}

          {joining.reporting_manager && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reporting Manager</span>
              <span className="font-medium">{joining.reporting_manager}</span>
            </div>
          )}

          {joining.bgv_status && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">BGV Status</span>
              <span className="font-medium">{joining.bgv_status}</span>
            </div>
          )}

          {joining.bgv_completion_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">BGV Completion Date</span>
              <span className="font-medium">
                {new Date(joining.bgv_completion_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {(joining.no_show_reason || joining.replacement_reason || joining.remarks) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {joining.no_show_reason && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">No Show Reason</p>
                <p className="whitespace-pre-wrap">{joining.no_show_reason}</p>
              </div>
            )}
            {joining.replacement_reason && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Replacement Reason</p>
                <p className="whitespace-pre-wrap">{joining.replacement_reason}</p>
              </div>
            )}
            {joining.remarks && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                <p className="whitespace-pre-wrap">{joining.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}