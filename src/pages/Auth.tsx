import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { z } from "zod";

const emailSchema = z.string().email("Correo electrónico inválido");
const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message === "Invalid login credentials" 
            ? "Credenciales incorrectas" 
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        });
        navigate("/admin");
      }
    } else {
      if (!fullName.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa tu nombre completo",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message === "User already registered"
            ? "Este correo ya está registrado"
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada. Contacta al administrador para obtener permisos.",
        });
        setIsLogin(true);
      }
    }

    setLoading(false);
  };

  return (
    <Layout>
      <section className="py-20 gradient-hope min-h-[70vh] flex items-center">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl shadow-lg p-8">
              <h1 className="font-heading text-2xl font-bold text-center text-foreground mb-6">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre completo"
                      required={!isLogin}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
