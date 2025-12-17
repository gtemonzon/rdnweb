import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { 
  ModuleName, 
  ModulePermissions, 
  AllModulePermissions, 
  defaultModulePermissions, 
  fullModulePermissions,
  BlogCustomSettings 
} from "@/types/permissions";

type UserRole = "admin" | "editor" | null;

// Legacy BlogPermissions type for backwards compatibility
export interface BlogPermissions {
  can_create: boolean;
  can_edit_own: boolean;
  can_edit_all: boolean;
  can_publish: boolean;
  can_delete_own: boolean;
  can_delete_all: boolean;
  allowed_categories: string[] | null;
}

const defaultBlogPermissions: BlogPermissions = {
  can_create: false,
  can_edit_own: false,
  can_edit_all: false,
  can_publish: false,
  can_delete_own: false,
  can_delete_all: false,
  allowed_categories: null,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  // New modular permissions
  modulePermissions: AllModulePermissions;
  hasPermission: (module: ModuleName, permission: keyof Omit<ModulePermissions, 'custom_settings'>) => boolean;
  getModulePermissions: (module: ModuleName) => ModulePermissions;
  getCustomSettings: <T = Record<string, unknown>>(module: ModuleName) => T;
  // Legacy blog permissions for backwards compatibility
  blogPermissions: BlogPermissions;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [modulePermissions, setModulePermissions] = useState<AllModulePermissions>({});
  const [blogPermissions, setBlogPermissions] = useState<BlogPermissions>(defaultBlogPermissions);

  const fetchModulePermissions = async (userId: string, role: UserRole) => {
    // Admins have all permissions for all modules
    if (role === "admin") {
      const allModules: ModuleName[] = ['blog', 'crowdfunding', 'reports', 'donations', 'content', 'partners'];
      const adminPermissions: AllModulePermissions = {};
      allModules.forEach(module => {
        adminPermissions[module] = { ...fullModulePermissions };
      });
      setModulePermissions(adminPermissions);
      
      // Set legacy blog permissions for backwards compatibility
      setBlogPermissions({
        can_create: true,
        can_edit_own: true,
        can_edit_all: true,
        can_publish: true,
        can_delete_own: true,
        can_delete_all: true,
        allowed_categories: null,
      });
      return;
    }

    // Fetch permissions from module_permissions table
    const { data, error } = await supabase
      .from("module_permissions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching module permissions:", error);
      setModulePermissions({});
      setBlogPermissions(defaultBlogPermissions);
      return;
    }

    const perms: AllModulePermissions = {};
    data?.forEach((row: any) => {
      perms[row.module_name as ModuleName] = {
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit_own: row.can_edit_own,
        can_edit_all: row.can_edit_all,
        can_publish: row.can_publish,
        can_delete_own: row.can_delete_own,
        can_delete_all: row.can_delete_all,
        custom_settings: row.custom_settings || {},
      };
    });
    setModulePermissions(perms);

    // Set legacy blog permissions for backwards compatibility
    const blogPerm = perms.blog;
    if (blogPerm) {
      const customSettings = blogPerm.custom_settings as BlogCustomSettings;
      setBlogPermissions({
        can_create: blogPerm.can_create,
        can_edit_own: blogPerm.can_edit_own,
        can_edit_all: blogPerm.can_edit_all,
        can_publish: blogPerm.can_publish,
        can_delete_own: blogPerm.can_delete_own,
        can_delete_all: blogPerm.can_delete_all,
        allowed_categories: customSettings?.allowed_categories || null,
      });
    } else {
      setBlogPermissions(defaultBlogPermissions);
    }
  };

  // Helper function to check if user has a specific permission for a module
  const hasPermission = useCallback((module: ModuleName, permission: keyof Omit<ModulePermissions, 'custom_settings'>): boolean => {
    if (userRole === "admin") return true;
    const perms = modulePermissions[module];
    if (!perms) return false;
    return perms[permission] || false;
  }, [userRole, modulePermissions]);

  // Get all permissions for a module
  const getModulePermissions = useCallback((module: ModuleName): ModulePermissions => {
    if (userRole === "admin") return fullModulePermissions;
    return modulePermissions[module] || defaultModulePermissions;
  }, [userRole, modulePermissions]);

  // Get custom settings for a module
  const getCustomSettings = useCallback(<T = Record<string, unknown>>(module: ModuleName): T => {
    if (userRole === "admin") return {} as T;
    return (modulePermissions[module]?.custom_settings || {}) as T;
  }, [userRole, modulePermissions]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch role with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const { data } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();
            
            const role = data?.role as UserRole || null;
            setUserRole(role);
            
            // Fetch module permissions after role
            await fetchModulePermissions(session.user.id, role);
          }, 0);
        } else {
          setUserRole(null);
          setModulePermissions({});
          setBlogPermissions(defaultBlogPermissions);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        const role = data?.role as UserRole || null;
        setUserRole(role);
        
        // Fetch module permissions after role
        await fetchModulePermissions(session.user.id, role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setModulePermissions({});
    setBlogPermissions(defaultBlogPermissions);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      modulePermissions,
      hasPermission,
      getModulePermissions,
      getCustomSettings,
      blogPermissions, 
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
