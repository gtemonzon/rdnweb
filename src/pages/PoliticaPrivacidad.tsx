import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";

const PoliticaPrivacidad = () => {
  return (
    <Layout>
      <div className="bg-muted/30 py-12">
        <div className="container max-w-4xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground">Última actualización: febrero 2026</p>
        </div>
      </div>

      <div className="container max-w-4xl py-12 prose prose-neutral dark:prose-invert max-w-none">
        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">1. Identidad del Responsable</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Asociación El Refugio de la Niñez</strong> (en adelante "la Organización"), 
            con domicilio en la Ciudad de Guatemala, República de Guatemala, es la entidad responsable del 
            tratamiento de los datos personales recabados a través de este sitio web y sus servicios asociados.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">2. Datos que Recopilamos</h2>
          <p className="text-muted-foreground leading-relaxed">Recopilamos los siguientes tipos de información:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Datos de donantes:</strong> nombre completo, correo electrónico, número de teléfono, NIT, dirección (cuando se solicita recibo de donación).</li>
            <li><strong className="text-foreground">Datos de contacto:</strong> nombre, correo electrónico y mensaje enviado a través del formulario de contacto.</li>
            <li><strong className="text-foreground">Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas y duración de la visita, recopilados mediante cookies técnicas.</li>
            <li><strong className="text-foreground">Datos de postulantes:</strong> información proporcionada al aplicar a vacantes laborales.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">3. Finalidad del Tratamiento</h2>
          <p className="text-muted-foreground leading-relaxed">Los datos personales se utilizan para:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Procesar y confirmar donaciones realizadas a través de la plataforma.</li>
            <li>Emitir recibos de donación y facturas electrónicas (FEL) conforme a la legislación guatemalteca.</li>
            <li>Responder consultas enviadas mediante el formulario de contacto.</li>
            <li>Gestionar procesos de reclutamiento y selección de personal.</li>
            <li>Enviar comunicaciones relacionadas con las actividades de la Organización (solo con consentimiento previo).</li>
            <li>Mejorar la experiencia de navegación y funcionalidad del sitio web.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">4. Base Legal</h2>
          <p className="text-muted-foreground leading-relaxed">
            El tratamiento de datos se fundamenta en el consentimiento del titular, el cumplimiento de obligaciones 
            legales (emisión de documentos tributarios), y el interés legítimo de la Organización en el desarrollo 
            de sus actividades de protección de la niñez y adolescencia, conforme al marco jurídico guatemalteco 
            aplicable y buenas prácticas internacionales de protección de datos.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">5. Procesamiento de Pagos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Las donaciones en línea se procesan a través de pasarelas de pago certificadas con estándar PCI-DSS. 
            La Organización <strong className="text-foreground">no almacena</strong> datos de tarjetas de crédito o débito en sus servidores. 
            Toda la información financiera es procesada directamente por el proveedor de servicios de pago 
            bajo sus propios protocolos de seguridad.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">6. Compartición de Datos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Los datos personales no se venden, alquilan ni ceden a terceros con fines comerciales. 
            Podrán compartirse únicamente con:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Proveedores de servicios tecnológicos que actúan como encargados del tratamiento (hosting, correo, procesamiento de pagos).</li>
            <li>Autoridades fiscales guatemaltecas, cuando sea requerido por ley para la emisión de documentos tributarios electrónicos.</li>
            <li>Autoridades judiciales o administrativas, cuando exista una orden legalmente fundada.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">7. Seguridad de la Información</h2>
          <p className="text-muted-foreground leading-relaxed">
            Implementamos medidas técnicas y organizativas para proteger los datos personales contra acceso 
            no autorizado, pérdida, alteración o destrucción. Esto incluye cifrado en tránsito (HTTPS/TLS), 
            control de acceso basado en roles, y respaldos periódicos de la información.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">8. Derechos del Titular</h2>
          <p className="text-muted-foreground leading-relaxed">
            Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos personales 
            (derechos ARCO). Para ejercer estos derechos, puede comunicarse con nosotros a través del correo 
            electrónico <strong className="text-foreground">info@refugiodelaninez.org</strong> o mediante el formulario de{" "}
            <Link to="/contacto" className="text-primary hover:underline">contacto</Link>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            La solicitud será atendida en un plazo máximo de 30 días hábiles.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">9. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Este sitio utiliza cookies técnicas necesarias para su funcionamiento. No utilizamos cookies 
            de seguimiento publicitario de terceros. Las cookies de sesión se eliminan al cerrar el navegador.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">10. Protección de Datos de Menores</h2>
          <p className="text-muted-foreground leading-relaxed">
            No recopilamos deliberadamente datos personales de menores de edad a través de este sitio web. 
            La información relativa a niños, niñas y adolescentes atendidos por la Organización se maneja 
            bajo estrictos protocolos de confidencialidad conforme a la Ley de Protección Integral de la 
            Niñez y Adolescencia (Ley PINA) y estándares internacionales de protección infantil.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">11. Modificaciones</h2>
          <p className="text-muted-foreground leading-relaxed">
            La Organización se reserva el derecho de actualizar esta política en cualquier momento. 
            Las modificaciones serán publicadas en esta página con la fecha de última actualización. 
            El uso continuado del sitio web tras las modificaciones constituye la aceptación de las mismas.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold text-foreground">12. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para consultas relacionadas con esta política, puede contactarnos en:{" "}
            <strong className="text-foreground">info@refugiodelaninez.org</strong>
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default PoliticaPrivacidad;
