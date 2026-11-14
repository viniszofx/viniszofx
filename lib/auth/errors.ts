// Mensagens de erro de autenticação em português, para quem está tentando entrar.
// O cliente do Neon Auth LANÇA exceção em respostas 4xx (senha errada vira exceção), enquanto o
// better-auth local devolve { error }. As duas formas passam por aqui, e só uma falha de rede
// de verdade vira "sem conexão": senha errada nunca pode parecer que o serviço caiu.

type AuthAction = "sign-in" | "sign-up" | "reset-request" | "reset" | "change";

const byCode: Record<string, string> = {
  invalid_email_or_password: "E-mail ou senha incorretos.",
  invalid_password: "E-mail ou senha incorretos.",
  invalid_credentials: "E-mail ou senha incorretos.",
  credential_account_not_found: "E-mail ou senha incorretos.",
  user_not_found: "E-mail ou senha incorretos.",
  user_email_not_found: "Não há conta com esse e-mail.",
  user_already_exists: "Já existe uma conta com esse e-mail. Entre ou use \"Esqueci a senha\".",
  user_already_exists_use_another_email: "Já existe uma conta com esse e-mail. Entre ou use \"Esqueci a senha\".",
  email_exists: "Já existe uma conta com esse e-mail. Entre ou use \"Esqueci a senha\".",
  invalid_email: "Esse e-mail parece incompleto. Confira e tente de novo.",
  email_address_invalid: "Esse e-mail parece incompleto. Confira e tente de novo.",
  password_too_short: "A senha deve ter ao menos 8 caracteres.",
  password_too_long: "A senha é longa demais. Use até 128 caracteres.",
  weak_password: "A senha é fraca demais. Use ao menos 8 caracteres.",
  email_not_verified: "Confirme seu e-mail pelo link que enviamos antes de entrar.",
  email_not_confirmed: "Confirme seu e-mail pelo link que enviamos antes de entrar.",
  invalid_token: "O link expirou ou já foi usado. Peça um novo em \"Esqueci a senha\".",
  bad_jwt: "Sua sessão expirou. Entre novamente.",
  session_expired: "Sua sessão expirou. Entre novamente.",
  invalid_origin: "Login indisponível neste endereço. Entre em contato com o administrador.",
  over_request_rate_limit: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
  over_email_send_rate_limit: "Já enviamos um e-mail há pouco. Aguarde alguns minutos antes de pedir outro.",
  too_many_requests: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
};

const fallback: Record<AuthAction, string> = {
  "sign-in": "Não foi possível entrar. Confira o e-mail e a senha.",
  "sign-up": "Não foi possível criar a conta. Confira os dados e tente de novo.",
  "reset-request": "Não foi possível enviar o pedido agora. Tente de novo em instantes.",
  reset: "Não foi possível trocar a senha. O link pode ter expirado: peça um novo.",
  change: "Não foi possível trocar a senha. Tente de novo.",
};

const offline = "Sem conexão com o servidor. Verifique sua internet e tente de novo.";
const unavailable = "O login está temporariamente indisponível. Tente de novo em alguns minutos.";

function read(cause: unknown) {
  if (!cause || typeof cause !== "object") return { message: typeof cause === "string" ? cause : "" };
  const value = cause as { code?: unknown; status?: unknown; message?: unknown; name?: unknown };
  return {
    code: typeof value.code === "string" ? value.code.toLowerCase() : undefined,
    status: typeof value.status === "number" ? value.status : undefined,
    message: typeof value.message === "string" ? value.message : "",
    name: typeof value.name === "string" ? value.name : "",
  };
}

/** Converte qualquer erro de autenticação (resultado ou exceção) numa frase clara. */
export function authErrorMessage(cause: unknown, action: AuthAction) {
  const { code, status, message, name } = read(cause);
  if (code && byCode[code]) return byCode[code];
  if (/invalid origin/i.test(message)) return byCode.invalid_origin;
  // Falha de rede: fetch rejeita com TypeError ("Failed to fetch", "NetworkError…", "Load failed").
  if (name === "TypeError" && /fetch|network|load failed/i.test(message)) return offline;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return offline;
  if (status === 401 || status === 403) return action === "sign-in" ? byCode.invalid_credentials : fallback[action];
  if (status === 429) return byCode.too_many_requests;
  if (status !== undefined && status >= 500) return unavailable;
  if (/invalid email or password|invalid password|credentials/i.test(message)) return byCode.invalid_credentials;
  if (/already exists/i.test(message)) return byCode.user_already_exists;
  if (/expired|invalid token/i.test(message)) return byCode.invalid_token;
  // Mensagem própria do servidor em português (ex.: rotas da API do app) é mantida.
  if (message && /[ãçéêíóõú]/i.test(message)) return message;
  return fallback[action];
}
