"use client";
import { profile } from "@/lib/portfolio/content";
import { proposalDays, proposalTotal, type ProposalFields } from "@/lib/proposals/store";

/*
 * Proposta comercial em A4: porta fiel de docs/brand/templates/proposta/proposta.html (mesmo HTML, mesmo CSS,
 * mesmas 6 páginas e os mesmos textos fixos), preenchida com os dados da proposta.
 * Diferenças do modelo, todas pedidas pelo manual ou pela operação:
 *  - fontes originais da marca (Raleway nos títulos, Oxanium no texto) no lugar de Montserrat e Tektur;
 *  - campo vazio sai como linha em branco para preencher à mão (com a dica pequena), nunca com valor inventado;
 *  - o total só aparece quando todas as etapas têm valor.
 * Cores sólidas, sem degradês nem transparências (docs/brand/Impressos.md).
 */

const company = "Carbon Cycle LTDA";
const cnpj = "55.366.974/0001-85";
const money = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const text = (value: string | undefined) => value?.trim() ? escape(value.trim()) : "";
/** Campo curto: o valor, ou uma linha para escrever com a dica pequena dentro. */
const fill = (value: string | undefined, hint: string, width = 32) => text(value) || `<span class="blank" style="min-width:${width}mm"><span class="hint">${escape(hint)}</span></span>`;
/** Campo de texto: o valor, ou linhas pautadas com a dica no alto. */
const area = (value: string | undefined, hint: string, lines = 2) => text(value) || `<span class="area"><span class="hint">${escape(hint)}</span>${"<span class=\"rule\"></span>".repeat(lines)}</span>`;
const brl = (value: number) => money.format(value);
const date = (value: string) => { const [y, m, d] = value.split("-"); return y && m && d ? `${d}/${m}/${y}` : ""; };

const symbol = (size: string) => `<svg viewBox="0 0 32 32" style="width:${size};height:${size}" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1b1e22"/><rect x="3" y="3" width="26" height="26" rx="5" fill="none" stroke="#d39a6c" stroke-width="2"/><path d="M10.5 10.5 16 21.5 21.5 10.5" fill="none" stroke="#e7b48a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// Filetes em losango (docs/brand/assets/Grafismos/filetes-losango.svg), opacidade fixa por traço.
const lines = `<svg viewBox="0 0 1200 400" preserveAspectRatio="xMaxYMid slice" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">${[180, 300, 420, 540, 660].map((size, index) => `<rect x="${960 - size / 2}" y="${200 - size / 2}" width="${size}" height="${size}" transform="rotate(45 960 200)" fill="none" stroke="#e1a170" stroke-opacity="${(0.45 - index * 0.07).toFixed(2)}" stroke-width="${index === 0 ? 1.5 : 1}"/>`).join("")}</svg>`;
const icon = (id: "chk" | "x" | "arr", copper = false) => `<svg class="i${copper ? " c" : ""}"><use href="#${id}"/></svg>`;

const css = `
@page{size:A4;margin:0;}
:root{
  --paper:#ffffff; --panel:#f3f5f6; --ink:#13161b; --muted:#5f646a; --rule:#dbdee1;
  --copper:#a56038; --copper-ink:#3e281b; --accent:#f1e9e3; --accent-rule:#e2cfc0;
  --graphite:#111418; --bright:#e1a170; --mark:#1b1e22;
}
*{box-sizing:border-box;}
html,body{margin:0;background:var(--paper);color:var(--ink);font-family:Oxanium,sans-serif;font-size:11px;line-height:1.65;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:var(--paper);}
.page:last-child{page-break-after:auto;}
.hd{position:absolute;left:20mm;right:20mm;top:12mm;display:flex;justify-content:space-between;align-items:center;padding-bottom:3mm;border-bottom:1px solid var(--rule);font-size:9px;}
.logo{display:flex;align-items:center;gap:7px;font-weight:600;font-size:10.5px;color:var(--ink);}
.logo i{width:17px;height:17px;border:1px solid var(--copper);border-radius:4px;display:grid;place-items:center;color:var(--copper);font-style:normal;font-size:9px;font-weight:700;}
.hd .meta{letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
.ft{position:absolute;left:20mm;right:20mm;bottom:10mm;display:flex;justify-content:space-between;padding-top:3mm;border-top:1px solid var(--rule);font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}
.ft b{color:var(--copper);font-weight:500;font-variant-numeric:tabular-nums;}
.body{position:absolute;left:20mm;right:20mm;top:27mm;bottom:22mm;}
.eyebrow{display:flex;align-items:center;gap:10px;font-size:9.5px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--copper);margin:0;}
.eyebrow .r{width:28px;height:1px;background:var(--copper);}
h1,h2,h3{font-family:Raleway,sans-serif;margin:0;letter-spacing:-.025em;color:var(--ink);}
h2{font-size:26px;line-height:1.12;font-weight:400;margin-top:4mm;}
h3{font-size:13.5px;font-weight:500;line-height:1.35;}
.lead{font-size:12.5px;line-height:1.7;color:var(--muted);margin:3mm 0 0;}
p{margin:0;}
.muted{color:var(--muted);}
.label{font-size:8.5px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);}
.label.c{color:var(--copper);}
.sec{margin-top:9mm;}
.box{border:1px solid var(--rule);padding:4.5mm;}
.panel{background:var(--panel);padding:4.5mm;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:4mm;}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;}
table{width:100%;border-collapse:collapse;font-size:10.5px;}
th{text-align:left;font-size:8.5px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:2mm 2mm 2mm 0;border-bottom:1px solid var(--ink);}
td{padding:2.6mm 2mm 2.6mm 0;border-bottom:1px solid var(--rule);vertical-align:top;}
td.n,th.n{text-align:right;padding-right:0;font-variant-numeric:tabular-nums;white-space:nowrap;}
.num{font-family:Raleway,sans-serif;font-weight:300;color:var(--copper);font-variant-numeric:tabular-nums;}
ul.l{list-style:none;padding:0;margin:0;}
ul.l li{display:flex;gap:7px;margin-bottom:1.6mm;}
svg.i{width:12px;height:12px;flex:none;margin-top:3px;}
.c{color:var(--copper);}
.sign{border-top:1px solid var(--ink);padding-top:2mm;}
/* Campo em branco para preencher à mão (no lugar do [colchete] do modelo): linha cobre com a dica pequena dentro. */
.blank{display:inline-block;vertical-align:baseline;padding:0 1mm .3mm;border-bottom:1px solid var(--copper);line-height:1.25;}
.hint{font-family:Oxanium,sans-serif;font-size:6.5px;font-weight:400;letter-spacing:.02em;text-transform:none;color:#b3b7bd;white-space:nowrap;}
.area{display:block;}
.area .rule{display:block;height:6mm;border-bottom:1px solid #c9ccd1;}
h1 .blank{min-width:110mm!important;padding-bottom:1mm;}
.dark .blank{border-bottom-color:var(--bright);}
.dark .hint{color:#6b7076;}
`;

// Textos fixos do modelo (versões curtas do site, escritas para caber na página).
const steps = [
  ["Conversa", "Você conta como o trabalho é feito hoje e o que mais incomoda. As perguntas ficam com a gente."],
  ["Proposta por escrito", "O que será feito, em quanto tempo e por quanto, dividido em etapas. <b class=\"c\" style=\"font-weight:500\">Você está aqui.</b>"],
  ["Entregas aos poucos", "A cada etapa você já usa uma parte funcionando e pode ajustar o rumo."],
  ["No ar e acompanhado", "Sistema no ar, equipe treinada, primeiros dias acompanhados. Tudo em seu nome."],
];
const rules = [
  ["Uma pessoa responsável", "A IA sugere; uma pessoa revisa, testa e responde por tudo que vai para o seu sistema."],
  ["Seus dados protegidos", "Dados de clientes, contratos e senhas não vão para ferramentas de IA sem a sua autorização."],
  ["Transparência", "Você sabe onde a IA participou do projeto e por quê. As decisões ficam registradas."],
  ["Só quando compensa", "A IA entra quando reduz prazo ou custo sem reduzir qualidade."],
];
const aiYes = ["Deixar o desenvolvimento mais rápido e mais barato", "Conferir falhas de segurança e de usabilidade", "Escrever manuais e documentação"];
const aiNo = ["Decidir as regras do seu negócio no seu lugar", "Receber dados sensíveis sem autorização", "Entregar algo que ninguém revisou"];
const questions = [
  ["O sistema fica comigo?", "Sim. O código, a documentação e os acessos ficam em seu nome. Você pode continuar com a gente ou levar para outra equipe."],
  ["Preciso entender de tecnologia?", "Não. A conversa é sobre o seu negócio, não sobre programação. Explicamos as opções em linguagem simples, e você decide com base em prazo, custo e resultado."],
  ["Vocês usam IA para fazer tudo?", "Não. A IA acelera partes repetitivas e revisa, mas o desenho da solução, as regras do seu negócio e a revisão final são feitos por pessoas."],
  ["Meus dados vão para alguma IA?", "Só com a sua autorização, e só o necessário. Explicamos qual serviço é usado, onde os dados ficam e quanto custa."],
  ["Vocês atendem fora de MS?", "Sim. O trabalho é remoto, com reuniões por vídeo e acompanhamento das entregas online."],
];

export function proposalHtml(proposal: ProposalFields) {
  const number = fill(proposal.number, "AAAA-000", 18);
  const companyName = text(proposal.companyName);
  const stages = proposal.stages;
  // Total e prazo só saem quando todas as etapas estão preenchidas; senão, linha para preencher à mão.
  const total = stages.length && stages.every(stage => stage.value) ? brl(proposalTotal(stages)) : "";
  const days = stages.length && stages.every(stage => stage.days) ? `${proposalDays(stages)} dias` : "";
  const stageCount = stages.length ? String(stages.length) : "";
  const list = (items: string[]) => items.map(item => item.trim()).filter(Boolean);
  const pains = list(proposal.pains);
  const changes = proposal.changes.filter(change => change.before.trim() || change.after.trim());
  const included = list(proposal.included).map(item => escape(item).replace("{empresa}", companyName || fill("", "Empresa", 24)));
  const excluded = list(proposal.excluded);
  const head = `<div class="hd"><span class="logo"><i>V</i>${escape(profile.name)}</span><span class="meta">Proposta ${number}</span></div>`;
  const foot = (page: string) => `<div class="ft"><span>${escape(profile.name)} · ${company}</span><b>${page}</b></div>`;
  const eyebrow = (index: string, name: string) => `<p class="eyebrow"><span>${index}</span><span class="r"></span><span>${name}</span></p>`;

  const cover = `<section class="page">
  <div class="dark" style="position:absolute;left:0;right:0;top:0;height:112mm;background:var(--graphite);overflow:hidden">
    ${lines}
    <div style="position:absolute;left:20mm;top:16mm;display:flex;align-items:center;gap:8px;color:#f0f2f4;font-weight:600;font-size:12px">${symbol("9mm")}${escape(profile.name)}</div>
    <div style="position:absolute;left:20mm;bottom:16mm;color:#f0f2f4">
      <p class="eyebrow" style="color:var(--bright)"><span>Proposta comercial</span><span class="r" style="background:var(--bright)"></span><span>Nº <span style="color:#f0f2f4">${number}</span></span></p>
      <div style="font-family:Raleway,sans-serif;font-size:40px;font-weight:300;line-height:1.05;letter-spacing:-.025em;margin-top:5mm">Menos planilha.<br><span style="font-weight:600">Mais resultado.</span></div>
    </div>
  </div>
  <div style="position:absolute;left:20mm;right:20mm;top:126mm">
    <div class="label c">Projeto</div>
    <h1 style="font-size:30px;font-weight:400;line-height:1.12;margin-top:2mm">${fill(proposal.project, "Nome do projeto")}</h1>
    <p class="lead" style="max-width:150mm">Sistema e automação sob medida para ${companyName || fill("", "nome da empresa", 40)}, com valor fechado por etapa, IA revisada por uma pessoa e tudo em nome do cliente.</p>
    <table style="margin-top:10mm">
      <tr><td class="label" style="width:38mm">Para</td><td>${fill(proposal.contactName, "Nome do contato")} · ${companyName || fill("", "Empresa")}</td></tr>
      <tr><td class="label">De</td><td>${escape(profile.name)} · Analista de sistemas · ${company}</td></tr>
      <tr><td class="label">Data</td><td>${fill(date(proposal.date), "dd/mm/aaaa", 24)}</td></tr>
      <tr><td class="label">Validade</td><td>${fill(proposal.validityDays, "nº", 10)} dias a partir da data acima</td></tr>
      <tr><td class="label">Investimento total</td><td><b style="font-weight:500">R$ ${fill(total, "0.000,00", 26)}</b>, dividido em ${fill(stageCount, "nº", 10)} etapas</td></tr>
    </table>
  </div>
  <div class="ft" style="border-top-color:var(--rule)"><span>${company} · CNPJ ${cnpj}</span><span>viniccius.com.br</span></div>
</section>`;

  const painCards = (pains.length ? pains : ["", "", "", ""]).map((pain, index) => `<div class="box"><h3>${area(pain, `Problema ${index + 1}`, 1)}</h3></div>`).join("");
  const changeRows = (changes.length ? changes : [{ before: "", after: "" }, { before: "", after: "" }, { before: "", after: "" }]).map((change, index, all) => `
        <div style="display:grid;grid-template-columns:1fr 1fr;${index < all.length - 1 ? "border-bottom:1px solid var(--rule)" : ""}">
          <div style="padding:3mm 4mm">${area(change.before, `Situação atual ${index + 1}`, 1)}</div>
          <div style="padding:3mm 4mm;display:flex;gap:7px;background:#faf6f3">${icon("arr", true)}<span style="flex:1">${area(change.after, `Como fica ${index + 1}`, 1)}</span></div>
        </div>`).join("");
  const context = `<section class="page">
  ${head}
  <div class="body">
    ${eyebrow("01", "O que ouvimos")}
    <h2>Como o trabalho é feito hoje.</h2>
    <p class="lead">Resumo da conversa inicial, nas palavras de quem faz o trabalho. Se algo estiver diferente, ajustamos antes de começar.</p>
    <div class="panel" style="margin-top:5mm;min-height:24mm">${area(proposal.today, "Como o trabalho é feito hoje: quem faz, onde os dados ficam e quanto tempo leva", 3)}</div>
    <div class="label c" style="margin-top:7mm">O que mais incomoda</div>
    <div class="grid2" style="margin-top:2mm">${painCards}</div>
    <div class="sec">
      ${eyebrow("02", "A solução")}
      <h2>O que muda na prática.</h2>
      <p class="lead">${area(proposal.solution, "O que muda na prática, em uma frase", 2)}</p>
      <div style="margin-top:5mm;border:1px solid var(--rule)">
        <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--rule)">
          <div class="label" style="padding:2.5mm 4mm">Hoje</div><div class="label c" style="padding:2.5mm 4mm;background:var(--accent)">Depois</div>
        </div>${changeRows}
      </div>
    </div>
  </div>
  ${foot("02")}
</section>`;

  const stageRows = stages.map((stage, index) => `<tr><td><span class="num" style="font-size:16px">${String(index + 1).padStart(2, "0")}</span></td><td><b style="font-weight:500">${fill(stage.title, "Nome da etapa", 50)}</b><br><span class="muted">${area(stage.deliverable, "O que fica pronto e funcionando ao fim desta etapa", 1)}</span></td><td class="n">${stage.days ? `${escape(stage.days)} dias` : fill("", "nº dias", 18)}</td><td class="n">R$ ${stage.value ? brl(Number(stage.value)) : fill("", "0.000,00", 20)}</td></tr>`).join("");
  const scope = `<section class="page">
  ${head}
  <div class="body">
    ${eyebrow("03", "Escopo e etapas")}
    <h2>O que você recebe em cada etapa.</h2>
    <p class="lead">O projeto é dividido em etapas com valor fechado. A cada uma, você já usa uma parte funcionando e pode ajustar o rumo antes que fique caro mudar.</p>
    <table style="margin-top:6mm">
      <tr><th style="width:9mm">#</th><th>Etapa e entrega</th><th class="n" style="width:24mm">Prazo</th><th class="n" style="width:30mm">Valor</th></tr>
      ${stageRows}
      <tr><td style="border-bottom:1px solid var(--ink)"></td><td style="border-bottom:1px solid var(--ink)"><b style="font-weight:500">Total</b></td><td class="n" style="border-bottom:1px solid var(--ink)"><b style="font-weight:500">${days || fill("", "nº dias", 18)}</b></td><td class="n" style="border-bottom:1px solid var(--ink)"><b style="font-weight:500">R$ ${fill(total, "0.000,00", 20)}</b></td></tr>
    </table>
    <div class="grid2" style="margin-top:8mm">
      <div class="box" style="border-color:var(--copper)">
        <div class="label c" style="display:flex;gap:6px;align-items:center">${icon("chk", true)}Está incluso</div>
        <ul class="l" style="margin-top:3mm">${included.map(item => `<li>${icon("chk", true)}<span>${item}</span></li>`).join("")}</ul>
      </div>
      <div class="box">
        <div class="label" style="display:flex;gap:6px;align-items:center">${icon("x")}Não está incluso</div>
        <ul class="l muted" style="margin-top:3mm">${(excluded.length ? excluded : [""]).map(item => `<li>${icon("x")}<span style="flex:1">${item ? escape(item) : area("", "Item fora do escopo", 1)}</span></li>`).join("")}</ul>
      </div>
    </div>
    <div class="panel" style="margin-top:6mm;display:flex;gap:4mm;align-items:flex-start">
      ${icon("arr", true)}
      <p style="font-size:10.5px">Mudou alguma coisa no meio do caminho? Combinamos por escrito antes de fazer, com prazo e valor da mudança. Sem surpresas.</p>
    </div>
  </div>
  ${foot("03")}
</section>`;

  const method = `<section class="page">
  ${head}
  <div class="body">
    ${eyebrow("04", "Como trabalhamos")}
    <h2>Do primeiro contato ao sistema no ar, em quatro passos.</h2>
    <div class="grid4" style="margin-top:6mm">${steps.map(([title, body], index) => `<div style="border-top:1px solid var(--ink);padding-top:4mm"><div class="num" style="font-size:28px">${String(index + 1).padStart(2, "0")}</div><h3 style="margin-top:2mm">${title}</h3><p class="muted" style="font-size:10px;line-height:1.6;margin-top:1.5mm">${body}</p></div>`).join("")}</div>
    <div class="sec" style="margin-top:12mm">
      ${eyebrow("05", "IA consciente")}
      <h2>A velocidade da IA, sem colocar o seu negócio em risco.</h2>
      <p class="lead">A inteligência artificial deixa o projeto mais rápido e mais barato. Para que isso não vire risco, seguimos quatro regras, e uma pessoa responde por cada entrega.</p>
      <table style="margin-top:5mm">${rules.map(([title, body], index) => `<tr><td${index ? "" : ' style="width:46mm"'}><b style="font-weight:500">${title}</b></td><td class="muted">${body}</td></tr>`).join("")}</table>
      <div class="grid2" style="margin-top:5mm">
        <div class="box" style="border-color:var(--copper)"><div class="label c">Onde a IA entra</div>
          <ul class="l" style="margin-top:2.5mm;font-size:10px">${aiYes.map(item => `<li>${icon("chk", true)}<span>${item}</span></li>`).join("")}</ul></div>
        <div class="box"><div class="label">Onde a IA não entra</div>
          <ul class="l muted" style="margin-top:2.5mm;font-size:10px">${aiNo.map(item => `<li>${icon("x")}<span>${item}</span></li>`).join("")}</ul></div>
      </div>
    </div>
  </div>
  ${foot("04")}
</section>`;

  const investment = `<section class="page">
  ${head}
  <div class="body">
    ${eyebrow("06", "Investimento e condições")}
    <h2>Valor fechado, sem surpresas.</h2>
    <div style="margin-top:6mm;display:grid;grid-template-columns:1.1fr 1fr;gap:4mm">
      <div class="dark" style="background:var(--graphite);color:#f0f2f4;padding:6mm;display:flex;flex-direction:column;justify-content:space-between;min-height:42mm">
        <div class="label" style="color:var(--bright)">Investimento total</div>
        <div><div style="font-family:Raleway,sans-serif;font-size:32px;font-weight:300;letter-spacing:-.02em;line-height:1.1">R$ ${fill(total, "0.000,00", 40)}</div>
        <p style="font-size:10px;color:#b9bec4;margin-top:2mm">Em <span style="color:#f0f2f4">${fill(stageCount, "nº", 8)}</span> etapas, pagas conforme cada uma é entregue.</p></div>
      </div>
      <table>
        <tr><td class="label" style="width:30mm">Pagamento</td><td>${fill(proposal.payment, "Ex.: por etapa, na entrega")}</td></tr>
        <tr><td class="label">Forma</td><td>${fill(proposal.paymentMethod, "Pix / boleto / transferência")}</td></tr>
        <tr><td class="label">Início</td><td>${fill(proposal.start, "Até nº dias após o aceite")}</td></tr>
        <tr><td class="label">Validade</td><td>${fill(proposal.validityDays, "nº", 10)} dias</td></tr>
      </table>
    </div>
    <div class="sec" style="margin-top:12mm">
      ${eyebrow("07", "Perguntas frequentes")}
      <h2>Antes de decidir.</h2>
      <div style="margin-top:4mm;border-top:1px solid var(--rule)">${questions.map(([question, answer]) => `<div style="padding:3.2mm 0;border-bottom:1px solid var(--rule)"><h3>${question}</h3><p class="muted" style="margin-top:1mm">${answer}</p></div>`).join("")}</div>
    </div>
  </div>
  ${foot("05")}
</section>`;

  const accept = `<section class="page">
  ${head}
  <div class="body">
    ${eyebrow("08", "Próximos passos")}
    <h2>Para começar.</h2>
    <table style="margin-top:5mm">
      <tr><td style="width:12mm"><span class="num" style="font-size:16px">01</span></td><td>Leia a proposta e anote dúvidas ou ajustes. Respondemos por escrito.</td></tr>
      <tr><td><span class="num" style="font-size:16px">02</span></td><td>Assine o aceite abaixo e envie para <b style="font-weight:500">${escape(profile.email)}</b>.</td></tr>
      <tr><td><span class="num" style="font-size:16px">03</span></td><td>Marcamos a primeira reunião da etapa 01 e começamos.</td></tr>
    </table>
    <div class="sec" style="margin-top:12mm">
      <p class="eyebrow"><span>Aceite</span></p>
      <p style="margin-top:4mm;font-size:11.5px;line-height:1.75">Declaro que li e aceito esta proposta (nº ${number}), com o escopo, as etapas, os prazos e os valores descritos acima.</p>
      <div class="grid2" style="margin-top:22mm;gap:12mm">
        <div class="sign"><b style="font-weight:500">${text(proposal.contactName) || '<span class="label">Nome do responsável</span>'}</b><br><span class="muted">${companyName || '<span class="label">Empresa</span>'} · ${text(proposal.companyDocument) || '<span class="label">CNPJ</span>'}</span></div>
        <div class="sign"><b style="font-weight:500">${escape(profile.name)}</b><br><span class="muted">${company} · CNPJ ${cnpj}</span></div>
      </div>
      <div class="grid2" style="margin-top:10mm;gap:12mm">
        <div class="sign"><span class="label">Local e data</span></div>
        <div class="sign"><span class="label">Local e data</span></div>
      </div>
    </div>
  </div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:62mm;background:var(--graphite);overflow:hidden">
    ${lines}
    <div style="position:absolute;left:20mm;top:11mm;right:20mm">
      <p class="eyebrow" style="color:var(--bright)"><span>Contato</span></p>
      <div style="font-family:Raleway,sans-serif;font-size:20px;line-height:1.15;letter-spacing:-.025em;margin-top:3mm;color:#f0f2f4;max-width:120mm">Quem responde é quem vai construir.</div>
      <p style="margin-top:3mm;font-size:10.5px;color:#b9bec4">${escape(profile.email)} · viniccius.com.br · linkedin.com/in/viniszofx</p>
    </div>
    <div style="position:absolute;left:20mm;right:20mm;bottom:8mm;display:flex;justify-content:space-between;align-items:flex-end;font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;color:#8d9399;border-top:1px solid #2a2e33;padding-top:3mm">
      <span>${company} · CNPJ ${cnpj}</span>${symbol("8mm")}
    </div>
  </div>
</section>`;

  const sprite = `<svg width="0" height="0" style="position:absolute"><defs>
    <symbol id="chk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
    <symbol id="arr" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  </defs></svg>`;
  return { css, body: sprite + cover + context + scope + method + investment + accept };
}

/** Abre o diálogo de impressão (Salvar como PDF) num iframe isolado, depois de carregar as fontes da marca. */
export function printProposal(proposal: ProposalFields) {
  const { css: style, body } = proposalHtml(proposal);
  document.querySelector("iframe[data-proposal-frame]")?.remove();
  const frame = document.createElement("iframe");
  frame.dataset.proposalFrame = "";
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0";
  document.body.append(frame);
  const doc = frame.contentDocument; const view = frame.contentWindow;
  if (!doc || !view) { frame.remove(); return; }
  const fonts = "https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600;700&family=Raleway:wght@300;400;500;600&display=block";
  doc.open();
  doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${escape(proposal.number)} · ${escape(proposal.project || profile.name)}</title><link rel="stylesheet" href="${fonts}"><style>${style}</style></head><body>${body}</body></html>`);
  doc.close();
  const go = () => { view.focus(); view.print(); };
  view.addEventListener("afterprint", () => setTimeout(() => frame.remove(), 1000), { once: true });
  // Espera a folha de fontes carregar e as fontes ficarem prontas (no máximo 4 s, para não travar sem internet).
  const loaded = new Promise<void>(resolve => { if (doc.readyState === "complete") resolve(); else view.addEventListener("load", () => resolve(), { once: true }); });
  const ready = loaded.then(() => doc.fonts?.ready).then(() => undefined);
  Promise.race([ready, new Promise(resolve => setTimeout(resolve, 4000))]).then(() => setTimeout(go, 150));
}
