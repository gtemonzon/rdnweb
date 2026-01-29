import { useEffect, useRef, useState, useCallback } from "react";
import { Lock, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Cybersource Flex Microform client library URL
const FLEX_JS_URL = "https://flex.cybersource.com/microform/bundle/v2/flex-microform.min.js";

interface FlexMicroformProps {
  onTokenGenerated: (token: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

declare global {
  interface Window {
    Flex: any;
  }
}

const FlexMicroform = ({ onTokenGenerated, onError, isLoading, disabled }: FlexMicroformProps) => {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [cardType, setCardType] = useState<string | null>(null);
  const [cardNumberValid, setCardNumberValid] = useState(false);
  const [securityCodeValid, setSecurityCodeValid] = useState(false);
  
  const flexRef = useRef<any>(null);
  const microformRef = useRef<any>(null);
  const cardNumberContainerRef = useRef<HTMLDivElement>(null);
  const securityCodeContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const initializingRef = useRef(false);

  // Load Flex Microform script
  const loadFlexScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.Flex) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector(`script[src="${FLEX_JS_URL}"]`);
      if (existingScript) {
        // Wait for it to load
        const checkFlex = () => {
          if (window.Flex) {
            resolve();
          } else {
            setTimeout(checkFlex, 100);
          }
        };
        checkFlex();
        return;
      }

      const script = document.createElement("script");
      script.src = FLEX_JS_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Cybersource Flex library"));
      document.head.appendChild(script);
    });
  }, []);

  // Get capture context from our edge function
  const getCaptureContext = useCallback(async (): Promise<string> => {
    // Get current origin for targetOrigins
    const targetOrigins = [window.location.origin];
    
    // Add preview and production origins
    if (!targetOrigins.includes("https://rdnweb.lovable.app")) {
      targetOrigins.push("https://rdnweb.lovable.app");
    }

    console.log("Requesting capture context for origins:", targetOrigins);

    const { data, error } = await supabase.functions.invoke("flex-capture-context", {
      body: { targetOrigins },
    });

    if (error) {
      throw new Error(error.message || "Error getting capture context");
    }

    if (!data?.success) {
      throw new Error(data?.error || "Failed to get capture context");
    }

    return data.captureContext;
  }, []);

  // Initialize Flex Microform
  const initializeMicroform = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsInitializing(true);
      setInitError(null);

      // Load the Flex script
      await loadFlexScript();
      console.log("Flex script loaded");

      // Get capture context
      const captureContext = await getCaptureContext();
      console.log("Capture context received, length:", captureContext.length);

      // Create Flex instance
      flexRef.current = new window.Flex(captureContext);
      
      // Create microform instance
      microformRef.current = flexRef.current.microform({
        styles: {
          input: {
            "font-size": "16px",
            "font-family": "inherit",
            color: "hsl(var(--foreground))",
          },
          "input::placeholder": {
            color: "hsl(var(--muted-foreground))",
          },
          valid: {
            color: "hsl(var(--foreground))",
          },
          invalid: {
            color: "hsl(var(--destructive))",
          },
        },
      });

      // Create card number field
      if (cardNumberContainerRef.current) {
        const cardNumber = microformRef.current.createField("number", {
          placeholder: "Número de tarjeta",
        });
        
        cardNumber.on("change", (data: any) => {
          setCardNumberValid(data.valid);
          if (data.card && data.card.length > 0) {
            setCardType(data.card[0].name);
          } else {
            setCardType(null);
          }
        });

        cardNumber.load(cardNumberContainerRef.current);
      }

      // Create security code field
      if (securityCodeContainerRef.current) {
        const securityCode = microformRef.current.createField("securityCode", {
          placeholder: "CVV",
        });

        securityCode.on("change", (data: any) => {
          setSecurityCodeValid(data.valid);
        });

        securityCode.load(securityCodeContainerRef.current);
      }

      console.log("Microform initialized successfully");
      setIsInitializing(false);

    } catch (error: any) {
      console.error("Error initializing Flex Microform:", error);
      setInitError(error.message || "Error al inicializar el formulario de pago");
      setIsInitializing(false);
    } finally {
      initializingRef.current = false;
    }
  }, [loadFlexScript, getCaptureContext]);

  // Initialize on mount
  useEffect(() => {
    initializeMicroform();

    return () => {
      // Cleanup
      flexRef.current = null;
      microformRef.current = null;
    };
  }, [initializeMicroform]);

  // Create token when form is submitted
  const createToken = useCallback(async (expirationMonth: string, expirationYear: string): Promise<string> => {
    if (!microformRef.current) {
      throw new Error("Microform not initialized");
    }

    return new Promise((resolve, reject) => {
      const options = {
        expirationMonth,
        expirationYear,
      };

      microformRef.current.createToken(options, (err: any, token: string) => {
        if (err) {
          console.error("Token creation error:", err);
          reject(new Error(err.message || "Error creating payment token"));
        } else {
          console.log("Token created successfully");
          resolve(token);
        }
      });
    });
  }, []);

  // Expose createToken to parent
  useEffect(() => {
    // Store createToken function on window for parent access
    (window as any).flexMicroformCreateToken = createToken;
    
    return () => {
      delete (window as any).flexMicroformCreateToken;
    };
  }, [createToken]);

  const isFormValid = cardNumberValid && securityCodeValid;

  if (initError) {
    return (
      <div className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <span className="font-medium text-destructive">Error de configuración</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{initError}</p>
        <button
          type="button"
          onClick={() => initializeMicroform()}
          className="text-sm text-primary hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Pago seguro con Cybersource</span>
      </div>

      {isInitializing ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Cargando formulario seguro...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Number Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Número de tarjeta *</label>
            <div className="relative">
              <div
                ref={cardNumberContainerRef}
                className={`h-11 px-3 py-2 rounded-md border bg-background transition-colors ${
                  cardNumberValid ? "border-primary" : "border-input"
                } ${disabled || isLoading ? "opacity-50 pointer-events-none" : ""}`}
              />
              {cardType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            {cardType && (
              <p className="text-xs text-muted-foreground">
                Tipo: {cardType.toUpperCase()}
              </p>
            )}
          </div>

          {/* Security Code Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Código de seguridad (CVV) *</label>
            <div
              ref={securityCodeContainerRef}
              className={`h-11 px-3 py-2 rounded-md border bg-background transition-colors w-24 ${
                securityCodeValid ? "border-primary" : "border-input"
              } ${disabled || isLoading ? "opacity-50 pointer-events-none" : ""}`}
            />
          </div>

          {!isFormValid && (
            <p className="text-xs text-muted-foreground">
              Ingresa los datos de tu tarjeta en los campos seguros de arriba.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FlexMicroform;
