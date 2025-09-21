import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  // Show loading while checking authentication
  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If no specific role required, just check if user is authenticated
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Role-based redirection logic
  if (profile?.role) {
    // Admin trying to access user route - redirect to admin dashboard
    if (profile.role === 'admin' && requiredRole === 'user') {
      return <Navigate to="/admin" replace />;
    }
    
    // User trying to access admin route - redirect to user dashboard
    if (profile.role === 'user' && requiredRole === 'admin') {
      return <Navigate to="/" replace />;
    }

    // Role matches requirement
    if (profile.role === requiredRole) {
      return <>{children}</>;
    }
  }

  // Fallback redirect based on current route and role
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/" replace />;
  }
}