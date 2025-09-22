import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const BannedPage = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    // Force logout when component mounts
    signOut();
  }, [signOut]);

  const banReason = profile?.ban_reason || "penyalahgunaan kebijakan kami";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">Akun Ditangguhkan</CardTitle>
          <CardDescription>
            Akun Anda telah ditangguhkan dari platform kami
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Alasan:</strong> Akun Anda dicurigai melakukan {banReason}
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator untuk mendapatkan bantuan lebih lanjut.
            </p>
          </div>

          <Button 
            onClick={() => window.location.href = '/auth'}
            className="w-full"
            variant="outline"
          >
            Kembali ke Halaman Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannedPage;