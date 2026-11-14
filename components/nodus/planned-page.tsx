import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RiBankCardLine, RiBarChartBoxLine, RiExchangeDollarLine, RiLockLine, RiReceiptLine, RiTimeLine } from "@remixicon/react";
import { CatalogLayout } from "@/components/listing/catalog";

export const plannedFeatures = {
  cards: { title: "Cartões", description: "Cartões corporativos e os colaboradores responsáveis por cada um.", stage: "Etapa 1", icon: RiBankCardLine, items: ["Cadastro de cartões com bandeira, final e limite", "Responsável e centro de custo por cartão", "Bloqueio e histórico de responsáveis"] },
  timesheets: { title: "Apontamento de horas", description: "Horas trabalhadas por colaborador em cada viagem e ordem de serviço.", stage: "Etapa 2", icon: RiTimeLine, items: ["Horas a partir das jornadas de campo", "Vínculo com ordens e viagens", "Aprovação pela gestão"] },
  expenses: { title: "Despesas", description: "Gastos da equipe em campo, com comprovante e política de limites.", stage: "Etapa 3", icon: RiReceiptLine, items: ["Lançamento com foto do comprovante", "Categorias e limites por política", "Vínculo com cartão, viagem e ordem"] },
  reconciliation: { title: "Conciliação", description: "Importação dos extratos dos cartões e conferência com as despesas lançadas.", stage: "Etapa 4", icon: RiExchangeDollarLine, items: ["Importação de extratos (OFX/CSV)", "Sugestão automática de correspondência", "Pendências por colaborador"] },
  indicators: { title: "Indicadores", description: "Custos e produtividade por cliente, viagem, colaborador e período.", stage: "Etapa 5", icon: RiBarChartBoxLine, items: ["Custo por cliente e por viagem", "KM e horas por colaborador", "Comparação entre períodos"] },
  closing: { title: "Fechamento", description: "Fechamento mensal com versões e trilha de auditoria.", stage: "Etapa 5", icon: RiLockLine, items: ["Fechamento do mês com bloqueio de edição", "Versões e reabertura justificada", "Trilha de auditoria"] },
} as const;
export type PlannedFeature = keyof typeof plannedFeatures;

export function PlannedPage({ feature }: { feature: PlannedFeature }) {
  const { title, description, stage, icon: Icon, items } = plannedFeatures[feature];
  return <CatalogLayout section="Financeiro" title={title} description={description}>
    <section className={cn(surfaceVariants(), "max-w-xl space-y-4 p-6")}>
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center bg-primary/10"><Icon className="size-5 text-primary" aria-hidden="true" /></span><div><p className="text-xs uppercase tracking-widest text-primary">{stage}</p><h2 className="font-semibold">Em preparo</h2></div></div>
      <p className="text-sm text-muted-foreground">Este módulo faz parte do plano do Financeiro e ainda não está disponível. Previsto:</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">{items.map(item => <li key={item}>{item}</li>)}</ul>
    </section>
  </CatalogLayout>;
}
