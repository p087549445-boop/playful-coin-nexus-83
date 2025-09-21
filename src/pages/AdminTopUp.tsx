import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { useAdminBalance } from '@/hooks/useAdminBalance';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User, CreditCard } from 'lucide-react';

interface TopUpRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_proof: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  full_name?: string;
}

const AdminTopUp = () => {
  const { user } = useAuth();
  const { balance, refetch: refetchBalance } = useAdminBalance();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TopUpRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  useEffect(() => {
    fetchTopUpRequests();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-topup-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topup_requests'
        },
        () => {
          fetchTopUpRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTopUpRequests = async () => {
    try {
      // First get topup requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('topup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw requestsError;
      }

      // Then get all unique user profiles for these requests
      const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name')
          .in('user_id', userIds);

        if (profilesError) {
          throw profilesError;
        }

        // Combine the data
        const requestsWithProfiles = requestsData?.map(request => {
          const profile = profilesData?.find(p => p.user_id === request.user_id);
          return {
            ...request,
            username: profile?.username || 'Unknown User',
            full_name: profile?.full_name || 'Unknown User'
          };
        }) || [];

        setRequests(requestsWithProfiles as TopUpRequest[]);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching topup requests:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data permintaan top-up",
        variant: "destructive"
      });
    }
  };

  const handleApproval = async (requestId: string, approved: boolean) => {
    if (!user) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    if (approved && balance < request.amount) {
      toast({
        title: "Insufficient Balance",
        description: "Saldo admin tidak mencukupi untuk menyetujui permintaan ini",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (approved) {
        // Use the stored procedure to approve
        const { data, error } = await supabase.rpc('approve_topup_request', {
          request_id: requestId,
          admin_id: user.id,
          notes: adminNotes || null
        });

        if (error || !data) {
          throw new Error('Failed to approve topup request');
        }
      } else {
        // Reject the request
        const { error } = await supabase
          .from('topup_requests')
          .update({
            status: 'rejected',
            approved_by: user.id,
            admin_notes: adminNotes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Success",
        description: `Permintaan top-up ${approved ? 'disetujui' : 'ditolak'}`,
      });

      setSelectedRequest(null);
      setAdminNotes('');
      fetchTopUpRequests();
      refetchBalance();
    } catch (error) {
      console.error('Error processing topup request:', error);
      toast({
        title: "Error",
        description: `Gagal ${approved ? 'menyetujui' : 'menolak'} permintaan top-up`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Top-Up Management</h1>
        <p className="text-muted-foreground">
          Kelola permintaan top-up dari user
        </p>
        <div className="text-lg font-semibold text-primary">
          Admin Balance: {balance.toLocaleString()} coins
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pending Requests ({pendingRequests.length})</span>
            </CardTitle>
            <CardDescription>
              Permintaan yang menunggu persetujuan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Tidak ada permintaan pending
                </p>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{request.username}</span>
                      </div>
                      <span className="font-bold text-lg">
                        {request.amount.toLocaleString()} coins
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {request.full_name}
                    </p>
                    
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleString('id-ID')}
                    </p>
                    
                    {request.payment_proof && (
                      <div className="bg-muted p-2 rounded text-sm">
                        <strong>Payment Proof:</strong>
                        <p className="break-all">{request.payment_proof}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => setSelectedRequest(request)}
                        disabled={loading}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Processed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Recent Processed</span>
            </CardTitle>
            <CardDescription>
              Permintaan yang sudah diproses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {processedRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada permintaan yang diproses
                </p>
              ) : (
                processedRequests.slice(0, 10).map((request) => (
                  <div key={request.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{request.username}</span>
                      <Badge variant={getStatusVariant(request.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{request.status}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>{request.amount.toLocaleString()} coins</span>
                      <span className="text-muted-foreground">
                        {new Date(request.updated_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {request.admin_notes && (
                      <div className="bg-muted p-2 rounded text-xs">
                        <strong>Notes:</strong> {request.admin_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md mx-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Review Top-Up Request</CardTitle>
              <CardDescription>
                {selectedRequest.username} - {selectedRequest.amount.toLocaleString()} coins
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="space-y-2">
                <p><strong>User:</strong> {selectedRequest.full_name}</p>
                <p><strong>Amount:</strong> {selectedRequest.amount.toLocaleString()} coins</p>
                <p><strong>Date:</strong> {new Date(selectedRequest.created_at).toLocaleString('id-ID')}</p>
                {selectedRequest.payment_proof && (
                  <div>
                    <strong>Payment Proof:</strong>
                    <p className="text-sm bg-muted p-2 rounded break-all">
                      {selectedRequest.payment_proof}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Catatan untuk user..."
                  rows={3}
                />
              </div>
              
              {selectedRequest.amount > balance && (
                <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                  ⚠️ Admin balance tidak mencukupi untuk menyetujui permintaan ini
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleApproval(selectedRequest.id, true)}
                  disabled={loading || selectedRequest.amount > balance}
                  className="flex-1"
                >
                  {loading ? "Processing..." : "Approve"}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleApproval(selectedRequest.id, false)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Processing..." : "Reject"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminNotes('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminTopUp;