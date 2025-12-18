import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmitReceiptRequest {
  receipt_id: string;
}

interface GuatefacturasCredentials {
  user: string;
  password: string;
  nit_emisor: string;
  token: string;
  ambiente: string; // "FEL" or "PRUEBAS"
}

interface ReceiptData {
  id: string;
  receipt_type: string;
  receptor_nit: string;
  receptor_nombre: string;
  receptor_direccion: string | null;
  receptor_correo: string | null;
  monto: number;
  descripcion: string;
}

interface FELConfiguration {
  nit_emisor: string;
  nombre_comercial: string;
  nombre_emisor: string;
  direccion: string;
  codigo_postal: string | null;
  municipio: string;
  departamento: string;
  pais: string;
  codigo_establecimiento: number;
  correo_copia: string | null;
  ambiente: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Guatefacturas credentials from environment
    const guatefacturasUser = Deno.env.get("GUATEFACTURAS_USER");
    const guatefacturasPassword = Deno.env.get("GUATEFACTURAS_PASSWORD");
    const guatefacturasToken = Deno.env.get("GUATEFACTURAS_TOKEN");

    if (!guatefacturasUser || !guatefacturasPassword || !guatefacturasToken) {
      console.log("Guatefacturas credentials not configured");
      return new Response(
        JSON.stringify({
          error: "Guatefacturas credentials not configured",
          message: "Las credenciales de Guatefacturas no han sido configuradas. Por favor configure GUATEFACTURAS_USER, GUATEFACTURAS_PASSWORD y GUATEFACTURAS_TOKEN.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { receipt_id }: EmitReceiptRequest = await req.json();

    if (!receipt_id) {
      return new Response(
        JSON.stringify({ error: "receipt_id is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch receipt data
    const { data: receipt, error: receiptError } = await supabase
      .from("donation_receipts")
      .select("*")
      .eq("id", receipt_id)
      .single();

    if (receiptError || !receipt) {
      console.error("Error fetching receipt:", receiptError);
      return new Response(
        JSON.stringify({ error: "Receipt not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch FEL configuration
    const { data: felConfig, error: configError } = await supabase
      .from("fel_configuration")
      .select("*")
      .eq("activo", true)
      .single();

    if (configError || !felConfig) {
      console.error("Error fetching FEL config:", configError);
      return new Response(
        JSON.stringify({
          error: "FEL configuration not found",
          message: "La configuración FEL no está activa. Por favor configure los datos del emisor.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build XML for Guatefacturas
    // This is a template - actual implementation depends on Guatefacturas API documentation
    const xml = buildFELXml(receipt as ReceiptData, felConfig as FELConfiguration);

    console.log("Generated XML for FEL:", xml.substring(0, 500) + "...");

    // TODO: Call Guatefacturas Web Service
    // The actual implementation will depend on the specific Guatefacturas API
    // For now, we'll simulate the response structure

    /*
    const guatefacturasResponse = await fetch("https://api.guatefacturas.com/fel/certificar", {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "Authorization": `Bearer ${guatefacturasToken}`,
        "X-User": guatefacturasUser,
        "X-Password": guatefacturasPassword,
      },
      body: xml,
    });

    const responseData = await guatefacturasResponse.json();

    if (!guatefacturasResponse.ok) {
      // Update receipt with error
      await supabase
        .from("donation_receipts")
        .update({
          status: "error",
          error_message: responseData.message || "Error al certificar con Guatefacturas",
        })
        .eq("id", receipt_id);

      return new Response(
        JSON.stringify({ error: "FEL certification failed", details: responseData }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update receipt with success data
    await supabase
      .from("donation_receipts")
      .update({
        status: "certified",
        uuid_sat: responseData.uuid,
        serie: responseData.serie,
        numero: responseData.numero,
        pdf_url: responseData.pdf_url,
        xml_url: responseData.xml_url,
        certified_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", receipt_id);

    // Send email with PDF to receptor and copy email
    if (receipt.receptor_correo || felConfig.correo_copia) {
      // TODO: Implement email sending with PDF attachment
    }
    */

    // For now, return a placeholder response indicating the function is ready
    return new Response(
      JSON.stringify({
        success: false,
        message: "Función preparada. Pendiente de credenciales de Guatefacturas para activar certificación.",
        receipt_id: receipt_id,
        xml_preview: xml.substring(0, 200) + "...",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in emit-fel function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function buildFELXml(receipt: ReceiptData, config: FELConfiguration): string {
  // Determine document type based on receipt_type
  // RDON = Recibo por Donación
  // RECI = Recibo
  const tipoDocumento = receipt.receipt_type === "donacion" ? "RDON" : "RECI";
  
  const fechaEmision = new Date().toISOString();
  
  // Build XML according to SAT Guatemala FEL format
  // This is a simplified template - actual XML structure must match SAT specifications
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" Version="0.1">
  <dte:SAT ClaseDocumento="dte">
    <dte:DTE ID="DatosCertificados">
      <dte:DatosEmision ID="DatosEmision">
        <dte:DatosGenerales CodigoMoneda="GTQ" FechaHoraEmision="${fechaEmision}" Tipo="${tipoDocumento}"/>
        <dte:Emisor AfiliacionIVA="GEN" CodigoEstablecimiento="${config.codigo_establecimiento}" CorreoEmisor="${config.correo_copia || ""}" NITEmisor="${config.nit_emisor}" NombreComercial="${config.nombre_comercial}" NombreEmisor="${config.nombre_emisor}">
          <dte:DireccionEmisor>
            <dte:Direccion>${config.direccion}</dte:Direccion>
            <dte:CodigoPostal>${config.codigo_postal || "01009"}</dte:CodigoPostal>
            <dte:Municipio>${config.municipio}</dte:Municipio>
            <dte:Departamento>${config.departamento}</dte:Departamento>
            <dte:Pais>${config.pais}</dte:Pais>
          </dte:DireccionEmisor>
        </dte:Emisor>
        <dte:Receptor CorreoReceptor="${receipt.receptor_correo || ""}" IDReceptor="${receipt.receptor_nit}" NombreReceptor="${receipt.receptor_nombre}">
          <dte:DireccionReceptor>
            <dte:Direccion>${receipt.receptor_direccion || "Ciudad"}</dte:Direccion>
            <dte:CodigoPostal>01001</dte:CodigoPostal>
            <dte:Municipio>Guatemala</dte:Municipio>
            <dte:Departamento>Guatemala</dte:Departamento>
            <dte:Pais>GT</dte:Pais>
          </dte:DireccionReceptor>
        </dte:Receptor>
        <dte:Items>
          <dte:Item BienOServicio="S" NumeroLinea="1">
            <dte:Cantidad>1</dte:Cantidad>
            <dte:UnidadMedida>UNI</dte:UnidadMedida>
            <dte:Descripcion>${receipt.descripcion}</dte:Descripcion>
            <dte:PrecioUnitario>${receipt.monto.toFixed(2)}</dte:PrecioUnitario>
            <dte:Precio>${receipt.monto.toFixed(2)}</dte:Precio>
            <dte:Descuento>0.00</dte:Descuento>
            <dte:Total>${receipt.monto.toFixed(2)}</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales>
          <dte:GranTotal>${receipt.monto.toFixed(2)}</dte:GranTotal>
        </dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

  return xml;
}

serve(handler);
