import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';

interface TopUpRequest {
  id: string;
  amount: number;
  status: string;
  payment_proof: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const TopUp = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [amount, setAmount] = useState<number>(1000);
  const [paymentProof, setPaymentProof] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchTopUpRequests();
      
      // Set up real-time subscription for topup requests
      const channel = supabase
        .channel('topup-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'topup_requests',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchTopUpRequests();
            refetch(); // Refresh profile to get updated balance
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchTopUpRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('topup_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching topup requests:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data permintaan top-up",
        variant: "destructive"
      });
    }
  };

  const submitTopUpRequest = async () => {
    if (!user || !amount || amount < 1000) {
      toast({
        title: "Invalid Input",
        description: "Minimal top-up adalah 1000 coins",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('topup_requests')
        .insert({
          user_id: user.id,
          amount,
          payment_proof: paymentProof || null,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Permintaan top-up berhasil dikirim. Menunggu persetujuan admin.",
      });

      setAmount(1000);
      setPaymentProof('');
      fetchTopUpRequests();
    } catch (error) {
      console.error('Error submitting topup request:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim permintaan top-up",
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Top Up Coins</h1>
        <p className="text-muted-foreground">
          Tambah saldo coin Anda untuk bermain lebih banyak game
        </p>
        <div className="text-lg font-semibold">
          Current Balance: {profile.coin_balance.toLocaleString()} coins
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Up Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Request Top Up</span>
            </CardTitle>
            <CardDescription>
              Kirim permintaan top-up dan tunggu persetujuan admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Jumlah Coins</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Minimal 1000 coins"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimal top-up: 1,000 coins
              </p>
            </div>

            <div>
              <Label htmlFor="payment-proof">Bukti Pembayaran (Optional)</Label>
              <Textarea
                id="payment-proof"
                value={paymentProof}
                onChange={(e) => setPaymentProof(e.target.value)}
                placeholder="Link gambar atau keterangan bukti pembayaran"
                rows={3}
              />
            </div>

            <Button 
              onClick={submitTopUpRequest} 
              disabled={loading || amount < 1000}
              className="w-full"
            >
              {loading ? "Sending..." : `Request ${amount.toLocaleString()} Coins`}
            </Button>
          </CardContent>
        </Card>

        {/* Top Up History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Top Up</CardTitle>
            <CardDescription>
              Status permintaan top-up Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {requests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada permintaan top-up
                </p>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {request.amount.toLocaleString()} coins
                      </span>
                      <Badge variant={getStatusVariant(request.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.status)}
                          <span className="capitalize">{request.status}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleString('id-ID')}
                    </p>
                    
                    {request.admin_notes && (
                      <div className="bg-muted p-2 rounded text-sm">
                        <strong>Admin Notes:</strong> {request.admin_notes}
                      </div>
                    )}
                    
                    {request.payment_proof && (
                      <div className="text-sm">
                        <strong>Payment Proof:</strong>
                        <p className="text-muted-foreground break-all">
                          {request.payment_proof}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopUp;