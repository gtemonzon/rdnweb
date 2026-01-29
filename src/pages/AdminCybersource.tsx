import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TestTube, Loader2, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Copy, RefreshCw, Phone, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface VisaNetInstructions {
  title: string;
  message: string;
  steps: string[];
  technicalNote: string;
}

interface TestResult {
  success: boolean;
  error?: string;
  errorType?: "auth_failed" | "service_not_enabled" | "unexpected" | "exception" | null;
  message?: string;
  status?: number;
  credentialsValid?: boolean;
  transactionId?: string;
  paymentStatus?: string;
  response?: Record<string, unknown>;
  logs: string[];
  debug?: Record<string, unknown>;
  suggestions?: string[];
  visanetInstructions?: VisaNetInstructions;
}

const AdminCybersource = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuth();

  const [merchantId, setMerchantId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [environment, setEnvironment] = useState<"test" | "production">("test");
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  if (userRole !== "admin") {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>Solo los administradores pueden acceder a esta página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleTest = async () => {
    if (!merchantId || !keyId || !secretKey) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos de credenciales.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("cybersource-auth-test", {
        body: {
          merchantId: merchantId.trim(),
          keyId: keyId.trim(),
          secretKey: secretKey.trim(),
          environment,
        },
      });

      if (error) throw error;

      setResult(data);

      if (data.success) {
        toast({
          title: "¡Autenticación exitosa!",
          description: "Las credenciales son válidas y el servicio de pagos está habilitado.",
        });
      } else if (data.errorType === "service_not_enabled") {
        toast({
          title: "Servicio no habilitado",
          description: "Contacta a VisaNet para activar el servicio REST API Payments.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: data.error || "No se pudo autenticar con Cybersource.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al ejecutar la prueba";
      console.error("Test error:", error);
      setResult({
        success: false,
        error: errorMessage,
        errorType: "exception",
        logs: [],
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Logs copiados al portapapeles.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Diagnóstico de Cybersource</h1>
            <p className="text-muted-foreground">
              Prueba las credenciales de Cybersource antes de guardarlas en el proyecto
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Probar Credenciales
            </CardTitle>
            <CardDescription>
              Ingresa las credenciales de Cybersource para verificar que funcionan correctamente.
              Esta prueba NO guarda las credenciales en el proyecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select value={environment} onValueChange={(v) => setEnvironment(v as "test" | "production")}>
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Pruebas (apitest.cybersource.com)</SelectItem>
                    <SelectItem value="production">Producción (api.cybersource.com)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                placeholder="ej: visanetgt_tuempresa"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={testing}
              />
              <p className="text-xs text-muted-foreground">
                El identificador de comercio proporcionado por VisaNet/Cybersource
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyId">Key ID (API Key ID)</Label>
              <Input
                id="keyId"
                placeholder="ej: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                disabled={testing}
              />
              <p className="text-xs text-muted-foreground">
                El ID de la llave API, generalmente es un UUID
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Shared Secret Key</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecret ? "text" : "password"}
                  placeholder="La llave secreta compartida"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  disabled={testing}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                La llave secreta para firmar las solicitudes (generalmente en formato Base64)
              </p>
            </div>

            <Button onClick={handleTest} disabled={testing} className="w-full">
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Probando conexión...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Probar Autenticación
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : result.errorType === "service_not_enabled" ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Resultado de la Prueba
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.success ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700 dark:text-green-300">¡Autenticación exitosa!</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    Las credenciales son válidas y el servicio de pagos está habilitado. Puedes proceder a actualizar los secretos del proyecto.
                    {result.transactionId && (
                      <div className="mt-2">
                        <strong>Transaction ID:</strong> {result.transactionId}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : result.errorType === "service_not_enabled" && result.visanetInstructions ? (
                <>
                  {/* Credentials valid indicator */}
                  {result.credentialsValid && (
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-700 dark:text-green-300">Credenciales válidas</AlertTitle>
                      <AlertDescription className="text-green-600 dark:text-green-400">
                        Las credenciales de autenticación son correctas.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Service not enabled alert */}
                  <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-700 dark:text-amber-300">
                      {result.visanetInstructions.title}
                    </AlertTitle>
                    <AlertDescription className="text-amber-600 dark:text-amber-400">
                      {result.visanetInstructions.message}
                    </AlertDescription>
                  </Alert>

                  {/* VisaNet Contact Instructions */}
                  <Card className="border-2 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Phone className="h-5 w-5 text-amber-600" />
                        Pasos para activar el servicio
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        {result.visanetInstructions.steps.map((step, i) => (
                          <li key={i} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>

                      <div className="rounded-lg bg-muted p-4 mt-4">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Nota técnica</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {result.visanetInstructions.technicalNote}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const emailBody = `Estimados,

Solicito la activación del servicio "REST API Payments" para nuestra cuenta de ${environment === "test" ? "sandbox/pruebas" : "producción"}.

Detalles de la integración:
- Merchant ID: ${merchantId}
- Tipo de integración: REST API directa (server-to-server)
- Autenticación: HTTP Signature (HMAC-SHA256)
- Endpoint requerido: POST /pts/v2/payments

Actualmente recibimos un error 404 "Resource not found" al intentar acceder al endpoint de pagos.

Agradezco su pronta atención.

Saludos cordiales.`;
                            
                            navigator.clipboard.writeText(emailBody);
                            toast({
                              title: "Plantilla copiada",
                              description: "Puedes pegarla en un correo para VisaNet.",
                            });
                          }}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Copiar plantilla de correo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error de autenticación</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}

              {/* Debug Info */}
              {result.debug && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium">Información de diagnóstico</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formato de llave detectado:</span>
                      <span className="font-mono">{result.debug.keyFormat as string}</span>
                    </div>
                    {result.debug.merchantIdLength && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitud Merchant ID:</span>
                        <span className="font-mono">{result.debug.merchantIdLength as number}</span>
                      </div>
                    )}
                    {result.debug.keyIdLength && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitud Key ID:</span>
                        <span className="font-mono">{result.debug.keyIdLength as number}</span>
                      </div>
                    )}
                    {result.debug.secretKeyLength && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Longitud Secret Key:</span>
                        <span className="font-mono">{result.debug.secretKeyLength as number}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ambiente:</span>
                      <span className="font-mono">{result.debug.environment as string} ({result.debug.host as string})</span>
                    </div>
                    {result.debug.credentialsVerified !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credenciales verificadas:</span>
                        <span className={result.debug.credentialsVerified ? "text-green-600" : "text-red-600"}>
                          {result.debug.credentialsVerified ? "✓ Sí" : "✗ No"}
                        </span>
                      </div>
                    )}
                    {result.debug.paymentServiceEnabled !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Servicio de pagos:</span>
                        <span className={result.debug.paymentServiceEnabled ? "text-green-600" : "text-amber-600"}>
                          {result.debug.paymentServiceEnabled ? "✓ Habilitado" : "⚠ No habilitado"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && result.errorType !== "service_not_enabled" && (
                <div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    Sugerencias para resolver el problema
                  </h4>
                  <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Logs */}
              {result.logs && result.logs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Logs detallados</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.logs.join("\n"))}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar logs
                    </Button>
                  </div>
                  <ScrollArea className="h-64 rounded-lg border bg-muted p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {result.logs.join("\n")}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {/* Response */}
              {result.response && (
                <div className="space-y-2">
                  <h4 className="font-medium">Respuesta de Cybersource</h4>
                  <ScrollArea className="h-32 rounded-lg border bg-muted p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setResult(null)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nueva prueba
                </Button>
                {result.success && (
                  <Button onClick={() => navigate("/admin")}>
                    Volver al panel de administración
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>¿Cómo obtener las credenciales?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Inicia sesión en el portal de VisaNet/Cybersource Business Center</li>
              <li>Navega a <strong>Payment Configuration → Key Management</strong></li>
              <li>Genera un nuevo conjunto de credenciales de API (REST API)</li>
              <li>Copia el <strong>Merchant ID</strong>, <strong>Key ID</strong> y <strong>Shared Secret Key</strong></li>
              <li>Asegúrate de que las credenciales correspondan al ambiente correcto (Pruebas o Producción)</li>
            </ol>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Esta herramienta NO guarda las credenciales. Después de verificar que funcionan,
                deberás actualizar los secretos del proyecto manualmente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCybersource;
