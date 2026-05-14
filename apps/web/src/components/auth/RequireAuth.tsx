import React, { ReactNode } from 'react';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
  roles?: UserRole[];
  requireAll?: boolean; // If true, user must have ALL roles; if false, user must have ANY role
  fallback?: ReactNode;
}

export function RequireAuth({
  children,
  roles = [],
  requireAll = false,
  fallback = null
}: RequireAuthProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You must be logged in to access this content.</p>
      </div>
    );
  }

  if (roles.length === 0) {
    return <>{children}</>;
  }

  const hasAccess =
  user &&
  (
    requireAll
      ? roles.every(role => user.roles.includes(role))
      : roles.some(role => user.roles.includes(role))
  );
  if (!hasAccess) {
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">
          You don't have the required permissions to access this content.
          {roles.length > 0 && (
            <span className="block mt-2 text-sm">
              Required roles: {roles.join(', ')}
            </span>
          )}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

interface RoleGateProps {
  children: ReactNode;
  roles: UserRole[];
  requireAll?: boolean;
  show?: boolean; // If true, show content when user has access; if false, hide it
}

export function RoleGate({
  children,
  roles,
  requireAll = false,
  show = true
}: RoleGateProps) {
  const { hasRole, hasAnyRole } = useAuth();

  const hasAccess = requireAll
    ? roles.every(role => hasRole(role))
    : hasAnyRole(roles);

  if (show) {
    return hasAccess ? <>{children}</> : null;
  } else {
    return hasAccess ? null : <>{children}</>;
  }
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RequireAuth roles={['admin']} fallback={fallback}>
      {children}
    </RequireAuth>
  );
}

interface StaffOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function StaffOnly({ children, fallback }: StaffOnlyProps) {
  return (
    <RequireAuth roles={['admin', 'accounts', 'support', 'sales']} fallback={fallback}>
      {children}
    </RequireAuth>
  );
}