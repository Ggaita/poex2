import Button from "../../ui/button/Button";

/** Acciones de acceso del header público (registro / login). */
export default function HeaderActions() {
  return (
    <div className="header-actions">
      <Button variant="primary" to="/register">
        INSCRIBIRSE
      </Button>

      <Button variant="primary" to="/login">
        INGRESAR
      </Button>
    </div>
  );
}
