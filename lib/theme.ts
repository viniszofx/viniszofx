// Tema da interface (claro, escuro ou do aparelho), compartilhado pelo seletor do painel e pelo botão do site.
export type Theme = "light" | "dark" | "system";
const key = "viniszofx:theme";

export function readTheme(): Theme {
  try { const value = localStorage.getItem(key); return value === "light" || value === "dark" ? value : "system"; }
  catch { return "system"; }
}

function applyTheme() {
  const theme = readTheme();
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  // A escolha explícita marca .dark ou .light; "Sistema" não marca nada e o CSS segue o aparelho.
  // Sem o .light, escolher Claro num aparelho escuro não mudava nada (o CSS escuro do aparelho vencia).
  document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && dark));
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  // O servidor lê o cookie para a primeira pintura já sair no tema certo.
  document.cookie = `viniszofx-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function subscribeTheme(listener: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const update = () => { applyTheme(); listener(); };
  window.addEventListener("storage", update);
  window.addEventListener("viniszofx:theme-changed", update);
  media.addEventListener("change", update);
  applyTheme();
  return () => { window.removeEventListener("storage", update); window.removeEventListener("viniszofx:theme-changed", update); media.removeEventListener("change", update); };
}

export function setTheme(theme: Theme) {
  try { localStorage.setItem(key, theme); } catch { return; }
  window.dispatchEvent(new Event("viniszofx:theme-changed"));
}
