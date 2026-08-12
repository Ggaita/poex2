import SpecialRequestForm from "../../shared/components/SpecialRequestForm/SpecialRequestForm";
import CommercialOpportunityShell from "./CommercialOpportunityShell";

export default function FormulariosDeConsultaPage() {
  return (
    <CommercialOpportunityShell title="Formularios de consulta" wide>
      <SpecialRequestForm
        title="Formulario de consulta"
        description="Completá el pedido especial para oferta o producto necesario. El equipo de la Agencia lo revisará y dará seguimiento."
      />
    </CommercialOpportunityShell>
  );
}
