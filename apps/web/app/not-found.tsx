import { TerminalSquareIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="w-full flex flex-col bg-zinc-900 min-h-screen text-zinc-200 font-sans antialiased">
      <div className="relative w-full h-[260px] md:h-[420px] flex-1">
        {/* <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/cover.png"
          alt="Cover Image"
        /> */}
        <div className="relative z-10 flex flex-col gap-4">
          <header className="mx-auto  bg-zinc-950/40 fixed top-0 left-0 right-0 flex max-w-[800px] w-full items-center justify-between py-4 px-8">
            <TerminalSquareIcon size={24} />
            <Link className="text-sm" href="/">
              Início
            </Link>
          </header>
          <section className="mx-auto w-full max-w-[800px] mt-20 md:mt-32">
            <div className="p-8 md:py-10 md:px-16 flex flex-col gap-4 bg-sky-950/30">
              <p className="font-mono text-sm text-sky-200">Erro 404</p>
              <h1 className="font-semibold text-3xl md:text-4xl text-zinc-50">
                Página não encontrada
              </h1>
              <p className="text-lg text-zinc-100 leading-7">
                O conteúdo que você procura não está aqui. Volte para a página
                inicial ou navegue pelas seções disponíveis.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="bg-sky-800 px-4 py-2 text-sm font-medium"
                >
                  Voltar para o início
                </Link>
                {/* <Link
                  href="/application"
                  className="border border-sky-800 px-4 py-2 text-sm font-medium text-sky-200"
                >
                  Ver aplicações
                </Link> */}
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* <section className="mx-auto max-w-[800px] p-8 md:py-8 md:px-16  flex flex-col gap-4 bg-zinc-950">
        <h2 className="font-mono text-zinc-50">Sugestões</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 p-4 flex flex-col gap-2">
            <p className="font-mono text-sm text-zinc-300">Portfolio</p>
            <p className="text-lg text-zinc-100">
              Conheça as experiências recentes e projetos em que estou
              trabalhando.
            </p>
            <Link
              href="/experiences"
              className="bg-sky-900 px-4 py-2 max-w-max"
            >
              Ver experiências
            </Link>
          </div>
          <div className="bg-zinc-900 p-4 flex flex-col gap-2">
            <p className="font-mono text-sm text-zinc-300">Contato</p>
            <p className="text-lg text-zinc-100">
              Precisa falar comigo? Vamos conversar sobre ideias ou
              colaborações.
            </p>
            <Link
              href="mailto:viniszofx@gmail.com"
              className="bg-sky-900 px-4 py-2 max-w-max"
            >
              Enviar e-mail
            </Link>
          </div>
        </div>
      </section> */}
      <footer className="mx-auto w-full  max-w-[800px] grid grid-cols-2 gap-1 bg-zinc-950 py-8 px-16 text-center text-xs">
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
