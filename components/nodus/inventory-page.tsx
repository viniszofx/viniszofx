"use client";
import { useState, type FormEvent } from "react";
import { Tabs } from "@/components/ui/segmented";
import { Field, selectClass } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/feedback";
import { RiAddLine as Plus, RiDeleteBinLine as Trash2, RiPencilLine as Pencil, RiAlertLine as Alert } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogLayout, CatalogSearch } from "@/components/listing/catalog";
import { RecordDialog, type FieldDef, type FormValues } from "@/components/records/record-form";
import { formatDate } from "@/components/records/records-page";
import { formatBRL } from "@/lib/format/currency";
import { fieldsOf, matchesText, type StoredRecord } from "@/lib/records/store";
import { inventoryItemStore, inventoryLocationStore, inventoryStore, movementStore, stockBalances, type Inventory, type InventoryItemFields, type InventoryLocationFields, type MovementFields } from "@/lib/nodus/stores";
import { NameDialog } from "@/components/ui/name-dialog";
import { notifyError } from "@/lib/ui/notifications";
import { today } from "@/lib/format/date";

const itemFields: FieldDef[] = [
  { name: "name", label: "Nome", type: "text", required: true, wide: true },
  { name: "sku", label: "Código/SKU", type: "text" }, { name: "category", label: "Categoria", type: "text" },
  { name: "unit", label: "Unidade", type: "text", placeholder: "un, m, cx…" }, { name: "minimum", label: "Estoque mínimo", type: "number" },
  { name: "purchaseValue", label: "Valor de compra", type: "currency" }, { name: "saleValue", label: "Valor de venda", type: "currency" },
  { name: "notes", label: "Observações", type: "textarea", rows: 3 },
];
const locationFields: FieldDef[] = [{ name: "name", label: "Nome", type: "text", required: true, wide: true }, { name: "notes", label: "Observações", type: "textarea", rows: 3 }];
const movementLabels: Record<MovementFields["type"], string> = { in: "Entrada", out: "Saída", transfer: "Transferência" };
const tabs = [{ value: "stock", label: "Saldos" }, { value: "items", label: "Itens" }, { value: "locations", label: "Locais" }, { value: "movements", label: "Movimentações" }] as const;
const number = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

export function InventoryPage() {
  const allItems = inventoryItemStore.useRecords();
  const inventories = inventoryStore.useRecords();
  // Vários inventários (Nodus: catálogo de inventários). Itens sem inventário ficam em "Geral".
  const [inventoryId, setInventoryId] = useState("*");
  const [naming, setNaming] = useState<Inventory | "new" | null>(null);
  const [deletingInventory, setDeletingInventory] = useState<Inventory | null>(null);
  const items = { ...allItems, records: allItems.records.filter(item => inventoryId === "*" || (item.inventoryId || "") === inventoryId) };
  const inventoryOptions = [{ value: "", label: "Geral" }, ...inventories.records.map(inventory => ({ value: inventory.id, label: inventory.name }))];
  const fieldsWithInventory: FieldDef[] = [...itemFields.slice(0, 1), { name: "inventoryId", label: "Inventário", type: "select", options: inventoryOptions }, ...itemFields.slice(1)];
  const locations = inventoryLocationStore.useRecords();
  const movements = movementStore.useRecords();
  const [tab, setTab] = useState<(typeof tabs)[number]["value"]>("stock");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<StoredRecord<InventoryItemFields> | "new" | null>(null);
  const [editingLocation, setEditingLocation] = useState<StoredRecord<InventoryLocationFields> | "new" | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "item" | "location"; id: string; name: string } | null>(null);
  const [movement, setMovement] = useState<MovementFields>({ type: "in", itemId: "", quantity: "", fromLocationId: "", toLocationId: "", date: today(), reason: "" });
  const [newLocation, setNewLocation] = useState("");
  const balances = stockBalances(movements.records);
  const loaded = allItems.loaded && locations.loaded && movements.loaded && inventories.loaded;
  const visibleMovements = inventoryId === "*" ? movements.records : movements.records.filter(entry => items.records.some(item => item.id === entry.itemId));
  function removeInventory(inventory: Inventory) {
    const removed = new Set(allItems.records.filter(item => item.inventoryId === inventory.id).map(item => item.id));
    if (removed.size) {
      movementStore.replaceAll(movementStore.current().filter(entry => !removed.has(entry.itemId)));
      inventoryItemStore.replaceAll(inventoryItemStore.current().filter(item => !removed.has(item.id)), "Itens do inventário removidos");
    }
    inventoryStore.remove(inventory.id);
    setInventoryId("*");
  }
  const currentInventory = inventories.records.find(inventory => inventory.id === inventoryId);
  const itemName = (id: string) => items.records.find(item => item.id === id)?.name ?? "Item removido";
  const locationName = (id: string) => locations.records.find(location => location.id === id)?.name ?? "—";
  const totalOf = (itemId: string) => locations.records.reduce((sum, location) => sum + (balances.get(`${itemId}:${location.id}`) ?? 0), 0);
  const visibleItems = items.records.filter(item => matchesText([item.name, item.sku, item.category, item.notes], search)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let { fromLocationId, toLocationId } = movement;
    const quantity = Number(movement.quantity);
    if (!movement.itemId || !(quantity > 0)) return notifyError("Movimentação incompleta", "Escolha o item e informe uma quantidade maior que zero.");
    // A typed location name that doesn't exist yet becomes a predefined location.
    if (newLocation.trim()) {
      const existing = locations.records.find(location => location.name.toLocaleLowerCase("pt-BR") === newLocation.trim().toLocaleLowerCase("pt-BR"));
      const created = existing ?? inventoryLocationStore.save({ name: newLocation.trim(), notes: "" }, undefined, { silent: true });
      if (!created) return;
      if (movement.type === "out") fromLocationId = created.id; else toLocationId = created.id;
    }
    if (movement.type !== "in" && !fromLocationId) return notifyError("Movimentação incompleta", "Escolha o local de origem.");
    if (movement.type !== "out" && !toLocationId) return notifyError("Movimentação incompleta", "Escolha o local de destino.");
    if (movement.type === "transfer" && fromLocationId === toLocationId) return notifyError("Transferência inválida", "Origem e destino precisam ser diferentes.");
    if (movement.type !== "in" && (balances.get(`${movement.itemId}:${fromLocationId}`) ?? 0) < quantity) return notifyError("Saldo insuficiente", `Há ${number(balances.get(`${movement.itemId}:${fromLocationId}`) ?? 0)} em ${locationName(fromLocationId)}.`);
    movementStore.save({ ...movement, quantity: String(quantity), fromLocationId: movement.type === "in" ? "" : fromLocationId, toLocationId: movement.type === "out" ? "" : toLocationId, reason: movement.reason.trim() });
    setMovement(previous => ({ ...previous, quantity: "", reason: "" })); setNewLocation("");
  }

  function confirmDelete() {
    if (!deleting) return;
    // Removing an item or location also removes the stock history that points at it.
    const kept = movementStore.current().filter(entry => deleting.kind === "item" ? entry.itemId !== deleting.id : entry.fromLocationId !== deleting.id && entry.toLocationId !== deleting.id);
    if (kept.length !== movementStore.current().length) movementStore.replaceAll(kept);
    if (deleting.kind === "item") inventoryItemStore.remove(deleting.id); else inventoryLocationStore.remove(deleting.id);
  }

  return <CatalogLayout section="Inventário" title="Inventário e estoque" description="Itens, locais, saldos por local e histórico de entradas, saídas e transferências.">
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Inventário" className="min-w-52"><select className={selectClass} value={inventoryId} onChange={event => setInventoryId(event.target.value)}><option value="*">Todos</option>{inventoryOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
      <Button variant="outline" size="sm" onClick={() => setNaming("new")}><Plus />Novo inventário</Button>
      {currentInventory && <><Button variant="ghost" size="sm" onClick={() => setNaming(currentInventory)}><Pencil />Renomear</Button><Button variant="ghost" size="sm" onClick={() => setDeletingInventory(currentInventory)}><Trash2 />Excluir</Button></>}
    </div>
    <Tabs items={tabs} value={tab} onChange={setTab} />
    {!loaded ? <LoadingBlock label="Carregando inventário" /> : <>
      {tab === "stock" && <section className="space-y-4"><CatalogSearch label="Buscar itens" value={search} onChange={setSearch} />
        {!items.records.length || !locations.records.length ? <p className="text-sm text-muted-foreground">Cadastre itens e locais e registre uma entrada para ver os saldos.</p> :
        <div className="overflow-x-auto border"><table className="w-full text-sm"><thead className="bg-muted/40 text-left text-xs"><tr><th className="px-3 py-2">Item</th>{locations.records.map(location => <th key={location.id} className="px-3 py-2 text-right">{location.name}</th>)}<th className="px-3 py-2 text-right">Total</th></tr></thead>
          <tbody>{visibleItems.map(item => { const total = totalOf(item.id); const low = item.minimum !== "" && total <= Number(item.minimum);
            return <tr key={item.id} className="border-t"><td className="px-3 py-2"><span className="font-medium">{item.name}</span>{item.unit && <span className="text-xs text-muted-foreground"> ({item.unit})</span>}{low && <span className="ml-2 inline-flex items-center gap-1 text-xs text-destructive"><Alert className="size-3" />mínimo {item.minimum}</span>}</td>
              {locations.records.map(location => <td key={location.id} className="px-3 py-2 text-right tabular-nums">{number(balances.get(`${item.id}:${location.id}`) ?? 0)}</td>)}<td className="px-3 py-2 text-right font-semibold tabular-nums">{number(total)}</td></tr>; })}</tbody></table></div>}
      </section>}
      {tab === "items" && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><CatalogSearch label="Buscar itens" value={search} onChange={setSearch} /><Button onClick={() => setEditingItem("new")}><Plus />Novo item</Button></div>
        <ul className="divide-y border">{visibleItems.map(item => <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{[item.sku, item.category, item.purchaseValue && `Compra ${formatBRL(item.purchaseValue)}`, item.saleValue && `Venda ${formatBRL(item.saleValue)}`].filter(Boolean).join(" · ")}</p></div><span className="text-sm tabular-nums">{number(totalOf(item.id))} {item.unit}</span><Button variant="ghost" size="icon-sm" aria-label={`Editar ${item.name}`} onClick={() => setEditingItem(item)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${item.name}`} onClick={() => setDeleting({ kind: "item", id: item.id, name: item.name })}><Trash2 /></Button></li>)}
          {!visibleItems.length && <li className="px-4 py-6 text-sm text-muted-foreground">Nenhum item.</li>}</ul></section>}
      {tab === "locations" && <section className="space-y-4"><div className="flex justify-end"><Button onClick={() => setEditingLocation("new")}><Plus />Novo local</Button></div>
        <ul className="divide-y border">{locations.records.map(location => <li key={location.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{location.name}</p>{location.notes && <p className="text-xs text-muted-foreground">{location.notes}</p>}</div><Button variant="ghost" size="icon-sm" aria-label={`Editar ${location.name}`} onClick={() => setEditingLocation(location)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${location.name}`} onClick={() => setDeleting({ kind: "location", id: location.id, name: location.name })}><Trash2 /></Button></li>)}
          {!locations.records.length && <li className="px-4 py-6 text-sm text-muted-foreground">Nenhum local. Locais digitados numa movimentação também são cadastrados.</li>}</ul></section>}
      {tab === "movements" && <section className="space-y-6">
        <form onSubmit={register} className="grid gap-4 border p-4 sm:grid-cols-3">
          <Field label="Operação"><select className={selectClass} value={movement.type} onChange={event => setMovement(previous => ({ ...previous, type: event.target.value as MovementFields["type"] }))}>{Object.entries(movementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Item *"><select className={selectClass} value={movement.itemId} onChange={event => setMovement(previous => ({ ...previous, itemId: event.target.value }))}><option value="">Escolha</option>{items.records.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
          <Field label="Quantidade *"><Input type="number" min={0} step="any" value={movement.quantity} onChange={event => setMovement(previous => ({ ...previous, quantity: event.target.value }))} /></Field>
          {movement.type !== "in" && <Field label="Origem"><select className={selectClass} value={movement.fromLocationId} onChange={event => setMovement(previous => ({ ...previous, fromLocationId: event.target.value }))}><option value="">Escolha</option>{locations.records.map(location => <option key={location.id} value={location.id}>{location.name} ({number(balances.get(`${movement.itemId}:${location.id}`) ?? 0)})</option>)}</select></Field>}
          {movement.type !== "out" && <Field label="Destino"><select className={selectClass} value={movement.toLocationId} onChange={event => setMovement(previous => ({ ...previous, toLocationId: event.target.value }))}><option value="">Escolha</option>{locations.records.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></Field>}
          <Field label="Novo local"><Input placeholder="Digite para cadastrar" value={newLocation} onChange={event => setNewLocation(event.target.value)} /></Field>
          <Field label="Data"><Input type="date" value={movement.date} onChange={event => setMovement(previous => ({ ...previous, date: event.target.value }))} /></Field>
          <Field label="Motivo" className="sm:col-span-2"><Input value={movement.reason} onChange={event => setMovement(previous => ({ ...previous, reason: event.target.value }))} /></Field>
          <div className="flex items-end sm:col-span-3"><Button type="submit"><Plus />Registrar {movementLabels[movement.type].toLocaleLowerCase("pt-BR")}</Button></div>
        </form>
        <div><h2 className="mb-2 text-sm font-semibold">Movimentações recentes</h2><ul className="divide-y border">{[...visibleMovements].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 200).map(entry => <li key={entry.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm"><span className="w-24 text-xs text-muted-foreground">{formatDate(entry.date)}</span><span className="w-28 text-xs font-medium uppercase tracking-wider">{movementLabels[entry.type]}</span><span className="min-w-0 flex-1">{number(Number(entry.quantity))} × {itemName(entry.itemId)} <span className="text-muted-foreground">{entry.type === "in" ? `→ ${locationName(entry.toLocationId)}` : entry.type === "out" ? `← ${locationName(entry.fromLocationId)}` : `${locationName(entry.fromLocationId)} → ${locationName(entry.toLocationId)}`}</span>{entry.reason && <span className="block text-xs text-muted-foreground">{entry.reason}</span>}</span></li>)}
          {!visibleMovements.length && <li className="px-4 py-6 text-sm text-muted-foreground">Nenhuma movimentação.</li>}</ul></div>
      </section>}
    </>}
    {editingItem && <RecordDialog key={editingItem === "new" ? "new" : editingItem.id} title={editingItem === "new" ? "Novo item" : "Editar item"} description="O saldo vem das movimentações." fields={fieldsWithInventory} record={editingItem === "new" ? undefined : editingItem} submitLabel="Salvar item"
      initial={(editingItem === "new" ? { name: "", inventoryId: inventoryId === "*" ? "" : inventoryId, sku: "", category: "", unit: "un", minimum: "", purchaseValue: "", saleValue: "", notes: "" } : { inventoryId: "", ...editingItem }) as FormValues}
      onSave={values => inventoryItemStore.save(fieldsOf<InventoryItemFields>(values), editingItem === "new" ? undefined : editingItem.id)} onClose={() => setEditingItem(null)} />}
    {editingLocation && <RecordDialog key={editingLocation === "new" ? "new" : editingLocation.id} title={editingLocation === "new" ? "Novo local" : "Editar local"} description="Locais onde o estoque fica guardado." fields={locationFields} record={editingLocation === "new" ? undefined : editingLocation} submitLabel="Salvar local"
      initial={(editingLocation === "new" ? { name: "", notes: "" } : { ...editingLocation }) as FormValues}
      onSave={values => inventoryLocationStore.save(fieldsOf<InventoryLocationFields>(values), editingLocation === "new" ? undefined : editingLocation.id)} onClose={() => setEditingLocation(null)} />}
    {naming && <NameDialog title={naming === "new" ? "Novo inventário" : "Renomear inventário"} initial={naming === "new" ? "" : naming.name} submitLabel={naming === "new" ? "Criar" : "Renomear"} onSubmit={name => { const saved = inventoryStore.save({ name, notes: naming === "new" ? "" : naming.notes }, naming === "new" ? undefined : naming.id); if (saved) setInventoryId(saved.id); }} onClose={() => setNaming(null)} />}
    {deletingInventory && <ConfirmDialog title="Excluir inventário?" description={`${deletingInventory.name}, seus itens e as movimentações deles serão removidos. Os locais continuam.`} onConfirm={() => removeInventory(deletingInventory)} onClose={() => setDeletingInventory(null)} />}
    {deleting && <ConfirmDialog title={`Excluir ${deleting.kind === "item" ? "item" : "local"}?`} description={`${deleting.name} e as movimentações ligadas a ele serão removidos.`} onConfirm={confirmDelete} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
