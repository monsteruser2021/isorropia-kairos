"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import BackButton from "./back-button";

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

const readSessionUserId = () => document.cookie.split("; ").find((cookie) => cookie.startsWith("tempered_user_id="))?.split("=")[1] ?? null;

export default function Summary() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("bs");
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [distributionId, setDistributionId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [transactionsKey, setTransactionsKey] = useState("");
  const [incomesKey, setIncomesKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => onAuthStateChanged(auth, (authenticatedUser) => {
    setUser(authenticatedUser);
    setSessionUserId(authenticatedUser ? null : readSessionUserId());
  }), []);

  const currentUserId = user?.uid ?? sessionUserId;
  const categories = currency === "bs" ? bsCategories : dollarCategories;
  const transactionCollection = currency === "bs" ? "transactions" : "dollarTransactions";
  const incomeField = currency === "bs" ? "incomeBs" : "incomeUsd";
  const expenseField = currency === "bs" ? "expenseBs" : "expenseUsd";
  const symbol = currency === "bs" ? "Bs" : "$";

  useEffect(() => {
    if (!currentUserId) return;
    return onSnapshot(
      query(collection(db, "distributions"), where("userId", "==", currentUserId)),
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => ({ id: item.id, month: Number(item.data().month), year: Number(item.data().year) }))
          .sort((first, second) => second.year - first.year || second.month - first.month);
        setDistributions(next);
        const now = new Date();
        const currentMonth = next.find((item) => item.year === now.getFullYear() && item.month === now.getMonth());
        setDistributionId(currentMonth?.id ?? next[0]?.id ?? "");
      },
      () => setErrorMsg("No se pudieron cargar los periodos disponibles."),
    );
  }, [currentUserId]);

  useEffect(() => {
    if (!distributionId) return;
    const dataKey = `${currency}:${distributionId}`;

    const stopTransactions = onSnapshot(
      collection(db, "distributions", distributionId, transactionCollection),
      (snapshot) => {
        setTransactions(snapshot.docs.map((item) => ({
          category: String(item.data().category ?? ""),
          income: Number(item.data()[incomeField] ?? 0),
          expense: Number(item.data()[expenseField] ?? 0),
        })));
        setTransactionsKey(dataKey);
      },
      () => setErrorMsg("No se pudieron cargar los saldos."),
    );

    if (currency !== "bs") return stopTransactions;
    const stopIncomes = onSnapshot(
      collection(db, "distributions", distributionId, "incomes"),
      (snapshot) => {
        setIncomes(snapshot.docs.map((item) => ({
          total: Number(item.data().totalBs ?? 0),
          percentages: (item.data().percentages ?? {}) as Record<string, number>,
        })));
        setIncomesKey(dataKey);
      },
      () => setErrorMsg("No se pudieron cargar los ingresos distribuidos."),
    );
    return () => { stopTransactions(); stopIncomes(); };
  }, [currency, distributionId, expenseField, incomeField, transactionCollection]);

  const balances = useMemo(() => categories.map((category) => {
    const dataKey = `${currency}:${distributionId}`;
    const manual = transactionsKey === dataKey ? transactions
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.income - item.expense, 0) : 0;
    const initial = currency === "bs" && incomesKey === dataKey
      ? incomes.reduce((sum, income) => sum + income.total * Number(income.percentages[category] ?? 0) / 100, 0)
      : 0;
    return { category, balance: initial + manual };
  }), [categories, currency, distributionId, incomes, incomesKey, transactions, transactionsKey]);

  const selectedDistribution = distributions.find((item) => item.id === distributionId);

  if (!currentUserId) return <Message text="Inicia sesión para acceder al resumen." />;

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <section className="w-full max-w-3xl rounded-3xl border border-white/25 bg-white/10 p-5 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <BackButton href="/isorropia">Volver al menú</BackButton>
        <h1 className="font-display mt-8 text-center text-2xl uppercase tracking-[0.08em] text-[#adc0fa] sm:text-4xl">Resumen</h1>
        <div className="mx-auto mt-8 flex max-w-xl rounded-xl border border-white/20 bg-black/15 p-1" role="group" aria-label="Moneda">
          <button type="button" onClick={() => setCurrency("bs")} aria-pressed={currency === "bs"} className={`min-h-11 flex-1 rounded-lg text-xs uppercase transition ${currency === "bs" ? "bg-[#adc0fa] text-[#121212]" : "text-white/70 hover:bg-white/10"}`}>Bolívares (Bs)</button>
          <button type="button" onClick={() => setCurrency("usd")} aria-pressed={currency === "usd"} className={`min-h-11 flex-1 rounded-lg text-xs uppercase transition ${currency === "usd" ? "bg-[#adc0fa] text-[#121212]" : "text-white/70 hover:bg-white/10"}`}>Dólares ($)</button>
        </div>
        {errorMsg && <p className="mx-auto mt-5 max-w-xl rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-xs text-red-200">{errorMsg}</p>}
        {!selectedDistribution ? (
          <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed border-white/25 p-8 text-center text-sm text-white/60">No hay una distribución mensual disponible.</p>
        ) : (
          <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/15 bg-black/15 p-5 sm:p-7">
            <div className="flex flex-col gap-2 border-b border-white/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm uppercase tracking-[0.08em] text-white/90">Saldos disponibles</h2>
              <p className="text-xs text-white/50">{monthNames[selectedDistribution.month]} {selectedDistribution.year}</p>
            </div>
            <div className="mt-4 divide-y divide-white/10">
              {balances.map((item) => (
                <div key={item.category} className="flex min-h-14 items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-white/85">{item.category}</span>
                  <span className={`shrink-0 tabular-nums ${item.balance > 0 ? "text-emerald-300" : item.balance < 0 ? "text-red-300" : "text-white/50"}`}>
                    {symbol} {item.balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Message({ text }: { text: string }) {
  return <main className="flex min-h-screen items-center justify-center px-4 py-8"><section className="w-full max-w-4xl rounded-3xl border border-white/25 bg-white/10 p-8 text-center text-white shadow-2xl shadow-black/30 backdrop-blur-xl"><p className="text-sm text-white/70">{text}</p><BackButton href="/isorropia">Volver al menú</BackButton></section></main>;
}