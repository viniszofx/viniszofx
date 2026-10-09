"use client";
import { useEffect, useRef, useState } from "react";
import type { AddressFieldsValue } from "@/lib/format/address";
type Address = { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean | string };
const cache = new Map<string, { address: Address; expires: number }>();
export function usePostalAddress(onChange: (patch: Partial<AddressFieldsValue>) => void) {
 const [loading, setLoading] = useState(false); const [error, setError] = useState("");
 const request = useRef<AbortController | null>(null); const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
 const revision = useRef(0);
 const cancel = () => { revision.current++; request.current?.abort();if(timeout.current) clearTimeout(timeout.current); };
 useEffect(() => () => { request.current?.abort();if(timeout.current) clearTimeout(timeout.current); }, []);
 function changePostalCode(text: string) {
   cancel();setError("");setLoading(false);
   const digits = text.replace(/\D/g, "").slice(0,8);
   onChange({ postalCode: digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits });
   if (digits.length !== 8) return;
   const version = revision.current;const controller = new AbortController();request.current = controller;setLoading(true);
   timeout.current = setTimeout(async () => {
     try {
       let address = cache.get(digits)?.expires && cache.get(digits)!.expires > Date.now() ? cache.get(digits)!.address : undefined;
       if (!address) { const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });if(!response.ok) throw new Error();address = await response.json() as Address; }
       if (version !== revision.current || controller.signal.aborted) return;
       if (address.erro) { setError("CEP não encontrado. Confira o número ou preencha o endereço manualmente.");return; }
       cache.set(digits, { address, expires: Date.now() + 30 * 60 * 1000 });
       onChange({ street: address.logradouro ?? "", neighborhood: address.bairro ?? "", city: address.localidade ?? "", state: address.uf ?? "" });
     } catch { if (!controller.signal.aborted && version === revision.current) setError("Não foi possível consultar o CEP. Você pode preencher o endereço manualmente."); }
     finally { if(version === revision.current && !controller.signal.aborted) setLoading(false); }
   }, 250);
 }
 function changeAddress(patch: Partial<AddressFieldsValue>) { cancel();setLoading(false);onChange(patch); }
 return { loading, error, changePostalCode, changeAddress };
}
