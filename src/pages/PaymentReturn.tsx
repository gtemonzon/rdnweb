import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle, Home, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";

type PaymentStatus = "success" | "declined" | "error" | "cancelled" | "loading";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [emailSending, setEmailSending] = useState(false);
  const notifiedRef = useRef(false);

  console.log("[PaymentReturn] Component mounted, search:", window.location.search);

  useEffect(() => {
    // Support both req_* and non-req params
    const get = (key: string) =>
      searchParams.get(key) || searchParams.get(`req_${key}`) || "";

    const decision = searchParams.get("decision") || searchParams.get("reason_code") || "";
    const reqRef = get("reference_number");
    const reqAmount = get("amount");
    const reqCurrency = get("currency");
    const message = searchParams.get("message") || "";
    const transactionId = searchParams.get("transaction_id") || "";
    const cardType = get("card_type");
    const cardNumber = get("card_number");
    const billEmail = get("bill_to_email");
    const billForename = get("bill_to_forename");
    const billSurname = get("bill_to_surname");
    const reasonCode = searchParams.get("reason_code") || "";

    const cardLast4 = cardNumber ? cardNumber.slice(-4) : "";
    const donorName = `${billForename} ${billSurname}`.trim();

    const parsed = {
      reference: reqRef,
      amount: reqAmount,
      currency: reqCurrency,
      message,
      transactionId,
      decision,
      reasonCode,
      cardType,
      cardLast4,
      donorName,
      donorEmail: billEmail,
    };

    setDetails(parsed);

    // Save to sessionStorage for /gracias fallback
    if (donorName || reqAmount) {
      sessionStorage.setItem(
        "lastDonation",
        JSON.stringify({
          name: donorName || "Donante",
          amount: reqAmount,
          currency: reqCurrency || "GTQ",
          reference: reqRef,
          date: new Date().toLocaleDateString("es-GT"),
        })
      );
    }

    // Determine status: ACCEPT or reason_code 100 = success
    const decisionUpper = decision.toUpperCase();
    const isSuccess =
      decisionUpper === "ACCEPT" ||
      decisionUpper === "100" ||
      reasonCode === "100";

    if (isSuccess) {
      setStatus("success");
      console.log("[PaymentReturn] Payment SUCCESS", parsed);
    } else if (decisionUpper === "CANCEL" || decisionUpper === "CANCELLED") {
      setStatus("cancelled");
      console.log("[PaymentReturn] Payment CANCELLED");
    } else if (decisionUpper === "DECLINE" || decisionUpper === "REJECT") {
      setStatus("declined");
      console.log("[PaymentReturn] Payment DECLINED");
    } else if (decision) {
      setStatus("error");
      console.log("[PaymentReturn] Payment ERROR, decision:", decision);
    } else {
      const path = window.location.pathname;
      const s = path.includes("cancel") ? "cancelled" : "error";
      setStatus(s);
      console.log("[PaymentReturn] No decision param, inferred:", s);
    }
  }, [searchParams]);

  // Send notification email on success — only once, with sessionStorage dedup
  useEffect(() => {
    if (status !== "success" || notifiedRef.current) return;
    if (!details.amount || !details.reference) return;

    // SessionStorage dedup only — do NOT trust URL "notified" param
    const emailKey = `emailed_${details.reference}`;
    const alreadyEmailed = sessionStorage.getItem(emailKey) === "true";

    if (alreadyEmailed) {
      console.log("[PaymentReturn] Skipping notify-donation (already emailed via sessionStorage)", {
        reference: details.reference,
      });
      notifiedRef.current = true;
      return;
    }

    notifiedRef.current = true;
    setEmailSending(true);

    const payload = {
      donor_name: details.donorName || "Donante anónimo",
      donor_email: details.donorEmail || "",
      amount: details.amount,
      currency: details.currency || "GTQ",
      reference: details.reference,
      transaction_id: details.transactionId || "",
      card_type: details.cardType || "",
      card_last4: details.cardLast4 || "",
      date: new Date().toLocaleString("es-GT"),
    };

    console.log("[PaymentReturn] Calling notify-donation now...", payload);

    supabase.functions
      .invoke("notify-donation", { body: payload })
      .then(({ data, error }) => {
        if (error) {
          console.error("[PaymentReturn] notify-donation FAILED:", error);
        } else {
          console.log("[PaymentReturn] notify-donation response:", data);
          sessionStorage.setItem(emailKey, "true");
        }
      })
      .finally(() => setEmailSending(false));
  }, [status, details, searchParams]);

  const currencySymbol = details.currency === "USD" ? "US$" : "Q";

  const handleGoToThankYou = () => {
    const params = new URLSearchParams({
      name: details.donorName || "Donante",
      amount: details.amount || "",
      currency: details.currency || "GTQ",
      reference: details.reference || "",
      date: new Date().toLocaleDateString("es-GT"),
    });
    navigate(`/gracias?${params.toString()}`);
  };

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

              {emailSending && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando confirmación...
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                {status === "success" ? (
                  <Button onClick={handleGoToThankYou} size="lg">
                    <Heart className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline">
                      <Link to="/">
                        <Home className="w-4 h-4 mr-2" />
                        Ir al inicio
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link to="/donar">
                        <Heart className="w-4 h-4 mr-2" />
                        Intentar de nuevo
                      </Link>
                    </Button>
                  </>
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
