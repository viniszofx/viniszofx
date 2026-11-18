"use client";
import { aiPrinciples, aiUses, faq, processSteps } from "@/lib/portfolio/services";
import { profile } from "@/lib/portfolio/content";
import { proposalDays, proposalTotal, type ProposalFields } from "@/lib/proposals/store";

/*
 * Proposta comercial em A4 no padrão de docs/brand/Impressos.md: papel claro, cobre #a56038 como destaque,
 * faixa grafite só na capa e no contato final, cores sólidas (sem degradês nem transparências) e fontes da marca.
 * Os textos fixos (processo, IA consciente, perguntas) vêm do site (lib/portfolio/services.ts): se o site mudar,
 * a proposta muda junto. Campo vazio sai em branco, com linha para preencher à mão, nunca com valor inventado.
 */

const company = "Carbon Cycle LTDA";
const cnpj = "55.366.974/0001-85";
const money = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
// Campo vazio sai como espaço para preencher à mão: uma linha (ou várias, em textos) com a dica embaixo, em cinza.
const fill = (value: string | undefined, hint: string) => value?.trim() ? escape(value.trim()) : `<span class="blank"><span class="hint">${escape(hint)}</span></span>`;
const area = (value: string | undefined, hint: string, lines = 3) => value?.trim() ? escape(value.trim()) : `<span class="lines-blank"><span class="hint">${escape(hint)}</span>${"<span class=\"rule\"></span>".repeat(lines)}</span>`;
const brl = (value: string) => value ? money.format(Number(value)) : "";
const date = (value: string) => { const [y, m, d] = value.split("-"); return y && m && d ? `${d}/${m}/${y}` : ""; };

const symbol = `<svg class="symbol" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1b1e22"/><rect x="3" y="3" width="26" height="26" rx="5" fill="none" stroke="#d39a6c" stroke-width="2"/><path d="M10.5 10.5 16 21.5 21.5 10.5" fill="none" stroke="#e7b48a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// Filetes em losango (padrão 01) com opacidade fixa por traço: sólido, sem degradê.
const lines = `<svg class="lines" viewBox="0 0 1200 400" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">${[180, 300, 420, 540, 660].map((size, index) => `<rect x="${960 - size / 2}" y="${200 - size / 2}" width="${size}" height="${size}" transform="rotate(45 960 200)" fill="none" stroke="#e1a170" stroke-opacity="${(0.45 - index * 0.07).toFixed(2)}" stroke-width="${index === 0 ? 1.5 : 1}"/>`).join("")}</svg>`;
const check = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const cross = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const arrow = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const css = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #13161b; font: 11pt/1.65 Oxanium, system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { position: relative; width: 210mm; min-height: 297mm; padding: 27mm 20mm 22mm; break-after: page; }
.page:last-child { break-after: auto; }
.head { position: absolute; top: 12mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; align-items: center; padding-bottom: 2.5mm; border-bottom: 1px solid #dbdee1; font-size: 9pt; }
.brand { display: flex; align-items: center; gap: 2.5mm; font-weight: 600; }
.symbol { width: 7mm; height: 7mm; }
.doc { color: #5f646a; }
.foot { position: absolute; bottom: 10mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; padding-top: 2.5mm; border-top: 1px solid #dbdee1; font-size: 8.5pt; color: #5f646a; }
.foot b { color: #a56038; font-weight: 500; }
h1, h2, h3, .num { font-family: Raleway, system-ui, sans-serif; letter-spacing: -0.025em; margin: 0; }
h2 { font-size: 26pt; font-weight: 400; line-height: 1.15; margin-top: 3mm; }
h3 { font-size: 13.5pt; font-weight: 500; line-height: 1.35; }
.eyebrow { display: flex; align-items: center; gap: 3mm; color: #a56038; font-size: 9.5pt; font-weight: 500; text-transform: uppercase; letter-spacing: .2em; }
.eyebrow i { width: 7.4mm; height: 1px; background: #a56038; }
.lead { color: #5f646a; font-size: 12.5pt; margin: 3mm 0 0; }
.label { font-size: 8.5pt; font-weight: 500; text-transform: uppercase; letter-spacing: .2em; color: #5f646a; }
section + section { margin-top: 11mm; }
p { margin: 0; }
/* Espaço para escrever à mão: linha sólida (sem tracejado nem transparência) e a dica pequena embaixo. */
.blank { display: inline-block; position: relative; min-width: 34mm; height: 1.3em; vertical-align: bottom; border-bottom: 1px solid #a56038; margin: 0 1mm; }
.lines-blank { display: block; position: relative; width: 100%; padding-top: 1mm; }
.lines-blank .rule { display: block; height: 8mm; border-bottom: 1px solid #c9ccd1; }
.hint { position: absolute; left: 0; bottom: -3.6mm; white-space: nowrap; font: 400 6.5pt/1 Oxanium, system-ui, sans-serif; letter-spacing: .02em; color: #9da2a9; text-transform: none; }
.lines-blank .hint { bottom: auto; top: 1mm; }
.stages .r .blank, .facts .blank, .conds .blank { min-width: 24mm; }
.ico { width: 4.2mm; height: 4.2mm; flex: none; margin-top: .8mm; }
.cover-band { position: relative; margin: -27mm -20mm 0; height: 112mm; background: #111418; color: #f0f2f4; padding: 30mm 20mm 0; overflow: hidden; }
.cover-band .head { border-color: #2a2e34; color: #f0f2f4; }
.cover-band .doc { color: #9da2a9; }
.cover-band .lines, .contact .lines { position: absolute; inset: 0; width: 100%; height: 100%; }
.cover-band h1 { position: relative; font-size: 40pt; font-weight: 300; line-height: 1.05; margin-top: 18mm; }
.cover-band h1 b { font-weight: 600; }
.project { margin-top: 12mm; }
.project .name { font-family: Raleway, system-ui, sans-serif; font-size: 30pt; font-weight: 400; letter-spacing: -0.025em; line-height: 1.15; margin-top: 2mm; }
.project p { color: #5f646a; margin-top: 3mm; max-width: 150mm; }
table { width: 100%; border-collapse: collapse; }
.facts { margin-top: 10mm; }
.facts th { width: 40mm; text-align: left; vertical-align: top; padding: 3mm 0; border-bottom: 1px solid #dbdee1; }
.facts td { padding: 3mm 0; border-bottom: 1px solid #dbdee1; }
.facts small, .muted { color: #5f646a; }
.pains { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 4mm; }
.pain { border: 1px solid #dbdee1; padding: 4mm 5mm; font-family: Raleway, system-ui, sans-serif; font-weight: 500; font-size: 12pt; letter-spacing: -0.02em; }
.panel { background: #f3f5f6; padding: 5mm 6mm; margin-top: 4mm; }
.compare { margin-top: 5mm; }
.compare th { text-align: left; padding: 2.5mm 4mm; font-size: 8.5pt; font-weight: 500; text-transform: uppercase; letter-spacing: .2em; border-bottom: 1px solid #13161b; }
.compare th.after { background: #f1e9e3; }
.compare td { padding: 3.5mm 4mm; border-bottom: 1px solid #dbdee1; vertical-align: top; }
.compare td.sep { width: 10mm; color: #a56038; padding: 3.5mm 0; }
.stages { margin-top: 6mm; }
.stages th { text-align: left; font-size: 8.5pt; font-weight: 500; text-transform: uppercase; letter-spacing: .2em; color: #5f646a; padding: 2mm 2mm; border-bottom: 1px solid #13161b; }
.stages td { padding: 3.5mm 2mm; border-bottom: 1px solid #dbdee1; vertical-align: top; }
.stages .n { width: 12mm; font-family: Raleway, system-ui, sans-serif; font-weight: 300; font-size: 16pt; color: #a56038; font-variant-numeric: tabular-nums; }
.stages .r { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.stages tfoot td { border-top: 1px solid #13161b; border-bottom: 0; font-weight: 600; }
.boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 7mm; }
.box { border: 1px solid #dbdee1; padding: 5mm; }
.box.in { border-color: #a56038; }
.box ul { list-style: none; margin: 3mm 0 0; padding: 0; display: grid; gap: 2mm; }
.box li { display: flex; gap: 2.5mm; }
.box.in .ico, .box.in .label { color: #a56038; }
.box.out li { color: #5f646a; }
.note { display: flex; gap: 3mm; background: #f3f5f6; padding: 4mm 5mm; margin-top: 5mm; }
.note .ico, .steps .num, .rules .num { color: #a56038; }
.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; margin-top: 6mm; }
.steps > div { border-top: 1px solid #13161b; padding-top: 3mm; }
.steps .num { font-size: 22pt; font-weight: 300; }
.steps h3 { margin-top: 1.5mm; }
.steps p { font-size: 9.5pt; color: #5f646a; margin-top: 1.5mm; }
.here { display: inline-block; margin-top: 2mm; background: #f1e9e3; color: #3e281b; font-size: 8pt; padding: .5mm 2mm; text-transform: uppercase; letter-spacing: .15em; }
.rules { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 8mm; margin-top: 6mm; }
.rules p { font-size: 9.5pt; color: #5f646a; margin-top: 1mm; }
.value { background: #111418; color: #f0f2f4; padding: 7mm 8mm; margin-top: 6mm; }
.value .label { color: #e1a170; }
.value .big { font-family: Raleway, system-ui, sans-serif; font-weight: 300; font-size: 32pt; letter-spacing: -0.025em; margin-top: 2mm; }
.value p { color: #9da2a9; margin-top: 2mm; }
.conds { margin-top: 5mm; }
.conds th { width: 40mm; text-align: left; font-weight: 500; padding: 2.5mm 0; border-bottom: 1px solid #dbdee1; }
.conds td { padding: 2.5mm 0; border-bottom: 1px solid #dbdee1; }
.faq { margin-top: 5mm; display: grid; gap: 4mm; }
.faq p { color: #5f646a; margin-top: 1mm; font-size: 10pt; }
.next { margin-top: 5mm; display: grid; gap: 3mm; }
.next div { display: flex; gap: 4mm; }
.next .num { color: #a56038; font-weight: 300; font-size: 16pt; width: 10mm; }
.accept { margin-top: 9mm; border: 1px solid #dbdee1; padding: 6mm; }
.accept p { margin-top: 2mm; }
.signs { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 18mm; }
.signs div { border-top: 1px solid #13161b; padding-top: 2mm; }
.signs b { display: block; font-weight: 500; }
.signs small { color: #5f646a; }
.contact { position: relative; margin: 12mm -20mm 0; background: #111418; color: #f0f2f4; padding: 10mm 20mm; min-height: 62mm; overflow: hidden; }
.contact .label { color: #e1a170; position: relative; }
.contact h2 { position: relative; color: #f0f2f4; font-size: 22pt; }
.contact p { position: relative; color: #9da2a9; margin-top: 3mm; }
`;

export function proposalHtml(proposal: ProposalFields) {
  const number = fill(proposal.number, "AAAA-000");
  const companyName = proposal.companyName.trim();
  // Total só sai quando todas as etapas têm valor (e prazo); senão sai em branco para preencher à mão, nunca uma soma parcial.
  const complete = proposal.stages.length > 0 && proposal.stages.every(stage => stage.value);
  const total = complete ? proposalTotal(proposal.stages) : 0;
  const days = proposal.stages.length > 0 && proposal.stages.every(stage => stage.days) ? proposalDays(proposal.stages) : 0;
  const head = `<div class="head"><span class="brand">${symbol}${escape(profile.name)}</span><span class="doc">Proposta ${number}</span></div>`;
  const foot = (page: number) => `<div class="foot"><span>${escape(profile.name)} · ${company}</span><b>${String(page).padStart(2, "0")}</b></div>`;
  const eyebrow = (index: string, name: string) => `<p class="eyebrow">${index}<i></i>${name}</p>`;
  const list = (items: string[]) => items.map(item => item.trim()).filter(Boolean);
  const pains = list(proposal.pains);
  const changes = proposal.changes.filter(change => change.before.trim() || change.after.trim());
  const included = list(proposal.included).map(item => item.replace("{empresa}", companyName || "[Empresa]"));
  const excluded = list(proposal.excluded);
  const faqItems = [3, 1, 4, 5, 6].map(index => faq[index]).filter(Boolean);

  const cover = `<div class="page">
    <div class="cover-band">${lines}<div class="head"><span class="brand">${symbol}${escape(profile.name)}</span><span class="doc">Proposta comercial · Nº ${number}</span></div>
      <h1>Menos planilha.<br><b>Mais resultado.</b></h1></div>
    <div class="project"><p class="label">Projeto</p><p class="name">${fill(proposal.project, "Nome do projeto")}</p>
      <p>Sistema e automação sob medida para ${fill(companyName, "nome da empresa")}, com valor fechado por etapa, IA revisada por uma pessoa e tudo em nome do cliente.</p></div>
    <table class="facts">
      <tr><th class="label">Para</th><td>${fill(proposal.contactName, "Nome do contato")} · ${fill(companyName, "Empresa")}</td></tr>
      <tr><th class="label">De</th><td>${escape(profile.name)} · Analista de sistemas · ${company}</td></tr>
      <tr><th class="label">Data</th><td>${fill(date(proposal.date), "dd/mm/aaaa")}</td></tr>
      <tr><th class="label">Validade</th><td>${fill(proposal.validityDays && `${proposal.validityDays} dias`, "nº dias")} <small>a partir da data acima</small></td></tr>
      <tr><th class="label">Investimento total</th><td>R$ ${total ? brl(total.toFixed(2)) : fill("", "0.000,00")}, dividido em ${proposal.stages.length || fill("", "nº")} etapas</td></tr>
    </table>
    <div class="foot"><span>${company} · CNPJ ${cnpj}</span><span>viniccius.com.br</span></div>
  </div>`;

  const heard = `<div class="page">${head}
    <section>${eyebrow("01", "O que ouvimos")}<h2>Como o trabalho é feito hoje.</h2>
      <p class="lead">Resumo da conversa inicial, nas palavras de quem faz o trabalho. Se algo estiver diferente, ajustamos antes de começar.</p>
      <div class="panel">${area(proposal.today, "Como o trabalho é feito hoje: quem faz, onde os dados ficam e quanto tempo leva", 4)}</div>
      <p class="label" style="margin-top:6mm">O que mais incomoda</p>
      <div class="pains">${(pains.length ? pains : ["", ""]).map((pain, index) => `<div class="pain">${area(pain, `Problema ${index + 1}`, 2)}</div>`).join("")}</div></section>
    <section>${eyebrow("02", "A solução")}<h2>O que muda na prática.</h2>
      <p class="lead">${area(proposal.solution, "O que muda na prática, em uma frase", 2)}</p>
      <table class="compare"><thead><tr><th>Hoje</th><th></th><th class="after">Depois</th></tr></thead><tbody>
        ${(changes.length ? changes : [{ before: "", after: "" }]).map((change, index) => `<tr><td>${area(change.before, `Hoje ${index + 1}`, 2)}</td><td class="sep">${arrow}</td><td>${area(change.after, `Depois ${index + 1}`, 2)}</td></tr>`).join("")}
      </tbody></table></section>
    ${foot(2)}</div>`;

  const scope = `<div class="page">${head}
    <section>${eyebrow("03", "Escopo e etapas")}<h2>O que você recebe em cada etapa.</h2>
      <p class="lead">O projeto é dividido em etapas com valor fechado. A cada uma, você já usa uma parte funcionando e pode ajustar o rumo antes que fique caro mudar.</p>
      <table class="stages"><thead><tr><th>#</th><th>Etapa e entrega</th><th class="r">Prazo</th><th class="r">Valor</th></tr></thead><tbody>
        ${proposal.stages.map((stage, index) => `<tr><td class="n">${String(index + 1).padStart(2, "0")}</td><td><h3>${fill(stage.title, "Nome da etapa")}</h3><p class="muted">${area(stage.deliverable, "O que fica pronto ao fim desta etapa", 2)}</p></td><td class="r">${fill(stage.days && `${stage.days} dias`, "nº dias")}</td><td class="r">R$ ${stage.value ? brl(stage.value) : fill("", "0.000,00")}</td></tr>`).join("")}
      </tbody><tfoot><tr><td></td><td>Total</td><td class="r">${days ? `${days} dias` : fill("", "nº dias")}</td><td class="r">R$ ${total ? brl(total.toFixed(2)) : fill("", "0.000,00")}</td></tr></tfoot></table>
      <div class="boxes">
        <div class="box in"><p class="label">Está incluso</p><ul>${included.map(item => `<li>${check}<span>${escape(item)}</span></li>`).join("")}</ul></div>
        <div class="box out"><p class="label">Não está incluso</p><ul>${(excluded.length ? excluded : [""]).map(item => `<li>${cross}<span>${fill(item, "Item fora do escopo")}</span></li>`).join("")}</ul></div>
      </div>
      <div class="note">${arrow}<p>Mudou alguma coisa no meio do caminho? Combinamos por escrito antes de fazer, com prazo e valor da mudança. Sem surpresas.</p></div></section>
    ${foot(3)}</div>`;

  const method = `<div class="page">${head}
    <section>${eyebrow("04", "Como trabalhamos")}<h2>Do primeiro contato ao sistema no ar, em quatro passos.</h2>
      <div class="steps">${processSteps.map((step, index) => `<div><p class="num">${String(index + 1).padStart(2, "0")}</p><h3>${escape(step.title)}</h3><p>${escape(step.description)}</p>${index === 1 ? `<span class="here">Você está aqui</span>` : ""}</div>`).join("")}</div></section>
    <section>${eyebrow("05", "IA consciente")}<h2>A velocidade da IA, sem colocar o seu negócio em risco.</h2>
      <p class="lead">A inteligência artificial deixa o projeto mais rápido e mais barato. Para que isso não vire risco, seguimos quatro regras, e uma pessoa responde por cada entrega.</p>
      <div class="rules">${aiPrinciples.map(rule => `<div><h3>${escape(rule.title)}</h3><p>${escape(rule.description)}</p></div>`).join("")}</div>
      <div class="boxes">
        <div class="box in"><p class="label">Onde a IA entra</p><ul>${aiUses.yes.slice(0, 3).map(item => `<li>${check}<span>${escape(item)}</span></li>`).join("")}</ul></div>
        <div class="box out"><p class="label">Onde a IA não entra</p><ul>${aiUses.no.slice(0, 3).map(item => `<li>${cross}<span>${escape(item)}</span></li>`).join("")}</ul></div>
      </div></section>
    ${foot(4)}</div>`;

  const money_ = `<div class="page">${head}
    <section>${eyebrow("06", "Investimento e condições")}<h2>Valor fechado, sem surpresas.</h2>
      <div class="value"><p class="label">Investimento total</p><p class="big">R$ ${total ? brl(total.toFixed(2)) : fill("", "0.000,00")}</p><p>Em ${proposal.stages.length || fill("", "nº")} etapas, pagas conforme cada uma é entregue.</p></div>
      <table class="conds">
        <tr><th>Pagamento</th><td>${fill(proposal.payment, "Ex.: por etapa, na entrega")}</td></tr>
        <tr><th>Forma</th><td>${fill(proposal.paymentMethod, "Pix / boleto / transferência")}</td></tr>
        <tr><th>Início</th><td>${fill(proposal.start, "Até nº dias após o aceite")}</td></tr>
        <tr><th>Validade</th><td>${fill(proposal.validityDays && `${proposal.validityDays} dias`, "nº dias")}</td></tr>
        <tr><th>Acompanhamento</th><td>${fill(proposal.followUpDays && `${proposal.followUpDays} dias após a publicação`, "nº dias")}</td></tr>
      </table></section>
    <section>${eyebrow("07", "Perguntas frequentes")}<h2>Antes de decidir.</h2>
      <div class="faq">${faqItems.map(item => `<div><h3>${escape(item.question)}</h3><p>${escape(item.answer)}</p></div>`).join("")}</div></section>
    ${foot(5)}</div>`;

  const next = `<div class="page">${head}
    <section>${eyebrow("08", "Próximos passos")}<h2>Para começar.</h2>
      <div class="next">
        <div><span class="num">01</span><p>Leia a proposta e anote dúvidas ou ajustes. Respondemos por escrito.</p></div>
        <div><span class="num">02</span><p>Assine o aceite abaixo e envie para ${escape(profile.email)}.</p></div>
        <div><span class="num">03</span><p>Marcamos a primeira reunião da etapa 01 e começamos.</p></div>
      </div>
      <div class="accept"><p class="label">Aceite</p>
        <p>Declaro que li e aceito esta proposta (nº ${number}), com o escopo, as etapas, os prazos e os valores descritos acima.</p>
        <div class="signs">
          <div><b>${fill(proposal.contactName, "Nome do responsável")}</b><small>${fill(companyName, "Empresa")} · ${fill(proposal.companyDocument, "CNPJ")}</small><br><small>Local e data</small></div>
          <div><b>${escape(profile.name)}</b><small>${company} · CNPJ ${cnpj}</small><br><small>Local e data</small></div>
        </div>
      </div></section>
    <div class="contact">${lines}<p class="label">Contato</p><h2>Quem responde é quem vai construir.</h2><p>${escape(profile.email)} · viniccius.com.br · linkedin.com/in/viniszofx</p><p>${company} · CNPJ ${cnpj}</p></div>
    ${foot(6)}</div>`;

  return { css, body: cover + heard + scope + method + money_ + next };
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
  const fonts = "https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;600&family=Raleway:wght@300;400;500;600&display=block";
  doc.open();
  doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${escape(proposal.number)} · ${escape(proposal.project || "Vinicius Souza")}</title><link rel="stylesheet" href="${fonts}"><style>${style}</style></head><body>${body}</body></html>`);
  doc.close();
  const go = () => { view.focus(); view.print(); };
  view.addEventListener("afterprint", () => setTimeout(() => frame.remove(), 1000), { once: true });
  // Espera a folha de fontes carregar e as fontes ficarem prontas (no máximo 4 s, para não travar sem internet).
  const loaded = new Promise<void>(resolve => { if (doc.readyState === "complete") resolve(); else view.addEventListener("load", () => resolve(), { once: true }); });
  const ready = loaded.then(() => doc.fonts?.ready).then(() => undefined);
  Promise.race([ready, new Promise(resolve => setTimeout(resolve, 4000))]).then(() => setTimeout(go, 150));
}
