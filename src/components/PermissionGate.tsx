import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ModuleName } from "@/types/permissions";

interface PermissionGateProps {
  module: ModuleName;
  permission: 'can_view' | 'can_create' | 'can_edit_own' | 'can_edit_all' | 'can_publish' | 'can_delete_own' | 'can_delete_all';
  children: ReactNode;
  fallback?: ReactNode;
  /** For edit/delete permissions, check if user owns the resource */
  isOwner?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGate module="blog" permission="can_create">
 *   <Button>Create Post</Button>
 * </PermissionGate>
 */
export const PermissionGate = ({ 
  module, 
  permission, 
  children, 
  fallback = null,
  isOwner = false,
}: PermissionGateProps) => {
  const { hasPermission, userRole } = useAuth();

  // Admins always have access
  if (userRole === "admin") {
    return <>{children}</>;
  }

  // For "own" permissions, also check the "all" version
  if (permission === 'can_edit_own' && isOwner) {
    if (hasPermission(module, 'can_edit_own') || hasPermission(module, 'can_edit_all')) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  if (permission === 'can_delete_own' && isOwner) {
    if (hasPermission(module, 'can_delete_own') || hasPermission(module, 'can_delete_all')) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // Standard permission check
  if (hasPermission(module, permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;
