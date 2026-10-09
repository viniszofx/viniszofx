"use client";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { formatBRL, parseBRLInput } from "@/lib/format/currency";
type CurrencyInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange"> & { value?: string; onValueChange: (value: string) => void };
export function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
 return <Input {...props} type="text" inputMode="numeric" placeholder="R$ 0,00" value={formatBRL(value)} onChange={event => onValueChange(parseBRLInput(event.target.value))} />;
}
