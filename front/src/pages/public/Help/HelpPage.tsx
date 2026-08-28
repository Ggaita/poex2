import { Link } from "react-router-dom";
import InstitutionalShell from "../Institutional/InstitutionalShell";
import "../Institutional/InstitutionalPage.css";
import "./HelpPage.css";

const TOC = [
  { id: "que-podes-hacer", label: "¿Qué podés hacer en POEX?" },
  { id: "guias-de-uso", label: "Guías de uso" },
  { id: "preguntas-frecuentes", label: "Preguntas frecuentes" },
  { id: "soporte", label: "Soporte" }
] as const;

// Placeholder hasta que haya capturas reales de la UI.
function HelpImageSlot() {
  return (
    <div className="help-image-slot" role="img" aria-label="Espacio reservado para imagen">
      Aquí va una imagen
    </div>
  );
}

export default function HelpPage() {
  return (
    <InstitutionalShell
      eyebrow="Plataforma de Oferta Exportable"
      title="Ayuda para usar POEX"
      subtitle="Guía práctica para buscar productos y empresas, enviar consultas e incorporar una empresa a la plataforma."
      wide
    >
      <nav className="help-toc institutional-card" aria-label="Secciones de ayuda">
        <h2>¿Cómo podemos ayudarte?</h2>
        <p className="help-lead">
          En esta guía encontrarás información para buscar productos y empresas, consultar el
          Catálogo Exportable, enviar solicitudes e incorporar tu empresa a POEX. Elegí la opción
          que necesites y seguí los pasos indicados.
        </p>
        <ul className="help-toc-list">
          {TOC.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="que-podes-hacer" className="institutional-card help-section">
        <h2>¿Qué podés hacer en POEX?</h2>

        <article className="help-block">
          <h3>Buscar productos y empresas</h3>
          <p>
            Encontrá productos exportables y empresas chaqueñas desde el buscador general. También
            podés realizar búsquedas específicas dentro del catálogo de productos o del directorio
            de empresas.
          </p>
          <div className="help-actions">
            <Link to="/search?mode=product" className="help-action">
              Buscar productos
            </Link>
            <Link to="/search?mode=company" className="help-action">
              Buscar empresas
            </Link>
            <Link to="/search" className="help-action help-action-soft">
              Buscador general
            </Link>
          </div>
          <HelpImageSlot />
        </article>

        <article className="help-block">
          <h3>Explorar el Catálogo Exportable</h3>
          <p>
            Consultá las empresas que integran el Catálogo Exportable de la Provincia del Chaco.
            Cada ficha reúne información sobre sus productos, sector, ubicación y datos de
            contacto.
          </p>
          <div className="help-actions">
            <Link to="/catalogo-exportable" className="help-action">
              Ver catálogo exportable
            </Link>
          </div>
          <HelpImageSlot />
        </article>

        <article className="help-block">
          <h3>Consultar el mapa de empresas</h3>
          <p>
            Visualizá las empresas publicadas que cuentan con una ubicación registrada. Seleccioná
            un marcador o una empresa del listado para acceder a su ficha.
          </p>
          <div className="help-actions">
            <Link to="/parque-industrial" className="help-action">
              Ver mapa de empresas
            </Link>
          </div>
          <HelpImageSlot />
        </article>

        <article className="help-block">
          <h3>Incorporar una empresa</h3>
          <p>
            Completá el formulario de preinscripción para solicitar la incorporación de tu empresa
            al Directorio de Oferta Exportable. La información será revisada por el equipo
            administrador antes de publicarse.
          </p>
          <div className="help-actions">
            <Link to="/register" className="help-action">
              Inscribir empresa
            </Link>
          </div>
          <HelpImageSlot />
        </article>
      </section>

      <section id="guias-de-uso" className="institutional-card help-section">
        <h2>Guías de uso</h2>

        <article className="help-block">
          <h3>Cómo buscar un producto o una empresa</h3>
          <ol className="help-steps">
            <li>
              Ingresá una palabra en el buscador general. Puede ser el nombre de un producto, una
              empresa, un sector o una localidad.
            </li>
            <li>Seleccioná <strong>Buscar</strong>.</li>
            <li>Revisá los resultados encontrados.</li>
            <li>
              Elegí <strong>Ver ficha empresa</strong> para consultar la información completa.
            </li>
            <li>
              Si querés comenzar una nueva búsqueda, modificá el término ingresado o seleccioná{" "}
              <strong>Mostrar todos</strong>.
            </li>
          </ol>
          <p>
            La búsqueda general muestra empresas y productos relacionados. Si necesitás resultados
            más específicos, utilizá el buscador de productos o el buscador de empresas.
          </p>
          <div className="help-actions">
            <Link to="/search?mode=product" className="help-action help-action-soft">
              Buscador de productos
            </Link>
            <Link to="/search?mode=company" className="help-action help-action-soft">
              Buscador de empresas
            </Link>
          </div>
        </article>

        <article className="help-block">
          <h3>Cómo consultar una empresa</h3>
          <p>En la ficha de cada empresa podrás encontrar, según la información disponible:</p>
          <ul className="institutional-list help-bullet-list">
            <li>Descripción de la empresa.</li>
            <li>Sector y subsector.</li>
            <li>Productos publicados.</li>
            <li>Palabras clave.</li>
            <li>Ciudad y domicilio.</li>
            <li>Datos de contacto.</li>
            <li>Sitio web.</li>
            <li>Ubicación geográfica.</li>
          </ul>
          <p>
            Para consultar su localización, utilizá el mapa incluido en la ficha o seleccioná{" "}
            <strong>Abrir en OpenStreetMap</strong>.
          </p>
        </article>

        <article className="help-block">
          <h3>Cómo enviar un pedido especial</h3>
          <p>Si no encontrás el producto o la empresa que necesitás:</p>
          <ol className="help-steps">
            <li>Accedé al formulario de consulta.</li>
            <li>
              Seleccioná <strong>Producto necesario</strong> o{" "}
              <strong>Solicitud de oferta especial</strong>.
            </li>
            <li>Indicá el producto o la necesidad.</li>
            <li>Completá tus datos de contacto.</li>
            <li>
              Agregá la cantidad, las especificaciones, el mercado de destino u otra información
              relevante.
            </li>
            <li>
              Seleccioná <strong>Enviar pedido especial</strong>.
            </li>
          </ol>
          <p>El equipo de la Agencia revisará la solicitud para darle seguimiento.</p>
          <div className="help-actions">
            <Link to="/formularios-de-consulta" className="help-action">
              Ir al formulario de consulta
            </Link>
          </div>
          <HelpImageSlot />
        </article>

        <article className="help-block">
          <h3>Cómo inscribir una empresa</h3>
          <p>La preinscripción de empresas se completa en cuatro etapas.</p>

          <div className="help-stage">
            <span className="help-stage-num">1</span>
            <div>
              <h4>Datos de la empresa</h4>
              <p>
                Ingresá el nombre, correo electrónico, teléfono, domicilio, localidad y una breve
                descripción. También podés agregar el logo y marcar la ubicación en el mapa.
              </p>
            </div>
          </div>

          <div className="help-stage">
            <span className="help-stage-num">2</span>
            <div>
              <h4>Contacto y sector</h4>
              <p>
                Completá los datos de la persona representante, seleccioná el sector productivo e
                indicá si la empresa pertenece a una cámara.
              </p>
            </div>
          </div>

          <div className="help-stage">
            <span className="help-stage-num">3</span>
            <div>
              <h4>Producto y comunicación</h4>
              <p>
                Agregá información sobre los productos o servicios, palabras clave, posición
                arancelaria, destinos de exportación, certificaciones, premios, sitio web y redes
                sociales.
              </p>
            </div>
          </div>

          <div className="help-stage">
            <span className="help-stage-num">4</span>
            <div>
              <h4>Adjuntos y envío</h4>
              <p>
                Indicá si querés incorporar catálogos, fotografías de productos o imágenes de la
                empresa. Antes de enviar la solicitud, confirmá que la información podrá ser
                revisada por el equipo administrador.
              </p>
            </div>
          </div>

          <p className="help-callout">
            <strong>Importante:</strong> la preinscripción no implica la publicación inmediata. La
            empresa será incorporada al directorio una vez que la solicitud haya sido revisada y
            aprobada.
          </p>

          <div className="help-actions">
            <Link to="/register" className="help-action">
              Ir a Inscribirse
            </Link>
          </div>
        </article>

        <article className="help-block">
          <h3>Cómo ingresar al sistema</h3>
          <ol className="help-steps">
            <li>
              Accedé a <strong>Ingresar</strong>.
            </li>
            <li>
              Seleccioná el perfil <strong>Empresa</strong> o <strong>Administrador</strong>.
            </li>
            <li>Ingresá tu correo electrónico y contraseña.</li>
            <li>
              Activá <strong>Recordar sesión</strong> si utilizás un dispositivo personal.
            </li>
            <li>
              Seleccioná <strong>Ingresar</strong>.
            </li>
          </ol>
          <p className="help-callout help-callout-soft">
            <strong>Seguridad:</strong> no recomendamos utilizar la opción Recordar sesión en
            computadoras públicas o compartidas.
          </p>
          <div className="help-actions">
            <Link to="/login" className="help-action">
              Ir a Ingresar
            </Link>
          </div>
        </article>
      </section>

      <section id="preguntas-frecuentes" className="institutional-card help-section">
        <h2>Preguntas frecuentes</h2>
        <div className="help-faq">
          <details open>
            <summary>¿Qué es POEX?</summary>
            <p>
              POEX es la plataforma de Oferta Exportable de la Provincia del Chaco. Permite
              consultar empresas y productos, identificar capacidades productivas y facilitar el
              contacto entre empresas, compradores y personas interesadas en oportunidades
              comerciales.
            </p>
          </details>

          <details>
            <summary>¿Necesito registrarme para buscar empresas o productos?</summary>
            <p>
              No. Las búsquedas, el catálogo, las fichas públicas y el mapa de empresas pueden
              consultarse sin iniciar sesión.
            </p>
          </details>

          <details>
            <summary>¿Qué información puedo usar para realizar una búsqueda?</summary>
            <p>
              Podés buscar por nombre de producto, empresa, sector, ciudad o palabra clave. Para
              obtener mejores resultados, utilizá términos breves y concretos.
            </p>
          </details>

          <details>
            <summary>¿Cómo puedo ver todos los productos o empresas?</summary>
            <p>
              Ingresá al buscador de productos o al buscador de empresas sin escribir ningún
              término. La plataforma mostrará todos los registros publicados.
            </p>
          </details>

          <details>
            <summary>¿Qué hago si no encuentro lo que necesito?</summary>
            <p>
              Podés completar un pedido especial indicando el producto, la cantidad, las
              características necesarias y el mercado de destino. Esta opción también aparece
              cuando una búsqueda no presenta resultados.
            </p>
          </details>

          <details>
            <summary>¿Cómo contacto a una empresa?</summary>
            <p>
              Ingresá en su ficha para consultar los datos de contacto disponibles. Según la
              información publicada, podrás encontrar correo electrónico, teléfono, sitio web,
              domicilio y persona de contacto.
            </p>
          </details>

          <details>
            <summary>¿Cómo incorporo mi empresa al catálogo?</summary>
            <p>
              Seleccioná <strong>Inscribirse</strong> y completá las cuatro etapas del formulario
              de preinscripción. La solicitud será revisada antes de que la empresa sea publicada.
            </p>
          </details>

          <details>
            <summary>¿La empresa se publica inmediatamente después de enviar el formulario?</summary>
            <p>
              No. La solicitud queda sujeta a revisión por parte del equipo administrador. Esta
              instancia permite verificar la información antes de incorporarla al directorio
              público.
            </p>
          </details>

          <details>
            <summary>¿Qué archivos puedo adjuntar?</summary>
            <p>Podés incorporar:</p>
            <ul className="institutional-list help-bullet-list">
              <li>Un logo en formato JPG, JPEG o PNG, de hasta 2 MB.</li>
              <li>Catálogos de productos en PDF.</li>
              <li>Fotografías de productos.</li>
              <li>Fotografías de la empresa.</li>
            </ul>
            <p>
              El formulario permite agregar hasta seis archivos en cada categoría de adjuntos.
            </p>
          </details>

          <details>
            <summary>¿Cómo indico la ubicación de mi empresa?</summary>
            <p>
              Podés seleccionar la ubicación directamente en el mapa o ingresar manualmente la
              latitud y la longitud. Antes de continuar, verificá que el marcador se encuentre en
              la ubicación correcta.
            </p>
          </details>

          <details>
            <summary>¿Puedo enviar una consulta sin inscribir una empresa?</summary>
            <p>
              Sí. El formulario de contacto institucional y el formulario de pedidos especiales
              están disponibles sin iniciar sesión.
            </p>
          </details>

          <details>
            <summary>¿Qué hago si tengo problemas para ingresar?</summary>
            <p>
              Verificá que hayas seleccionado el perfil correcto y que el correo electrónico esté
              escrito sin errores. Si el problema continúa, comunicate con el equipo de soporte
              mediante el formulario de contacto.
            </p>
          </details>
        </div>
      </section>

      <section id="soporte" className="institutional-card help-section">
        <h2>Soporte</h2>
        <article className="help-block">
          <h3>¿Necesitás más ayuda?</h3>
          <p>
            Si no encontraste la respuesta que buscabas, envianos una consulta. Indicá claramente
            el inconveniente y, cuando corresponda, el paso del formulario en el que se produjo.
          </p>
          <p className="help-callout help-callout-soft">
            No incluyas contraseñas ni información confidencial en el mensaje.
          </p>
          <div className="help-actions">
            <Link to="/contacto-institucional" className="help-action">
              Contactar a la Agencia
            </Link>
            <Link to="/formularios-de-consulta" className="help-action help-action-soft">
              Enviar una consulta
            </Link>
            <Link to="/" className="help-action help-action-soft">
              Volver al inicio
            </Link>
          </div>
          <HelpImageSlot />
        </article>
      </section>
    </InstitutionalShell>
  );
}
