import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, XCircle, User, Coins } from "lucide-react";

interface TopUpRequestWithProfile {
  id: string;
  amount: number;
  status: string;
  payment_proof: string | null;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    full_name: string;
  };
}

export default function AdminTopUp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TopUpRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  const fetchTopUpRequests = async () => {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('topup_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching top-up requests:', requestsError);
        return;
      }

      // Fetch profile data for each request
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('user_id', request.user_id)
            .single();

          return {
            ...request,
            profile: profileData
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopUpRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin_topup_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topup_requests'
        },
        () => fetchTopUpRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApproveRequest = async (requestId: string) => {
    if (!user) return;

    setProcessingId(requestId);

    try {
      const { data, error } = await supabase.rpc('approve_topup_request', {
        request_id: requestId,
        admin_id: user.id,
        notes: adminNotes[requestId] || null
      });

      if (error) {
        console.error('Approval error:', error);
        toast({
          title: "Error",
          description: error.message || "Gagal menyetujui permintaan. Pastikan saldo admin mencukupi.",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        toast({
          title: "Error", 
          description: "Permintaan tidak dapat diproses. Periksa status permintaan.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Permintaan top-up berhasil disetujui!"
      });

      // Clear admin notes for this request
      setAdminNotes(prev => ({ ...prev, [requestId]: '' }));
      
      // Refresh the list
      fetchTopUpRequests();
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memproses permintaan",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user) return;

    setProcessingId(requestId);

    try {
      const { error } = await supabase
        .from('topup_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes[requestId] || 'Ditolak oleh admin'
        })
        .eq('id', requestId);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal menolak permintaan",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Permintaan top-up berhasil ditolak"
      });

      // Clear admin notes for this request
      setAdminNotes(prev => ({ ...prev, [requestId]: '' }));
      
      // Refresh the list
      fetchTopUpRequests();
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memproses permintaan",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Kelola Top-Up</h1>
        <p className="text-muted-foreground">Proses permintaan top-up dari pengguna</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-card-foreground">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {requests.filter(req => req.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {requests.filter(req => req.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Permintaan Pending</CardTitle>
          <CardDescription>
            Permintaan yang memerlukan persetujuan admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada permintaan pending
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-card-foreground">
                          {request.profile?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          (@{request.profile?.username || 'unknown'})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="font-bold text-card-foreground">
                            {request.amount.toLocaleString()} coins
                          </span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Dibuat: {new Date(request.created_at).toLocaleString('id-ID')}
                      </p>
                      
                      {request.payment_proof && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-card-foreground">Bukti Pembayaran:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {request.payment_proof}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${request.id}`}>Catatan Admin (Opsional)</Label>
                      <Textarea
                        id={`notes-${request.id}`}
                        placeholder="Tambahkan catatan untuk pengguna..."
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {processingId === request.id ? 'Processing...' : 'Approve'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingId === request.id}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}