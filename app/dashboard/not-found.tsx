import { ErrorScreen } from "@/components/ui/error-screen";

export default function DashboardNotFound() {
  return <ErrorScreen
    title="Não encontramos esta área"
    description="Confira o endereço ou volte ao painel para continuar."
  />;
}
