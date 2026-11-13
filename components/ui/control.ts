// Aparência compartilhada por todos os campos de formulário (Input, Textarea, NativeSelect).
// text-base no mobile evita o zoom automático do iOS ao focar o campo.
export const controlClassName =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base text-foreground shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 sm:text-sm";
