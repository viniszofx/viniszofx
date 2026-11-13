import { ErrorScreen } from "@/components/ui/error-screen";

export default function NotFound() {
  return <ErrorScreen
    title="Não encontramos esta página"
    description="O endereço pode estar incorreto ou a página pode ter sido movida. Confira o link ou volte ao início."
    homeHref="/"
  />;
}
