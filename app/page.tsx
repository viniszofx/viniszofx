import { TerminalSquareIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="w-full bg-zinc-900 min-h-screen text-zinc-200 font-sans antialiased">
      <div className="relative w-full h-[320px] md:h-[550px]">
        <img
          className="absolute inset-0 h-full w-full object-cover "
          src="/cover.png"
          alt="Cover Image"
        />
        <div className="relative z-10 flex flex-col gap-4">
          <header className="mx-auto bg-zinc-950/40 fixed top-0 left-0 right-0  flex max-w-[800px] w-full items-center justify-between py-4 px-8">
            <TerminalSquareIcon size={24} />
            <h2 className="font-mono text-zinc-50">Site em Desenvolvimento</h2>
            <Link className="text-sm" href="/">
              Login
            </Link>
          </header>

          <section className="mx-auto w-full max-w-[800px] mt-24 md:mt-36">
            <div
              className="p-8 md:py-8 md:px-16 flex justify-center items-center
             gap-4 bg-sky-950/20"
            >
              <Image
                className="max-h-full max-w-full"
                src="https://github.com/viniszofx.png"
                alt="Description"
                width={150}
                height={150}
              />
              <div className="flex flex-col gap-2">
                <p className="font-mono text-sm">Programador</p>
                <h1 className="font-semibold text-2xl">Vinicius Souza</h1>
                <div className="flex gap-2">
                  <Link
                    className="bg-sky-800 p-2"
                    href="https://www.linkedin.com/in/viniszofx"
                  >
                    Linkedin
                  </Link>
                  <Link
                    className="bg-sky-800 p-2"
                    href="https://github.com/viniszofx"
                  >
                    Github
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mx-auto max-w-[800px] p-8 md:py-8 md:px-16 md:-mt-40 md:relative flex flex-col gap-4 bg-sky-900">
        <h2 className="font-mono text-zinc-50">SOBRE</h2>
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-7">
            Sou o Vinicius, formado em Análise e Desenvolvimento de Sistemas,
            gosto de entender como as coisas funcionam, transformar ideias em
            projetos e buscar soluções que fazem sentido.
          </p>
          <p className="text-lg leading-7">
            Minha experiência passa por tecnologia, liderança acadêmica e
            ambientes institucionais, sempre com foco em autonomia, clareza e
            evolução constante. Tecnologia, para mim, é ferramenta para criar,
            simplificar e conectar.
          </p>
          <p className="text-lg leading-7">
            Vivo aprendendo, aprimorando processos e valorizando o essencial em
            cada desafio.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[800px] p-8 md:py-8 md:px-16 md:relative bg-zinc-950 flex flex-col gap-4">
        <h2 className="font-mono text-zinc-50">EXPERIÊNCIAS</h2>
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div className="flex flex-col gap-2  bg-zinc-900 p-4">
            <div className="flex justify-between text-sm text-zinc-300 font-mono">
              <p>ux designer | data analyst</p>
              <p>2023/2025</p>
            </div>
            <p className="font-semibold text-2xl text-zinc-100">
              EMBRAPA PANTANAL
            </p>
            <p className="text-lg">
              Análise de usabilidade em sistema interno e mapeamento de trafego
              de dados de pesquisas cientificas animal.
            </p>
            <Link href="#" className="bg-sky-900 px-4 py-2 max-w-max">
              SAIBA MAIS
            </Link>
          </div>
          <div className="flex flex-col gap-2  bg-zinc-900 p-4">
            <div className="flex justify-between text-sm text-zinc-300 font-mono">
              <p>ux research | analyst of system</p>
              <p>2024</p>
            </div>
            <p className="font-semibold text-2xl text-zinc-100">
              PANTANAL BOAT
            </p>
            <p className="text-lg">
              Análise de viabilidade de aplicativo de agendamento para viagem de
              barcos no pantanal
            </p>
            <Link href="#" className="bg-sky-900 px-4 py-2 max-w-max">
              SAIBA MAIS
            </Link>
          </div>
          <div className="flex flex-col gap-2  bg-zinc-900 p-4">
            <div className="flex justify-between text-sm text-zinc-300 font-mono">
              <p>ux designer | backend develper</p>
              <p>2024/2025</p>
            </div>
            <p className="font-semibold text-2xl text-zinc-100">
              INSTITUTO FEDERAL
            </p>
            <p className="text-lg">
              Desenvolvimento de sistema interno para gerenciamento de bens
              patrimoniais de instituição de ensino público
            </p>
            <Link href="#" className="bg-sky-900 px-4 py-2 max-w-max">
              SAIBA MAIS
            </Link>
          </div>
          <div className="flex flex-col gap-2  bg-zinc-900 p-4">
            <div className="flex justify-between text-sm text-zinc-300 font-mono">
              <p>ux designer | backend develper</p>
              <p>2024/2025</p>
            </div>
            <p className="font-semibold text-2xl text-zinc-100">
              INSTITUTO FEDERAL
            </p>
            <p className="text-lg">
              Desenvolvimento de sistema para gerenciamento de livros de
              biblioteca
            </p>
            <Link href="#" className="bg-sky-900 px-4 py-2 max-w-max">
              SAIBA MAIS
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto bg-sky-900 flex flex-col max-w-[800px]   md:py-8 md:px-16 p-8  gap-4 ">
        <h2 className="font-mono text-zinc-50">ARTIGOS</h2>
        <article className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="flex flex-col gap-2 bg-zinc-900 p-4 ">
            <h3 className="font-mono text-sm text-zinc-300">
              RESUMO CIENTIFICO
            </h3>
            <p className="text-zinc-100 text-lg">
              Indicadores físicos de qualidade de ovos para inovação e segurança
              alimentar em aldeias indígenas.
            </p>
            <Link href="#" className="bg-sky-800 px-4 py-2 max-w-max">
              SAIBA MAIS
            </Link>
          </article>
          <article className="flex flex-col gap-2 bg-zinc-900 p-4">
            <h3 className="font-mono text-sm text-zinc-300">
              RESUMO CIENTIFICO
            </h3>
            <p className="text-zinc-100 text-lg">
              Melhorias no fluxo de dados e experiência do usuário (ux) na
              plataforma do alelo animal (Embrapa Pantanal).
            </p>
            <Link href="#" className="bg-sky-800 px-4 py-2 max-w-max">
              SAIBA MAIS
            </Link>
          </article>
        </article>
      </section>
      <section className="mx-auto flex max-w-[800px] flex-col gap-4 p-8 md:py-8 md:px-16">
        <h2 className="font-mono">FORMAÇÃO</h2>
        <article className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-zinc-300">Formação Técnica</p>
            <span className="flex gap-2 text-sm font-mono text-sm text-zinc-300">
              <p>2025</p>
              <p>|</p>
              <p>Em Curso</p>
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Tecnico de Admninstração</h3>
            <p>Instituto Federal de Mato Grosso do Sul</p>
          </div>
          <span className=" border bg-zinc-300 container flex self-auto" />
        </article>
        <article className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-zinc-300">Graduação</p>
            <span className="flex gap-2 text-sm font-mono text-sm text-zinc-300">
              <p>2025</p>
              <p>|</p>
              <p>Concluído</p>
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">
              Analista e Desenvolvimento de Sistemas
            </h3>
            <p>Instituto Federal de Mato Grosso do Sul</p>
          </div>
          <span className=" border bg-zinc-300 container flex self-auto" />
        </article>
        <article className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-zinc-300">Curso Livre</p>
            <span className="flex gap-2 text-sm font-mono text-sm text-zinc-300">
              <p>2019</p>
              <p>|</p>
              <p>Concluído</p>
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Operador de Computador</h3>
            <p>Instituto Federal de Mato Grosso do Sul</p>
          </div>
          <span className=" border bg-zinc-300 container flex self-auto" />
        </article>
      </section>
      <footer className="mx-auto max-w-[800px] grid grid-cols-2 gap-1 bg-zinc-950 py-8 px-16 text-center text-xs">
        <div>
          <p>Made From</p>
          <p>Carbon Cycle LTDA</p>
        </div>
        <div>
          <p>© VINICCIUS</p>
          <p>Todos os direitos reservados</p>
        </div>
        <p>2026</p>
      </footer>
    </main>
  );
}
