import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle single device login enforcement
        if (event === 'SIGNED_IN' && session?.user) {
          // Remove any existing sessions for this user
          await supabase
            .from('user_sessions')
            .delete()
            .eq('user_id', session.user.id);

          // Add new session
          await supabase
            .from('user_sessions')
            .insert({
              user_id: session.user.id,
              session_id: session.access_token
            });
        }

        if (event === 'SIGNED_OUT') {
          // Clean up session records on logout
          const userId = session?.user?.id;
          if (userId) {
            await supabase
              .from('user_sessions')
              .delete()
              .eq('user_id', userId);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up real-time listener for ban status changes
    let banStatusChannel: any = null;
    
    const setupBanListener = (userId: string) => {
      banStatusChannel = supabase
        .channel('ban-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.new?.is_banned) {
              toast({
                title: "Akun Ditangguhkan",
                description: "Akun Anda telah ditangguhkan karena dicurigai melakukan penyalahgunaan kebijakan kami. Anda akan keluar secara otomatis.",
                variant: "destructive"
              });
              setTimeout(() => {
                supabase.auth.signOut();
              }, 3000);
            }
          }
        )
        .subscribe();
    };

    // Set up ban listener when user is authenticated
    if (session?.user) {
      setupBanListener(session.user.id);
    } else if (user) {
      setupBanListener(user.id);
    }

    return () => {
      subscription.unsubscribe();
      if (banStatusChannel) {
        supabase.removeChannel(banStatusChannel);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Check if user is banned after successful authentication
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_banned, ban_reason')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error checking ban status:', profileError);
          toast({
            title: "Error",
            description: "Terjadi kesalahan saat memverifikasi akun",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return { error: profileError };
        }

        if (profile?.is_banned) {
          await supabase.auth.signOut();
          const banMessage = profile.ban_reason || "pelanggaran kebijakan kami";
          toast({
            title: "Akun Ditangguhkan",
            description: `Akun Anda telah ditangguhkan karena ${banMessage}. Silakan hubungi administrator untuk informasi lebih lanjut.`,
            variant: "destructive"
          });
          return { error: { message: "Account suspended" } };
        }
      }
      
      toast({
        title: "Success",
        description: "Login berhasil!"
      });
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName
          }
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Registrasi berhasil! Selamat datang!"
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error", 
        description: "Terjadi kesalahan saat registrasi",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    await supabase.auth.signOut();
    
    // Clean up session records
    if (userId) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);
    }
    
    toast({
      title: "Success",
      description: "Logout berhasil!"
    });
  };

  return (
    <AuthContext.Provider value={{
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};