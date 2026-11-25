import type { Metadata } from "next";
import type { ReactNode } from "react";
import { profile } from "@/lib/portfolio/content";
import { cn } from "@/lib/utils";

/*
 * Política de privacidade. Descreve só o que o código e a infraestrutura fazem hoje: widget de conversa
 * (components/marketing/lead-chat.tsx), app/api/leads/route.ts, cookie de tema (lib/theme.ts), login pelo Neon Auth,
 * hospedagem na Vercel (região iad1, EUA) e banco, login e arquivos na Neon (AWS). Ao mudar algo disso, atualize
 * a página e a data no topo.
 */
export const metadata: Metadata = {
  title: "Privacidade | Vinicius Souza",
  description: "Como os dados enviados pelo site viniccius.com.br são coletados, usados e protegidos.",
  alternates: { canonical: "/privacidade" },
};

const container = "mx-auto w-full max-w-3xl px-5 sm:px-8";
const label = "font-mono text-xs font-medium uppercase";

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return <section className="border-t border-foreground py-10">
    <p className={cn(label, "flex items-center gap-3")}><span className="tabular-nums">{index}</span><span aria-hidden="true" className="h-px w-8 bg-current" /></p>
    <h2 className="mt-4 text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl">{title}</h2>
    <div className="mt-5 space-y-4 text-lg leading-relaxed text-pretty text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">{children}</div>
  </section>;
}

export default function PrivacyPage() {
  return <main id="conteudo" className="pb-24">
    <div className={cn(container, "pt-16 pb-12 sm:pt-24")}>
      <h1 className="mt-2 text-6xl leading-[0.95] font-medium tracking-[-0.06em] text-balance sm:text-8xl">Privacidade</h1>
      <p className="mt-8 text-xl leading-tight tracking-[-0.03em] text-pretty text-muted-foreground">O que acontece com os dados que você envia por este site, em linguagem simples. Sem venda de dados, sem rastreamento de anúncios.</p>
      <p className={cn(label, "mt-6 text-muted-foreground")}>Última atualização: 24 de novembro de 2026</p>
    </div>

    <div className={container}>
      <Section index="01" title="Quem cuida dos seus dados">
        <p>O controlador dos dados é a <strong>Carbon Cycle LTDA</strong>, CNPJ 55.366.974/0001-85, responsável pelo site viniccius.com.br.</p>
        <p>Para qualquer assunto sobre os seus dados, escreva para <a href={`mailto:${profile.email}`} className="text-foreground underline underline-offset-4">{profile.email}</a>. O encarregado pelo tratamento de dados é <strong>Vinicius Souza</strong>, no mesmo e-mail.</p>
      </Section>

      <Section index="02" title="O que coletamos">
        <p>Só coletamos dados quando <strong>você mesmo envia uma mensagem</strong> pelo botão de conversa do site:</p>
        <ul>
          <li><strong>Nome</strong> e <strong>e-mail</strong>, para saber com quem falar e para onde responder.</li>
          <li><strong>Empresa</strong> e <strong>telefone</strong>, se você quiser informar. Os dois são opcionais.</li>
          <li><strong>Assunto e mensagem</strong>, com o que você escreveu sobre o seu caso.</li>
          <li><strong>De onde veio o contato</strong>: a página do site em que a conversa foi aberta, o site anterior (se o navegador informar) e os parâmetros de campanha do endereço (utm), quando existirem.</li>
        </ul>
        <p>O <strong>endereço IP</strong> é usado só no momento do envio, para barrar mensagens em massa, e fica na memória do servidor por até 10 minutos. Ele <strong>não é gravado</strong> junto com o seu contato. Como em qualquer site, a hospedagem registra por pouco tempo dados técnicos de cada acesso (como IP, navegador e página visitada) para segurança e funcionamento.</p>
        <p>Quem tem conta na <strong>área privada</strong> também tem nome, e-mail e senha guardados pelo serviço de login, só para entrar no sistema.</p>
      </Section>

      <Section index="03" title="Para que usamos">
        <ul>
          <li>Responder o seu contato e, se fizer sentido, preparar uma proposta.</li>
          <li>Entender quais páginas e campanhas trazem contatos, de forma agregada.</li>
        </ul>
        <p>Não vendemos nem alugamos dados, não enviamos propaganda sem você pedir e <strong>não enviamos seus dados a ferramentas de inteligência artificial</strong> sem a sua autorização.</p>
        <p>Base legal (LGPD, art. 7º): para responder o contato, os <strong>procedimentos preliminares a um contrato</strong>, a seu pedido (inciso V); para entender a origem dos contatos, o <strong>legítimo interesse</strong> (inciso IX), sem identificar você em relatórios.</p>
      </Section>

      <Section index="04" title="Onde ficam e por quanto tempo">
        <p>Os dados ficam no banco de dados do próprio site, com acesso restrito a quem trabalha no atendimento. Usamos dois provedores:</p>
        <ul>
          <li><strong>Vercel</strong>, que hospeda o site.</li>
          <li><strong>Neon</strong>, sobre a nuvem da Amazon Web Services, que guarda o banco de dados, o login da área privada e os arquivos.</li>
        </ul>
        <p>Os servidores ficam nos <strong>Estados Unidos</strong>. Por isso há transferência internacional de dados (LGPD, art. 33), feita com provedores que mantêm criptografia e controles de segurança reconhecidos no mercado.</p>
        <p>Guardamos o contato por <strong>24 meses após a última conversa</strong> ou até você pedir a exclusão, o que vier primeiro. Se o contato virar um contrato, os dados seguem as regras do contrato.</p>
      </Section>

      <Section index="05" title="Cookies">
        <p>O site não usa cookies de publicidade nem ferramentas de rastreamento. Usamos apenas:</p>
        <ul>
          <li><strong>Preferência de tema</strong> (claro ou escuro), se você escolher um. Fica só no seu navegador.</li>
          <li><strong>Sessão de login</strong>, apenas para quem entra na área privada do site.</li>
        </ul>
        <p>As fontes do site são servidas pelo próprio site, sem chamar serviços externos.</p>
      </Section>

      <Section index="06" title="Seus direitos">
        <p>Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir a qualquer momento:</p>
        <ul>
          <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
          <li>Correção de dados incompletos ou desatualizados.</li>
          <li>Exclusão dos dados, ou anonimização.</li>
          <li>Informação sobre com quem os dados foram compartilhados.</li>
          <li>Revogação de um consentimento que tenha dado.</li>
        </ul>
        <p>Basta escrever para <a href={`mailto:${profile.email}`} className="text-foreground underline underline-offset-4">{profile.email}</a>. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      </Section>

      <Section index="07" title="Mudanças nesta política">
        <p>Se algo mudar no que coletamos ou em como usamos, esta página é atualizada e a data no topo muda junto.</p>
      </Section>
    </div>
  </main>;
}
