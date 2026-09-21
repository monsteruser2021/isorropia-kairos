"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const bsCategories = [
  "Gastos básicos", "Fondo de emergencia", "Inversión", "Ahorro",
  "Transporte", "Caridad", "Lujo/gustos", "Otros gastos",
];
const dollarCategories = ["Inversiones", "Ahorro", "Fondo de emergencia"];
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
type Currency = "bs" | "usd";
type Distribution = { id: string; month: number; year: number };
type Transaction = { category: string; income: number; expense: number };
type Income = { total: number; percentages: Record<string, number> };

const sessionUserId = () => document.cookie.split("; ").find((item) => item.startsWith("tempered_user_id="))?.split("=")[1] ?? null;

export default function Transfers() {
  const [user, setUser] = useState<User | null>(null);
  const [fallbackUserId, setFallbackUserId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("bs");
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distributionId, setDistributionId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (authenticatedUser) => {
    setUser(authenticatedUser);
    setFallbackUserId(authenticatedUser ? null : sessionUserId());
  }), []);

  const currentUserId = user?.uid ?? fallbackUserId;
  const categories = currency === "bs" ? bsCategories : dollarCategories;
  const transactionCollection = currency === "bs" ? "transactions" : "dollarTransactions";
  const incomeField = currency === "bs" ? "incomeBs" : "incomeUsd";
  const expenseField = currency === "bs" ? "expenseBs" : "expenseUsd";
  const symbol = currency === "bs" ? "Bs" : "$";

  useEffect(() => {
    if (!currentUserId) return;
    return onSnapshot(query(collection(db, "distributions"), where("userId", "==", currentUserId)), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, month: Number(item.data().month), year: Number(item.data().year) })).sort((a, b) => b.year - a.year || b.month - a.month);
      setDistributions(next);
      setDistributionId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id ?? "");
    }, () => setErrorMsg("No se pudieron cargar los periodos."));
  }, [currentUserId]);

  useEffect(() => {
    if (!distributionId) return;
    const stopTransactions = onSnapshot(collection(db, "distributions", distributionId, transactionCollection), (snapshot) => {
      setTransactions(snapshot.docs.map((item) => ({ category: String(item.data().category ?? ""), income: Number(item.data()[incomeField] ?? 0), expense: Number(item.data()[expenseField] ?? 0) })));
    }, () => setErrorMsg("No se pudieron cargar los saldos."));
    if (currency !== "bs") {
      return stopTransactions;
    }
    const stopIncomes = onSnapshot(collection(db, "distributions", distributionId, "incomes"), (snapshot) => {
      setIncomes(snapshot.docs.map((item) => ({ total: Number(item.data().totalBs ?? 0), percentages: (item.data().percentages ?? {}) as Record<string, number> })));
    }, () => setErrorMsg("No se pudieron cargar los ingresos distribuidos."));
    return () => { stopTransactions(); stopIncomes(); };
  }, [currency, distributionId, expenseField, incomeField, transactionCollection]);

  const balances = useMemo(() => categories.map((category) => {
    const manual = transactions.filter((item) => item.category === category).reduce((sum, item) => sum + item.income - item.expense, 0);
    const initial = currency === "bs" ? incomes.reduce((sum, income) => sum + income.total * Number(income.percentages[category] ?? 0) / 100, 0) : 0;
    return { category, balance: initial + manual };
  }), [categories, currency, incomes, transactions]);
  const originBalance = balances.find((item) => item.category === origin)?.balance ?? 0;
  const selectedDistribution = distributions.find((item) => item.id === distributionId);
  const lastDay = selectedDistribution ? new Date(selectedDistribution.year, selectedDistribution.month + 1, 0).getDate() : 0;
  const minDate = selectedDistribution ? `${selectedDistribution.year}-${String(selectedDistribution.month + 1).padStart(2, "0")}-01` : "";
  const maxDate = selectedDistribution ? `${selectedDistribution.year}-${String(selectedDistribution.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` : "";
  const availableOrigins = balances.filter((item) => item.balance > 0);
  const destinationOptions = categories.filter((category) => category !== origin);

  const changeCurrency = (next: Currency) => {
    setCurrency(next); setOrigin(""); setDestination(""); setAmount(""); setErrorMsg("");
  };

  const executeTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!distributionId || !origin || !destination || origin === destination || !Number.isFinite(value) || value <= 0 || value > originBalance) {
      setErrorMsg(`El monto debe ser positivo y no superar el saldo disponible (${symbol} ${originBalance.toFixed(2)}).`);
      return;
    }
    if (!date || date < minDate || date > maxDate) {
      setErrorMsg("La fecha debe pertenecer al periodo seleccionado.");
      return;
    }
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const originRef = doc(collection(db, "distributions", distributionId, transactionCollection));
      const destinationRef = doc(collection(db, "distributions", distributionId, transactionCollection));
      const transferData = { transferId: originRef.id, isTransfer: true, date, updatedAt: serverTimestamp() };
      batch.set(originRef, { category: origin, description: `Transf. a ${destination}`, [incomeField]: 0, [expenseField]: value, ...transferData, createdAt: serverTimestamp() });
      batch.set(destinationRef, { category: destination, description: `Prov. de ${origin}`, [incomeField]: value, [expenseField]: 0, ...transferData, createdAt: serverTimestamp() });
      await batch.commit();
      setAmount(""); setErrorMsg("");
    } catch { setErrorMsg("No se pudo registrar la transferencia."); }
    finally { setSaving(false); }
  };

  if (!currentUserId) return <Message text="Inicia sesión para acceder a Transferencias." />;
  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <section className="w-full max-w-6xl rounded-3xl border border-white/25 bg-white/10 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <Link href="/menu" className="text-xs uppercase text-white/70 hover:text-white">Volver al menú</Link>
        <h1 className="font-display mt-8 text-center text-2xl uppercase tracking-[0.08em] text-[#adc0fa] sm:text-4xl">Transferencias</h1>
        <div className="mx-auto mt-8 flex max-w-5xl rounded-xl border border-white/20 bg-black/15 p-1" role="group" aria-label="Moneda">
          <button type="button" onClick={() => changeCurrency("bs")} className={`min-h-11 flex-1 rounded-lg text-xs uppercase ${currency === "bs" ? "bg-[#adc0fa] text-[#121212]" : "text-white/70"}`}>Bolívares (Bs)</button>
          <button type="button" onClick={() => changeCurrency("usd")} className={`min-h-11 flex-1 rounded-lg text-xs uppercase ${currency === "usd" ? "bg-[#adc0fa] text-[#121212]" : "text-white/70"}`}>Dólares ($)</button>
        </div>
        {errorMsg && <p className="mx-auto mt-5 max-w-5xl rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-xs text-red-200">{errorMsg}</p>}
        <div className="mx-auto mt-6 max-w-5xl"><label className="text-xs uppercase text-white/70">Periodo<select value={distributionId} onChange={(event) => setDistributionId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm text-white">{distributions.length === 0 ? <option value="">No hay periodos</option> : distributions.map((item) => <option key={item.id} value={item.id}>{monthNames[item.month]} {item.year}</option>)}</select></label></div>
        {!selectedDistribution ? <p className="mx-auto mt-8 max-w-5xl rounded-2xl border border-dashed border-white/25 p-8 text-center text-sm text-white/60">Crea primero una distribución mensual.</p> : <>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-2xl border border-white/15 bg-black/15 p-4"><h2 className="text-sm uppercase text-white/80">Saldos disponibles</h2><div className="mt-4 space-y-2">{balances.map((item) => <div key={item.category} className="flex justify-between gap-3 text-sm"><span>{item.category}</span><span className={item.balance > 0 ? "text-emerald-300" : "text-white/50"}>{symbol} {item.balance.toFixed(2)}</span></div>)}</div></div>
            <form onSubmit={executeTransfer} className="rounded-2xl border border-white/15 bg-black/15 p-4"><h2 className="text-sm uppercase text-white/80">Nueva transferencia</h2><div className="mt-4 grid gap-4"><label className="text-xs uppercase text-white/70">Origen<select required value={origin} onChange={(event) => { setOrigin(event.target.value); setDestination(""); }} className="mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm text-white"><option value="">Selecciona una categoría</option>{availableOrigins.map((item) => <option key={item.category} value={item.category}>{item.category} ({symbol} {item.balance.toFixed(2)})</option>)}</select></label><label className="text-xs uppercase text-white/70">Destino<select required value={destination} onChange={(event) => setDestination(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm text-white"><option value="">Selecciona una categoría</option>{destinationOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase text-white/70">Monto ({symbol})<input required type="number" min="0.01" max={originBalance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-base text-white" /></label><label className="text-xs uppercase text-white/70">Fecha<input required type="date" min={minDate} max={maxDate} value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-base text-white" /></label></div><button disabled={saving || availableOrigins.length === 0} type="submit" className="min-h-12 rounded-xl bg-[#adc0fa] px-4 py-3 text-xs uppercase text-[#121212] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Registrando..." : "Transferir"}</button></div></form>
          </div>
          <p className="mx-auto mt-5 max-w-5xl text-xs text-white/50">Las transferencias se registran como egreso en el origen e ingreso en el destino dentro de la moneda seleccionada.</p>
        </>}
      </section>
    </main>
  );
}

function Message({ text }: { text: string }) {
  return <main className="flex min-h-screen items-center justify-center px-4 py-8"><section className="w-full max-w-4xl rounded-3xl border border-white/25 bg-white/10 p-8 text-center text-white shadow-2xl shadow-black/30 backdrop-blur-xl"><p className="text-sm text-white/70">{text}</p><Link href="/menu" className="mt-6 inline-block text-sm uppercase text-[#adc0fa] hover:text-white">Volver al menú</Link></section></main>;
}
