"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    router.push("/dashboard");
  }

  const inputClassName = "h-12 w-full bg-muted/60 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" placeholder="voce@exemplo.com" required className={inputClassName} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" required className={inputClassName} />
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Acesso demonstrativo. Informe um e-mail válido e qualquer senha para conhecer o dashboard.
      </p>
    </form>
  );
}
