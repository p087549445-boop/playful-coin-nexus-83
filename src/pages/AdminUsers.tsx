import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Search, Filter, Eye, Edit, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  coin_balance: number;
  created_at: string;
  user_id: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setEditFormData({
      username: userProfile.username,
      full_name: userProfile.full_name,
      role: userProfile.role,
      coin_balance: userProfile.coin_balance
    });
    setEditDialogOpen(true);
  };

  const handleViewUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setViewDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editFormData.username,
          full_name: editFormData.full_name,
          role: editFormData.role,
          coin_balance: editFormData.coin_balance
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil diperbarui"
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (userProfile: UserProfile) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userProfile.user_id,
        { password: '123456' }
      );

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Password berhasil direset ke 123456"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal reset password: " + error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Kelola Pengguna
        </h1>
        <p className="text-muted-foreground">
          Lihat dan kelola semua pengguna platform
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cari Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari berdasarkan username, nama, atau role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Pengguna ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Total pengguna terdaftar di platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((userProfile) => (
              <div
                key={userProfile.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
                      {userProfile.full_name}
                    </h3>
                    <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                      {userProfile.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{userProfile.username}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Balance: {userProfile.coin_balance.toLocaleString()} coins</span>
                    <span>Bergabung: {new Date(userProfile.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditUser(userProfile)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewUser(userProfile)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleResetPassword(userProfile)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Ubah informasi pengguna di bawah ini
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={editFormData.username || ''}
                onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Nama Lengkap
              </Label>
              <Input
                id="full_name"
                value={editFormData.full_name || ''}
                onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select 
                value={editFormData.role || 'user'} 
                onValueChange={(value) => setEditFormData({...editFormData, role: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coin_balance" className="text-right">
                Saldo Koin
              </Label>
              <Input
                id="coin_balance"
                type="number"
                value={editFormData.coin_balance || 0}
                onChange={(e) => setEditFormData({...editFormData, coin_balance: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detail Pengguna</DialogTitle>
            <DialogDescription>
              Informasi lengkap pengguna
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Username:</Label>
                <span className="col-span-3">{selectedUser.username}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Nama Lengkap:</Label>
                <span className="col-span-3">{selectedUser.full_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Role:</Label>
                <span className="col-span-3">
                  <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedUser.role}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Saldo Koin:</Label>
                <span className="col-span-3">{selectedUser.coin_balance.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Bergabung:</Label>
                <span className="col-span-3">
                  {new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">User ID:</Label>
                <span className="col-span-3 text-xs font-mono">{selectedUser.user_id}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}