import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { XCircle, AlertTriangle, Home, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { sendDevDonationEmailJS } from "@/lib/emailjs-donation";

type PaymentStatus = "success" | "declined" | "error" | "cancelled" | "loading";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [details, setDetails] = useState<Record<string, string>>({});
  const notifiedRef = useRef(false);

  useEffect(() => {
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

    // Determine status
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
    } else if (decisionUpper === "DECLINE" || decisionUpper === "REJECT") {
      setStatus("declined");
    } else if (decision) {
      setStatus("error");
    } else {
      const path = window.location.pathname;
      setStatus(path.includes("cancel") ? "cancelled" : "error");
    }
  }, [searchParams]);

  // On success: send notifications once, then redirect to /gracias
  useEffect(() => {
    if (status !== "success" || notifiedRef.current) return;
    if (!details.amount || !details.reference) return;

    const emailKey = `emailed_${details.reference}`;
    const alreadyEmailed = sessionStorage.getItem(emailKey) === "true";
    notifiedRef.current = true;

    // Save to sessionStorage for /gracias fallback
    sessionStorage.setItem(
      "lastDonation",
      JSON.stringify({
        name: details.donorName || "Donante",
        amount: details.amount,
        currency: details.currency || "GTQ",
        reference: details.reference,
        date: new Date().toLocaleDateString("es-GT"),
      })
    );

    const sendNotifications = async () => {
      if (!alreadyEmailed) {
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

        // Backend notification
        try {
          const { error } = await supabase.functions.invoke("notify-donation", { body: payload });
          if (error) console.error("[PaymentReturn] notify-donation FAILED:", error);
          else sessionStorage.setItem(emailKey, "true");
        } catch (e) {
          console.error("[PaymentReturn] notify-donation error:", e);
        }

        // DEV-ONLY: EmailJS donor email
        await sendDevDonationEmailJS({
          donor_name: details.donorName || "Donante anónimo",
          donor_email: details.donorEmail || "",
          amount: details.amount,
          currency: details.currency || "GTQ",
          reference_number: details.reference,
          transaction_id: details.transactionId || "",
        });
      }

      // Redirect to /gracias
      const params = new URLSearchParams({
        name: details.donorName || "Donante",
        amount: details.amount || "",
        currency: details.currency || "GTQ",
        reference: details.reference || "",
        date: new Date().toLocaleDateString("es-GT"),
      });
      navigate(`/gracias?${params.toString()}`, { replace: true });
    };

    sendNotifications();
  }, [status, details, navigate]);

  // Only show UI for non-success statuses (success redirects to /gracias)
  if (status === "loading") {
    return (
      <Layout>
        <section className="py-20 bg-background">
          <div className="container max-w-lg mx-auto text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Procesando tu pago...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (status === "success") {
    // Brief transitional state before redirect
    return (
      <Layout>
        <section className="py-20 bg-background">
          <div className="container max-w-lg mx-auto text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Redirigiendo...</p>
          </div>
        </section>
      </Layout>
    );
  }

  const statusConfig = {
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentReturn;
