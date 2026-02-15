import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle, Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";

type PaymentStatus = "success" | "declined" | "error" | "cancelled" | "loading";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [details, setDetails] = useState<Record<string, string>>({});

  useEffect(() => {
    const decision = searchParams.get("decision") || searchParams.get("reason_code") || "";
    const reqRef = searchParams.get("req_reference_number") || "";
    const reqAmount = searchParams.get("req_amount") || "";
    const reqCurrency = searchParams.get("req_currency") || "";
    const message = searchParams.get("message") || "";
    const transactionId = searchParams.get("transaction_id") || "";

    setDetails({
      reference: reqRef,
      amount: reqAmount,
      currency: reqCurrency,
      message,
      transactionId,
      decision,
    });

    const decisionUpper = decision.toUpperCase();
    if (decisionUpper === "ACCEPT" || decisionUpper === "100") {
      setStatus("success");
    } else if (decisionUpper === "CANCEL" || decisionUpper === "CANCELLED") {
      setStatus("cancelled");
    } else if (decisionUpper === "DECLINE" || decisionUpper === "REJECT") {
      setStatus("declined");
    } else if (decision) {
      setStatus("error");
    } else {
      // No decision param - check if this is a cancel return
      const path = window.location.pathname;
      if (path.includes("cancel")) {
        setStatus("cancelled");
      } else {
        setStatus("error");
      }
    }
  }, [searchParams]);

  const currencySymbol = details.currency === "USD" ? "US$" : "Q";

  const statusConfig = {
    success: {
      icon: <CheckCircle className="w-16 h-16 text-green-500" />,
      title: "¡Donación exitosa!",
      description: "Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación.",
      bgClass: "bg-green-50 dark:bg-green-950 border-green-200",
    },
    declined: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: "Pago rechazado",
      description: "Tu pago no pudo ser procesado. Verifica los datos de tu tarjeta e intenta de nuevo.",
      bgClass: "bg-red-50 dark:bg-red-950 border-red-200",
    },
    error: {
      icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
      title: "Error en el pago",
      description: "Ocurrió un error al procesar tu pago. Por favor intenta de nuevo.",
      bgClass: "bg-amber-50 dark:bg-amber-950 border-amber-200",
    },
    cancelled: {
      icon: <XCircle className="w-16 h-16 text-muted-foreground" />,
      title: "Pago cancelado",
      description: "Has cancelado el proceso de pago. Puedes intentar de nuevo cuando lo desees.",
      bgClass: "bg-muted border-border",
    },
    loading: {
      icon: <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />,
      title: "Procesando...",
      description: "Verificando el estado de tu pago.",
      bgClass: "bg-muted border-border",
    },
  };

  const config = statusConfig[status];

  return (
    <Layout>
      <section className="py-20 bg-background">
        <div className="container max-w-lg mx-auto">
          <Card className={`border-2 ${config.bgClass}`}>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">{config.icon}</div>
              <CardTitle className="text-2xl font-heading">{config.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{config.description}</p>

              {status === "success" && details.amount && (
                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900">
                  <p className="text-sm text-muted-foreground">Monto donado</p>
                  <p className="text-3xl font-heading font-bold text-primary">
                    {currencySymbol}{details.amount}
                  </p>
                  {details.reference && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Referencia: {details.reference}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Ir al inicio
                  </Link>
                </Button>
                {status !== "success" && (
                  <Button asChild>
                    <Link to="/donar">
                      <Heart className="w-4 h-4 mr-2" />
                      Intentar de nuevo
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentReturn;
