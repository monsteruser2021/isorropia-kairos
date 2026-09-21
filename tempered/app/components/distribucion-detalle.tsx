"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const categories = [
  "Gastos básicos",
  "Fondo de emergencia",
  "Inversión",
  "Ahorro",
  "Transporte",
  "Caridad",
  "Lujo/gustos",
  "Otros gastos",
];

type Income = { id: string; description: string; totalBs: number };
type DistributionDetailProps = { distributionId: string };

type Allocation = Record<string, number>;

export default function DistribucionDetalle({ distributionId }: DistributionDetailProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [allocations, setAllocations] = useState<Allocation>({});
  const [description, setDescription] = useState("");
  const [totalBs, setTotalBs] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      return;
    }

    return onSnapshot(
      doc(db, "distributions", distributionId),
      (snapshot) => {
        setIsOwner(snapshot.exists() && snapshot.data().userId === user.uid);
      },
      () => setErrorMsg("No se pudo cargar la distribución."),
    );
  }, [distributionId, user]);

  useEffect(() => {
    if (!isOwner) {
      return;
    }

    const unsubscribeIncomes = onSnapshot(
      collection(db, "distributions", distributionId, "incomes"),
      (snapshot) => {
        setIncomes(snapshot.docs.map((item) => ({
          id: item.id,
          description: item.data().description as string,
          totalBs: item.data().totalBs as number,
        })));
      },
      () => setErrorMsg("No se pudieron cargar los ingresos."),
    );

    const unsubscribeAllocations = onSnapshot(
      doc(db, "distributions", distributionId, "settings", "allocations"),
      (snapshot) => setAllocations((snapshot.data()?.percentages as Allocation) ?? {}),
      () => setErrorMsg("No se pudieron cargar las categorías."),
    );

    return () => {
      unsubscribeIncomes();
      unsubscribeAllocations();
    };
  }, [distributionId, isOwner]);

  const totalIncome = useMemo(
    () => incomes.reduce((sum, income) => sum + income.totalBs, 0),
    [incomes],
  );

  const addIncome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(totalBs);
    if (!isOwner || !description.trim() || !Number.isFinite(amount) || amount <= 0) {
      setErrorMsg("Completa una descripción y un monto válido.");
      return;
    }

    try {
      await addDoc(collection(db, "distributions", distributionId, "incomes"), {
        description: description.trim(),
        totalBs: amount,
        createdAt: serverTimestamp(),
      });
      setDescription("");
      setTotalBs("");
      setErrorMsg("");
    } catch {
      setErrorMsg("No se pudo guardar el ingreso.");
    }
  };

  const updatePercentage = (category: string, value: string) => {
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    setAllocations((current) => ({ ...current, [category]: percentage }));
  };

  const saveAllocations = async () => {
    try {
      await setDoc(
        doc(db, "distributions", distributionId, "settings", "allocations"),
        { percentages: allocations, updatedAt: serverTimestamp() },
        { merge: true },
      );
      setErrorMsg("");
    } catch {
      setErrorMsg("No se pudieron guardar las categorías.");
    }
  };

  if (!user || !isOwner) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <section className="w-[90vw] max-w-4xl rounded-3xl border border-white/25 bg-white/10 p-8 text-center text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-sm text-white/70">La distribución no existe o no tienes acceso.</p>
          <Link href="/distribucion" className="mt-6 inline-block text-sm uppercase text-[#adc0fa] hover:text-white">Volver a distribuciones</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-[90vw] max-w-7xl rounded-3xl border border-white/25 bg-white/10 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <Link href="/distribucion" className="text-xs uppercase text-white/70 hover:text-white">Volver a distribuciones</Link>
        <h1 className="font-display mt-10 text-center text-2xl uppercase tracking-[0.1em] text-[#adc0fa] sm:text-4xl">Gestionar distribución</h1>
        {errorMsg && <p className="mx-auto mt-6 max-w-4xl rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-sm text-red-200">{errorMsg}</p>}

        <form onSubmit={addIncome} className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/15 bg-black/15 p-5">
          <h2 className="text-sm uppercase text-white/85">Nueva fuente de ingreso</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-xs uppercase text-white/70">Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej. Quincena" className="mt-2 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm normal-case text-white outline-none" /></label>
            <label className="text-xs uppercase text-white/70">Monto total en Bs<input value={totalBs} onChange={(event) => setTotalBs(event.target.value)} type="number" min="0" step="0.01" placeholder="100" className="mt-2 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm text-white outline-none" /></label>
            <button type="submit" className="rounded-xl bg-[#adc0fa] px-5 py-3 text-xs uppercase text-[#121212] hover:bg-white">Agregar</button>
          </div>
        </form>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/15 bg-black/15 p-5">
          <h2 className="text-sm uppercase text-white/85">Ingresos registrados</h2>
          <div className="mt-4 space-y-2">{incomes.length === 0 ? <p className="text-sm text-white/55">Aún no hay ingresos.</p> : incomes.map((income) => <div key={income.id} className="flex justify-between border-b border-white/10 py-2 text-sm"><span>{income.description}</span><span>{income.totalBs.toFixed(2)} Bs</span></div>)}</div>
          <p className="mt-4 text-right text-sm uppercase text-[#adc0fa]">Total: {totalIncome.toFixed(2)} Bs</p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-white/15 bg-black/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm uppercase text-white/85">Distribución por categorías</h2><button type="button" onClick={saveAllocations} className="rounded-xl bg-[#adc0fa] px-4 py-2 text-xs uppercase text-[#121212] hover:bg-white">Guardar porcentajes</button></div>
          <div className="mt-5 space-y-3">{categories.map((category) => { const percentage = allocations[category] ?? 0; return <div key={category} className="grid gap-3 sm:grid-cols-[1fr_120px_150px] sm:items-center"><label className="text-sm text-white/85" htmlFor={`percentage-${category}`}>{category}</label><div className="relative"><input id={`percentage-${category}`} type="number" min="0" max="100" step="0.01" value={percentage} onChange={(event) => updatePercentage(category, event.target.value)} className="w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 pr-9 text-sm text-white outline-none" /><span className="absolute right-3 top-3 text-white/50">%</span></div><p className="text-right text-sm text-[#adc0fa]">{(totalIncome * percentage / 100).toFixed(2)} Bs</p></div>; })}</div>
        </div>
      </section>
    </main>
  );
}
