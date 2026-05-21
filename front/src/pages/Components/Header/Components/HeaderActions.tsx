import Button from "../../Ui/Button/Button";

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