import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Games from "./pages/Games";
import GameDice from "./pages/GameDice";
import GameCoinFlip from "./pages/GameCoinFlip";
import GameSlots from "./pages/GameSlots";
import GameRoulette from "./pages/GameRoulette";
import GameBlackjack from "./pages/GameBlackjack";
import GameLottery from "./pages/GameLottery";
import TopUp from "./pages/TopUp";
import Profile from "./pages/Profile";
import AdminTopUp from "./pages/AdminTopUp";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import Auth from "./pages/Auth";
import BannedPage from "./pages/BannedPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AutoLogoutWrapper = ({ children }: { children: React.ReactNode }) => {
  useAutoLogout();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AutoLogoutWrapper>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/banned" element={<BannedPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <Dashboard />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <Games />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games/dice" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <GameDice />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games/coinflip" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <GameCoinFlip />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games/slots" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <GameSlots />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games/roulette" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <GameRoulette />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games/blackjack" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <GameBlackjack />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/games/lottery" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <GameLottery />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/topup" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <TopUp />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="user">
                      <Profile />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/topup" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="admin">
                      <AdminTopUp />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="admin">
                      <AdminUsers />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <ProtectedRoute requiredRole="admin">
                      <AdminAnalytics />
                    </ProtectedRoute>
                  </Layout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AutoLogoutWrapper>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
