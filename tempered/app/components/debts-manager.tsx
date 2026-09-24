"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { localDateString } from "./task-data";
import { useSession } from "./session-context";
import BackButton from "./back-button";

type DebtType = "receivable" | "payable";
type Currency = "Bs" | "$";
type Debt = {
  id: string;
  userId: string;
  title: string;
  type: DebtType;
  amount: number;
  currency: Currency;
  dueDate: string;
  paid: boolean;
};

type Totals = Record<DebtType, Record<Currency, number>>;
const emptyTotals: Totals = { receivable: { Bs: 0, "$": 0 }, payable: { Bs: 0, "$": 0 } };

export default function DebtsManager() {
  const { userId } = useSession();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DebtType>("receivable");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("Bs");
  const [dueDate, setDueDate] = useState(localDateString());
  const [paid, setPaid] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = localDateString();

  useEffect(() => {
    if (!userId) return;
    return onSnapshot(
      query(collection(db, "debts"), where("userId", "==", userId)),
      (snapshot) => setDebts(snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          userId,
          title: String(data.title ?? ""),
          type: data.type === "payable" ? "payable" : "receivable",
          amount: Number(data.amount ?? 0),
          currency: data.currency === "$" ? "$" : "Bs",
          dueDate: String(data.dueDate ?? ""),
          paid: data.paid === true,
        };
      })),
      () => setError("No se pudieron cargar las deudas."),
    );
  }, [userId]);

  const totals = useMemo(() => debts.reduce<Totals>((result, debt) => {
    if (!debt.paid) result[debt.type][debt.currency] += debt.amount;
    return result;
  }, structuredClone(emptyTotals)), [debts]);
  const pending = useMemo(() => debts.filter((debt) => !debt.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [debts]);
  const settled = useMemo(() => debts.filter((debt) => debt.paid), [debts]);

  const resetForm = () => {
    setTitle(""); setType("receivable"); setAmount(""); setCurrency("Bs");
    setDueDate(localDateString()); setPaid(false); setEditingId("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!userId || !title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || !dueDate || saving) return;
    setSaving(true); setError("");
    try {
      const data = { title: title.trim(), type, amount: numericAmount, currency, dueDate, paid };
      if (editingId) await updateDoc(doc(db, "debts", editingId), { ...data, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "debts"), { ...data, userId, createdAt: serverTimestamp() });
      resetForm();
    } catch {
      setError("No se pudo guardar la deuda.");
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (debt: Debt) => {
    if (busyId) return;
    setBusyId(debt.id);
    setDebts((current) => current.map((item) => item.id === debt.id ? { ...item, paid: !item.paid } : item));
    try {
      await updateDoc(doc(db, "debts", debt.id), { paid: !debt.paid, updatedAt: serverTimestamp() });
    } catch {
      setDebts((current) => current.map((item) => item.id === debt.id ? debt : item));
      setError("No se pudo actualizar el estado de la deuda.");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (debt: Debt) => {
    if (busyId || !window.confirm(`¿Eliminar ${debt.title}?`)) return;
    setBusyId(debt.id);
    try {
      await deleteDoc(doc(db, "debts", debt.id));
      if (editingId === debt.id) resetForm();
    } catch {
      setError("No se pudo eliminar la deuda.");
    } finally {
      setBusyId("");
    }
  };

  const edit = (debt: Debt) => {
    setEditingId(debt.id); setTitle(debt.title); setType(debt.type); setAmount(String(debt.amount));
    setCurrency(debt.currency); setDueDate(debt.dueDate); setPaid(debt.paid);
  };

  const money = (value: number, symbol: Currency) => `${symbol} ${value.toFixed(2)}`;
  const renderDebt = (debt: Debt) => {
    const overdue = !debt.paid && debt.dueDate < today;
    return <article key={debt.id} className={`border p-4 transition-colors sm:p-5 ${overdue ? "border-red-400/80 bg-red-950/50" : "border-[#ddab36]/35 bg-black/35"}`}>
      <div className="flex min-w-0 items-start gap-3">
        <input type="checkbox" checked={debt.paid} disabled={busyId === debt.id} onChange={() => void togglePaid(debt)} aria-label={`Marcar ${debt.title} como saldada`} className="mt-1 size-5 shrink-0 accent-[#ddab36]" />
        <div className="min-w-0 flex-1"><h3 className={`wrap-break-word text-sm uppercase ${debt.paid ? "text-white/50 line-through" : "text-white"}`}>{debt.title}</h3><p className="mt-2 wrap-break-word text-xs uppercase text-white/60">{debt.type === "receivable" ? "Me deben" : "Debo"} · {money(debt.amount, debt.currency)}</p><p className={`mt-2 wrap-break-word text-xs uppercase ${overdue ? "font-bold text-red-200" : "text-white/50"}`}>{overdue ? "Vencida · " : "Compromiso · "}{debt.dueDate}{debt.paid ? " · Saldada" : ""}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => edit(debt)} disabled={Boolean(busyId) || saving} className="min-h-10 rounded-lg border border-[#ddab36]/45 px-3 py-2 text-xs uppercase text-[#ddab36] hover:bg-[#ddab36]/15 disabled:opacity-50">Editar</button><button type="button" onClick={() => void remove(debt)} disabled={Boolean(busyId) || saving} className="min-h-10 rounded-lg border border-red-300/40 px-3 py-2 text-xs uppercase text-red-100 hover:bg-red-900/50 disabled:opacity-50">Eliminar</button></div>
    </article>;
  };

  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-4"><BackButton href="/isorropia">Volver al menú</BackButton><Link href="/menu" className="text-xs uppercase text-white/65 underline-offset-4 hover:text-white hover:underline">Panel Tempered</Link></div><header className="mt-10 max-w-3xl"><p className="text-xs uppercase tracking-[0.2em] text-white/60">Isorropia Kairos / Control financiero</p><h1 className="mt-4 max-w-full wrap-break-word text-3xl uppercase tracking-widest text-[#ddab36] sm:text-5xl">Deudas pendientes</h1><p className="mt-5 max-w-full wrap-break-word text-sm leading-7 text-white/65">Cuentas por cobrar y obligaciones, con sus fechas de compromiso.</p></header>
    {!userId && <p className="mt-6 border border-[#ddab36]/35 bg-black/50 p-4 text-sm text-white/75">No se encontró una sesión activa de Tempered.</p>}
    {error && <p role="alert" className="mt-6 border border-red-300/50 bg-red-950/50 p-4 text-sm text-red-100">{error}</p>}
    <section className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Resumen de deudas"><Kpi title="Total que me deben" totals={totals.receivable} /><Kpi title="Total que debo" totals={totals.payable} /></section>
    <form onSubmit={submit} className="mt-8 border border-[#ddab36]/35 bg-black/55 p-5 sm:p-7"><h2 className="text-lg uppercase text-[#ddab36]">{editingId ? "Editar deuda" : "Nueva deuda"}</h2><div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]"><label className="block text-xs uppercase text-white/65">Título / concepto<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} disabled={!userId || saving} placeholder="Ej. Préstamo a Juan" className="mt-2 min-h-12 w-full rounded-lg border border-[#ddab36]/30 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-[#ddab36] disabled:opacity-50" /></label><label className="block text-xs uppercase text-white/65">Tipo<select value={type} onChange={(event) => setType(event.target.value as DebtType)} disabled={!userId || saving} className="mt-2 min-h-12 w-full rounded-lg border border-[#ddab36]/30 bg-[#121212] px-3 py-3 text-sm text-white outline-none"><option value="receivable">Me deben</option><option value="payable">Debo</option></select></label></div><div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem_12rem]"><label className="block text-xs uppercase text-white/65">Monto<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required disabled={!userId || saving} className="mt-2 min-h-12 w-full rounded-lg border border-[#ddab36]/30 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-[#ddab36] disabled:opacity-50" /></label><label className="block text-xs uppercase text-white/65">Moneda<select value={currency} onChange={(event) => setCurrency(event.target.value as Currency)} disabled={!userId || saving} className="mt-2 min-h-12 w-full rounded-lg border border-[#ddab36]/30 bg-[#121212] px-3 py-3 text-sm text-white outline-none"><option value="Bs">Bolívares - Bs</option><option value="$">Dólares - $</option></select></label><label className="block text-xs uppercase text-white/65">Fecha límite<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required disabled={!userId || saving} className="mt-2 min-h-12 w-full rounded-lg border border-[#ddab36]/30 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-[#ddab36] disabled:opacity-50" /></label></div><label className="mt-4 flex max-w-full items-center gap-3 text-xs uppercase text-white/70"><input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} disabled={!userId || saving} className="size-5 shrink-0 accent-[#ddab36]" /> Pagado / saldado</label><div className="mt-5 flex flex-wrap gap-3"><button type="submit" disabled={!userId || saving} className="min-h-11 rounded-lg bg-[#ddab36] px-5 py-3 text-xs font-bold uppercase text-[#121212] hover:bg-[#f0c55a] disabled:opacity-50">{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar deuda"}</button>{editingId && <button type="button" onClick={resetForm} disabled={saving} className="min-h-11 rounded-lg border border-[#ddab36]/45 px-5 py-3 text-xs uppercase text-[#ddab36]">Cancelar</button>}</div></form>
    <DebtList title="Pendientes" debts={pending} empty="No hay deudas pendientes." renderDebt={renderDebt} /><DebtList title="Pagadas / saldadas" debts={settled} empty="Aún no hay deudas saldadas." renderDebt={renderDebt} />
  </main>;
}

function Kpi({ title, totals }: { title: string; totals: Record<Currency, number> }) {
  return <article className="min-w-0 border border-[#ddab36]/35 bg-black/45 p-5"><h2 className="max-w-full wrap-break-word text-xs uppercase tracking-[0.12em] text-white/60">{title}</h2><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xl text-[#ddab36]"><span>{totals.Bs.toFixed(2)} Bs</span><span>{totals["$"].toFixed(2)} $</span></div><p className="mt-2 text-xs uppercase text-white/40">Solo pendientes</p></article>;
}

function DebtList({ title, debts, empty, renderDebt }: { title: string; debts: Debt[]; empty: string; renderDebt: (debt: Debt) => React.ReactNode }) {
  return <section className="mt-10" aria-labelledby={title}><div className="flex flex-wrap items-end justify-between gap-3"><h2 id={title} className="max-w-full wrap-break-word text-xl uppercase text-[#ddab36]">{title}</h2><span className="text-xs text-white/50">{debts.length} registros</span></div><div className="mt-5 space-y-3">{debts.length ? debts.map(renderDebt) : <p className="border border-dashed border-[#ddab36]/30 p-5 text-sm text-white/55">{empty}</p>}</div></section>;
}
