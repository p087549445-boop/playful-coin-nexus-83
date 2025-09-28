import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Clock, CheckCircle, XCircle, Coins } from "lucide-react";

interface TopUpRequest {
  id: string;
  amount: number;
  status: string;
  payment_proof: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function TopUp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<TopUpRequest[]>([]);

  const fetchTopUpRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('topup_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching top-up requests:', error);
      return;
    }

    setRequests(data || []);
  };

  useEffect(() => {
    fetchTopUpRequests();

    // Set up real-time subscription for top-up requests
    const channel = supabase
      .channel('topup_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topup_requests',
          filter: `user_id=eq.${user?.id}`
        },
        () => fetchTopUpRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !paymentProof) return;

    const amountNumber = parseInt(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Masukkan jumlah yang valid",
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
          amount: amountNumber,
          payment_proof: paymentProof,
          status: 'pending'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengirim permintaan top-up",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Permintaan top-up berhasil dikirim!"
      });

      // Reset form
      setAmount('');
      setPaymentProof('');
      
      // Refresh requests
      fetchTopUpRequests();
    } catch (error) {
      console.error('Top-up request error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim permintaan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Top Up Coins</h1>
        <p className="text-muted-foreground">Tambahkan coins ke akun Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top-Up Form */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-card-foreground">Request Top-Up</CardTitle>
            </div>
            <CardDescription>
              Kirim permintaan top-up dengan bukti pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Coins</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Masukkan jumlah coins"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: 100 coins, Maximum: 10,000 coins
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_proof">Bukti Pembayaran</Label>
                <Textarea
                  id="payment_proof"
                  placeholder="Masukkan detail pembayaran atau ID transaksi"
                  value={paymentProof}
                  onChange={(e) => setPaymentProof(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Berikan detail pembayaran yang jelas untuk mempercepat proses
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Mengirim...' : 'Kirim Permintaan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pricing Info */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle className="text-card-foreground">Harga Coins</CardTitle>
            </div>
            <CardDescription>
              Harga per coin dalam Rupiah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">100 Coins</span>
                <span className="font-semibold text-foreground">Rp 10,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">500 Coins</span>
                <span className="font-semibold text-foreground">Rp 45,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">1,000 Coins</span>
                <span className="font-semibold text-foreground">Rp 85,000</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border">
                <span className="text-primary font-medium">5,000 Coins</span>
                <span className="font-bold text-primary">Rp 400,000</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Pembayaran via transfer bank</p>
              <p>• Proses maksimal 24 jam</p>
              <p>• Hubungi admin jika ada masalah</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request History */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Riwayat Permintaan</CardTitle>
          <CardDescription>
            Daftar permintaan top-up yang pernah Anda buat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada permintaan top-up
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {request.amount.toLocaleString()} coins
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {request.admin_notes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Catatan Admin:</strong> {request.admin_notes}
                      </p>
                    )}
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