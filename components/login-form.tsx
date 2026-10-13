"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type AuthMode = "sign-in" | "sign-up";

function isInvalidOrigin(cause: unknown) {
  if (cause && typeof cause === "object") {
    const value = cause as { code?: unknown; message?: unknown };
    return value.code === "INVALID_ORIGIN" || (typeof value.message === "string" && /invalid origin/i.test(value.message));
  }
  return false;
}

const originMessage = "Login indisponível neste domínio. Entre em contato com o administrador.";

export function LoginForm({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      if (mode === "sign-up" && password !== form.get("confirmPassword")) {
        setError("As senhas não coincidem.");
        return;
      }
      const result = mode === "sign-up"
        ? await authClient.signUp.email({ name: String(form.get("name") ?? "").trim(), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(isInvalidOrigin(result.error) ? originMessage : result.error.message || "Não foi possível entrar. Confira seus dados.");
        return;
      }
      if (mode === "sign-up") {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          setMode("sign-in");
          setMessage("Conta criada. Verifique seu e-mail, se necessário, e entre para continuar.");
          router.refresh();
          return;
        }
      }
      window.location.replace("/dashboard");
    } catch (cause) {
      setError(isInvalidOrigin(cause) ? originMessage : "Não foi possível conectar ao serviço de autenticação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName = "h-12 w-full bg-muted/60 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {mode === "sign-up" && <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">Nome</label>
        <input id="name" name="name" type="text" autoComplete="name" placeholder="Seu nome" required className={inputClassName} />
      </div>}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" placeholder="voce@exemplo.com" required className={inputClassName} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">Senha</label>
        <input id="password" name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={mode === "sign-up" ? 8 : undefined} placeholder="Digite sua senha" required className={inputClassName} />
      </div>
      {mode === "sign-up" && <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">Confirme a senha</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} placeholder="Repita sua senha" required className={inputClassName} />
      </div>}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (mode === "sign-up" ? "Criando conta…" : "Entrando…") : (mode === "sign-up" ? "Criar conta" : "Entrar")}
      </Button>
      {message && <p role="status" className="text-center text-sm text-foreground">{message}</p>}
      {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
    </form>
  );
}
