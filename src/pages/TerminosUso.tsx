import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";

const TerminosUso = () => {
  return (
    <Layout>
      <div className="bg-muted/30 py-12">
        <div className="container max-w-4xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-muted-foreground">Última actualización: febrero 2026</p>
        </div>
      </div>

      <div className="container max-w-4xl py-12 prose prose-neutral dark:prose-invert max-w-none">
        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">1. Aceptación de los Términos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Al acceder y utilizar el sitio web de la <strong className="text-foreground">Asociación El Refugio de la Niñez</strong> (en adelante 
            "la Organización"), usted acepta estar sujeto a los presentes Términos y Condiciones de Uso. 
            Si no está de acuerdo con alguno de estos términos, le solicitamos abstenerse de utilizar el sitio.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">2. Descripción del Servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            Este sitio web tiene como propósito informar sobre las actividades, programas y proyectos de la 
            Organización en materia de protección y restitución de derechos de niños, niñas y adolescentes 
            en Guatemala. Adicionalmente, facilita:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>La realización de donaciones en línea.</li>
            <li>El acceso a información institucional y de transparencia.</li>
            <li>La comunicación con la Organización a través de formularios de contacto.</li>
            <li>La publicación de vacantes laborales.</li>
            <li>La difusión de noticias y contenido del blog institucional.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">3. Donaciones</h2>
          <h3 className="font-heading text-xl font-medium text-foreground">3.1 Naturaleza de las donaciones</h3>
          <p className="text-muted-foreground leading-relaxed">
            Las donaciones realizadas a través de este sitio son voluntarias y tienen carácter de liberalidad. 
            Los fondos recaudados se destinan exclusivamente a los programas de protección y atención de la 
            niñez y adolescencia que ejecuta la Organización.
          </p>

          <h3 className="font-heading text-xl font-medium text-foreground">3.2 Procesamiento de pagos</h3>
          <p className="text-muted-foreground leading-relaxed">
            Los pagos se procesan a través de pasarelas de pago certificadas. La Organización no almacena 
            información de tarjetas de crédito o débito. Al realizar una donación, usted acepta los términos 
            del procesador de pagos correspondiente.
          </p>

          <h3 className="font-heading text-xl font-medium text-foreground">3.3 Recibos y comprobantes</h3>
          <p className="text-muted-foreground leading-relaxed">
            La Organización emitirá el comprobante fiscal correspondiente conforme a la legislación tributaria 
            guatemalteca vigente, cuando el donante lo solicite y proporcione la información requerida (NIT, 
            nombre completo, dirección).
          </p>

          <h3 className="font-heading text-xl font-medium text-foreground">3.4 Política de reembolsos</h3>
          <p className="text-muted-foreground leading-relaxed">
            Las donaciones son, en principio, irrevocables. En caso de cargos duplicados o errores en el 
            procesamiento, el donante podrá solicitar la revisión y, de proceder, el reembolso correspondiente 
            contactando a <strong className="text-foreground">donaciones@refugiodelaninez.org</strong> dentro de los 30 días 
            calendario posteriores a la transacción.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">4. Propiedad Intelectual</h2>
          <p className="text-muted-foreground leading-relaxed">
            Todo el contenido de este sitio web — incluyendo textos, imágenes, logotipos, gráficos, videos, 
            diseño y código fuente — es propiedad de la Organización o se utiliza con la debida autorización, 
            y se encuentra protegido por las leyes de propiedad intelectual de Guatemala y tratados internacionales.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Se permite la reproducción parcial del contenido con fines informativos y no comerciales, siempre 
            que se cite la fuente y se incluya un enlace al sitio web original. Queda prohibida cualquier 
            reproducción con fines comerciales sin autorización expresa y por escrito.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">5. Uso Aceptable</h2>
          <p className="text-muted-foreground leading-relaxed">Al utilizar este sitio web, usted se compromete a:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>No utilizar el sitio para fines ilícitos o no autorizados.</li>
            <li>No intentar acceder a áreas restringidas del sistema sin autorización.</li>
            <li>No introducir virus, malware o cualquier código malicioso.</li>
            <li>No realizar actividades que puedan dañar, sobrecargar o deteriorar el funcionamiento del sitio.</li>
            <li>Proporcionar información veraz y actualizada en los formularios del sitio.</li>
            <li>No suplantar la identidad de otra persona o entidad.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">6. Protección de la Imagen de Menores</h2>
          <p className="text-muted-foreground leading-relaxed">
            Las imágenes de niños, niñas y adolescentes que puedan aparecer en este sitio son utilizadas 
            con las autorizaciones correspondientes y conforme a los protocolos de protección de imagen 
            institucionales. Queda estrictamente prohibida la descarga, reproducción o uso de estas imágenes 
            fuera del contexto informativo de la Organización.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">7. Enlaces a Terceros</h2>
          <p className="text-muted-foreground leading-relaxed">
            Este sitio puede contener enlaces a sitios web de terceros (redes sociales, procesadores de pago, 
            aliados estratégicos). La Organización no se responsabiliza por el contenido, políticas de privacidad 
            o prácticas de estos sitios externos.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">8. Disponibilidad del Servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            La Organización se esfuerza por mantener el sitio web disponible de manera continua, pero no 
            garantiza su funcionamiento ininterrumpido. Podrán realizarse mantenimientos programados o 
            actualizaciones que requieran la suspensión temporal del servicio, sin que esto genere 
            responsabilidad alguna.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">9. Limitación de Responsabilidad</h2>
          <p className="text-muted-foreground leading-relaxed">
            La Organización no será responsable por daños directos, indirectos, incidentales o consecuentes 
            derivados del uso o imposibilidad de uso del sitio web, incluyendo pero no limitándose a 
            pérdida de datos, interrupción del servicio o errores en el procesamiento de transacciones, 
            salvo en casos de dolo o negligencia grave.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">10. Legislación Aplicable y Jurisdicción</h2>
          <p className="text-muted-foreground leading-relaxed">
            Los presentes Términos y Condiciones se rigen por las leyes de la República de Guatemala. 
            Cualquier controversia derivada del uso de este sitio web será sometida a la jurisdicción 
            de los tribunales competentes de la Ciudad de Guatemala, Guatemala.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="font-heading text-2xl font-semibold text-foreground">11. Modificaciones</h2>
          <p className="text-muted-foreground leading-relaxed">
            La Organización se reserva el derecho de modificar estos Términos y Condiciones en cualquier 
            momento. Las modificaciones entrarán en vigor desde su publicación en este sitio. Se recomienda 
            revisar periódicamente esta página.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold text-foreground">12. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para consultas sobre estos términos, comuníquese a{" "}
            <strong className="text-foreground">info@refugiodelaninez.org</strong> o visite nuestra página de{" "}
            <Link to="/contacto" className="text-primary hover:underline">contacto</Link>.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default TerminosUso;
