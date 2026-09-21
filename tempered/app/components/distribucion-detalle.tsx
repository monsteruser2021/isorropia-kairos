"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import BackButton from "./back-button";

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

type Percentages = Record<string, number>;
type Income = {
  id: string;
  description: string;
  totalBs: number;
  percentages: Percentages;
};
type Props = { distributionId: string };

const emptyPercentages = (): Percentages =>
  Object.fromEntries(categories.map((category) => [category, 0]));

export default function DistribucionDetalle({ distributionId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [description, setDescription] = useState("");
  const [totalBs, setTotalBs] = useState("");
  const [percentages, setPercentages] = useState<Percentages>(emptyPercentages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      if (!authenticatedUser) {
        const cookie = document.cookie
          .split("; ")
          .find((item) => item.startsWith("tempered_user_id="));
        setSessionUserId(cookie?.split("=")[1] ?? null);
      }
    });
    return unsubscribe;
  }, []);

  const currentUserId = user?.uid ?? sessionUserId;

  useEffect(() => {
    if (!currentUserId) return;

    return onSnapshot(
      doc(db, "distributions", distributionId),
      (snapshot) => {
        setIsOwner(snapshot.exists() && snapshot.data().userId === currentUserId);
      },
      () => setErrorMsg("No se pudo cargar la distribución."),
    );
  }, [currentUserId, distributionId]);

  useEffect(() => {
    if (!isOwner) return;

    return onSnapshot(
      collection(db, "distributions", distributionId, "incomes"),
      (snapshot) => {
        setIncomes(snapshot.docs.map((item) => ({
          id: item.id,
          description: String(item.data().description ?? ""),
          totalBs: Number(item.data().totalBs ?? 0),
          percentages: {
            ...emptyPercentages(),
            ...(item.data().percentages as Percentages | undefined),
          },
        })));
      },
      () => setErrorMsg("No se pudieron cargar los ingresos."),
    );
  }, [distributionId, isOwner]);

  const totalIncome = useMemo(
    () => incomes.reduce((sum, income) => sum + income.totalBs, 0),
    [incomes],
  );

  const percentageTotal = useMemo(
    () => Object.values(percentages).reduce((sum, value) => sum + value, 0),
    [percentages],
  );

  const percentagesAreComplete = Math.abs(percentageTotal - 100) < 0.0001;

  const resetForm = () => {
    setDescription("");
    setTotalBs("");
    setPercentages(emptyPercentages());
    setEditingId(null);
  };

  const updatePercentage = (category: string, value: string) => {
    const parsed = Number(value);
    setPercentages((current) => ({
      ...current,
      [category]: Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 0)),
    }));
  };

  const saveIncome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(totalBs);
    if (!isOwner || !description.trim() || !Number.isFinite(amount) || amount <= 0) {
      setErrorMsg("Completa una descripción y un monto válido.");
      return;
    }
    if (!percentagesAreComplete) {
      setErrorMsg(`Los porcentajes deben sumar exactamente 100%. Actualmente suman ${percentageTotal.toFixed(2)}%.`);
      return;
    }

    setSaving(true);
    try {
      const incomeData = {
        description: description.trim(),
        totalBs: amount,
        percentages,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "distributions", distributionId, "incomes", editingId), incomeData);
      } else {
        await addDoc(collection(db, "distributions", distributionId, "incomes"), {
          ...incomeData,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      setErrorMsg("");
    } catch {
      setErrorMsg("No se pudo guardar el ingreso.");
    } finally {
      setSaving(false);
    }
  };

  const editIncome = (income: Income) => {
    setEditingId(income.id);
    setDescription(income.description);
    setTotalBs(String(income.totalBs));
    setPercentages({ ...emptyPercentages(), ...income.percentages });
    setPendingDeleteId(null);
  };

  const deleteIncome = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      await deleteDoc(doc(db, "distributions", distributionId, "incomes", id));
      setPendingDeleteId(null);
      if (editingId === id) resetForm();
    } catch {
      setErrorMsg("No se pudo eliminar el ingreso.");
    }
  };

  if (!currentUserId || !isOwner) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <section className="w-[90vw] max-w-4xl rounded-3xl border border-white/25 bg-white/10 p-8 text-center text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
          <p className="text-sm text-white/70">La distribución no existe o no tienes acceso.</p>
          <BackButton href="/distribucion">Volver a distribuciones</BackButton>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-[90vw] max-w-7xl rounded-3xl border border-white/25 bg-white/10 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <BackButton href="/distribucion">Volver a distribuciones</BackButton>
        <h1 className="font-display mt-10 text-center text-2xl uppercase tracking-[0.1em] text-[#adc0fa] sm:text-4xl">Ingresos del periodo</h1>
        {errorMsg && <p className="mx-auto mt-6 max-w-4xl rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-sm text-red-200">{errorMsg}</p>}

        <form onSubmit={saveIncome} className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/15 bg-black/15 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm uppercase text-white/85">{editingId ? "Editar ingreso" : "Nuevo ingreso"}</h2>
            {editingId && <button type="button" onClick={resetForm} className="text-xs uppercase text-white/60 hover:text-white">Cancelar</button>}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-xs uppercase text-white/70">Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej. Quincena" className="mt-2 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm normal-case text-white outline-none" /></label>
            <label className="text-xs uppercase text-white/70">Monto total en Bs<input value={totalBs} onChange={(event) => setTotalBs(event.target.value)} type="number" min="0" step="0.01" placeholder="100" className="mt-2 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm text-white outline-none" /></label>
            <button disabled={saving || !percentagesAreComplete} type="submit" className="rounded-xl bg-[#adc0fa] px-5 py-3 text-xs uppercase text-[#121212] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Guardando..." : editingId ? "Guardar" : "Agregar"}</button>
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-xs uppercase text-white/60">Porcentajes de este ingreso</h3>
            <p className={`mt-2 text-sm ${percentagesAreComplete ? "text-emerald-300" : "text-amber-300"}`}>
              Total asignado: {percentageTotal.toFixed(2)}% {percentagesAreComplete ? "(completo)" : "(debe ser exactamente 100%)"}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category} className="flex items-center justify-between gap-3 text-sm text-white/80">
                  <span>{category}</span>
                  <span className="relative w-28"><input type="number" min="0" max="100" step="0.01" value={percentages[category]} onChange={(event) => updatePercentage(category, event.target.value)} className="w-full rounded-xl border border-white/25 bg-[#121212]/80 px-3 py-2 pr-8 text-right text-white outline-none" /><span className="absolute right-3 top-2 text-white/50">%</span></span>
                </label>
              ))}
            </div>
          </div>
          {!percentagesAreComplete && <p className="mt-4 text-xs text-amber-300">Distribuye el 100% del ingreso antes de guardar.</p>}
        </form>

        <div className="mx-auto mt-8 max-w-4xl">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm uppercase text-white/85">Ingresos registrados</h2><span className="text-xs text-[#adc0fa]">Total: {totalIncome.toFixed(2)} Bs</span></div>
          {incomes.length === 0 ? <div className="rounded-2xl border border-dashed border-white/25 px-6 py-12 text-center text-sm text-white/55">Aún no hay ingresos para este periodo.</div> : <div className="space-y-4">{incomes.map((income) => <article key={income.id} className="rounded-2xl border border-white/15 bg-black/15 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-base text-white">{income.description}</h3><p className="mt-1 text-sm text-[#adc0fa]">{income.totalBs.toFixed(2)} Bs</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => editIncome(income)} className="rounded-lg border border-white/25 px-4 py-2 text-xs uppercase text-white/80 hover:bg-white/15">Editar</button>{pendingDeleteId === income.id ? <><button type="button" onClick={() => deleteIncome(income.id)} className="rounded-lg bg-red-500/80 px-4 py-2 text-xs uppercase">Confirmar eliminación</button><button type="button" onClick={() => setPendingDeleteId(null)} className="rounded-lg border border-white/25 px-4 py-2 text-xs uppercase">Cancelar</button></> : <button type="button" onClick={() => deleteIncome(income.id)} className="rounded-lg border border-red-300/30 px-4 py-2 text-xs uppercase text-red-200">Eliminar</button>}</div></div><div className="mt-5 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">{categories.map((category) => { const percentage = income.percentages[category] ?? 0; return <div key={category} className="flex justify-between text-xs text-white/65"><span>{category} ({percentage}%)</span><span className="text-[#adc0fa]">{(income.totalBs * percentage / 100).toFixed(2)} Bs</span></div>; })}</div></article>)}</div>}
        </div>
      </section>
    </main>
  );
}
