import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "editor" | null;

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
  const [blogPermissions, setBlogPermissions] = useState<BlogPermissions>(defaultBlogPermissions);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setUserRole(data.role as UserRole);
    } else {
      setUserRole(null);
    }
  };

  const fetchBlogPermissions = async (userId: string, role: UserRole) => {
    // Admins have all permissions
    if (role === "admin") {
      setBlogPermissions({
        can_create: true,
        can_edit_own: true,
        can_edit_all: true,
        can_publish: true,
        can_delete_own: true,
        can_delete_all: true,
        allowed_categories: null, // null means all categories
      });
      return;
    }

    // Fetch specific permissions for non-admins
    const { data } = await supabase
      .from("blog_permissions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setBlogPermissions({
        can_create: data.can_create,
        can_edit_own: data.can_edit_own,
        can_edit_all: data.can_edit_all,
        can_publish: data.can_publish,
        can_delete_own: data.can_delete_own,
        can_delete_all: data.can_delete_all,
        allowed_categories: data.allowed_categories,
      });
    } else {
      setBlogPermissions(defaultBlogPermissions);
    }
  };

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
            
            // Fetch blog permissions after role
            await fetchBlogPermissions(session.user.id, role);
          }, 0);
        } else {
          setUserRole(null);
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
        
        // Fetch blog permissions after role
        await fetchBlogPermissions(session.user.id, role);
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
    setBlogPermissions(defaultBlogPermissions);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, blogPermissions, signIn, signUp, signOut }}>
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
