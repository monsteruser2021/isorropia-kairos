"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Distribution = { id: string; month: number; year: number };

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const years = Array.from({ length: 11 }, (_, index) => 2021 + index);

export default function Distribucion() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      if (!authenticatedUser) {
        const sessionCookie = document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith("tempered_user_id="));
        setSessionUserId(sessionCookie?.split("=")[1] ?? null);
      }
    });

    return unsubscribe;
  }, []);

  const currentUserId = user?.uid ?? sessionUserId;

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const distributionsQuery = query(
      collection(db, "distributions"),
      where("userId", "==", currentUserId),
    );

    return onSnapshot(
      distributionsQuery,
      (snapshot) => {
        setDistributions(snapshot.docs.map((item) => ({
          id: item.id,
          month: item.data().month as number,
          year: item.data().year as number,
        })));
      },
      () => setErrorMsg("No se pudieron cargar las distribuciones."),
    );
  }, [currentUserId]);

  const orderedDistributions = useMemo(
    () =>
      [...distributions].sort(
        (first, second) =>
          second.year - first.year || second.month - first.month,
      ),
    [distributions],
  );

  const saveDistribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserId) {
      setErrorMsg("Debes iniciar sesión para continuar.");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "distributions", editingId), { month, year });
      } else {
        await addDoc(collection(db, "distributions"), {
          userId: currentUserId,
          month,
          year,
          createdAt: serverTimestamp(),
        });
      }
      setErrorMsg("");
      setEditingId(null);
      setPendingDeleteId(null);
    } catch {
      setErrorMsg("No se pudo guardar la distribución.");
    }
  };

  const startEditing = (distribution: Distribution) => {
    setEditingId(distribution.id);
    setMonth(distribution.month);
    setYear(distribution.year);
    setPendingDeleteId(null);
  };

  const confirmDelete = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      await deleteDoc(doc(db, "distributions", id));
      setPendingDeleteId(null);
    } catch {
      setErrorMsg("No se pudo eliminar la distribución.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-[90vw] max-w-7xl rounded-3xl border border-white/25 bg-white/10 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/menu"
            className="text-xs uppercase text-white/70 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            Volver al menú
          </Link>
          <span className="text-xs uppercase tracking-[0.15em] text-white/50">
            Gestión mensual
          </span>
        </div>

        <h1 className="font-display mt-10 text-center text-2xl uppercase tracking-[0.1em] text-[#adc0fa] sm:text-4xl">
          Distribución
        </h1>

        {errorMsg && (
          <p className="mx-auto mt-6 max-w-4xl rounded-xl border border-red-500/50 bg-red-500/20 p-3 text-center text-sm text-red-200">
            {errorMsg}
          </p>
        )}

        {!currentUserId && (
          <p className="mx-auto mt-10 max-w-4xl rounded-2xl border border-dashed border-white/25 p-8 text-center text-sm text-white/60">
            Inicia sesión para cargar tus distribuciones.
          </p>
        )}

        {currentUserId && <form
          onSubmit={saveDistribution}
          className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/15 bg-black/15 p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-sm uppercase tracking-[0.08em] text-white/85">
              {editingId === null ? "Nueva distribución" : "Editar distribución"}
            </h2>
            {editingId !== null && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-xs uppercase text-white/60 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-xs uppercase text-white/70">
              Mes
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm normal-case text-white outline-none focus:border-white/70 focus:ring-2 focus:ring-white/20"
              >
                {months.map((monthName, index) => (
                  <option key={monthName} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs uppercase text-white/70">
              Año
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/25 bg-[#121212]/80 px-4 py-3 text-sm normal-case text-white outline-none focus:border-white/70 focus:ring-2 focus:ring-white/20"
              >
                {years.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-xl bg-[#adc0fa] px-5 py-3 text-xs uppercase text-[#121212] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              {editingId === null ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>}

        {currentUserId && <div className="mx-auto mt-8 max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.08em] text-white/85">
              Distribuciones registradas
            </h2>
            <span className="text-xs text-white/50">
              {distributions.length} {distributions.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {orderedDistributions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/25 px-6 py-12 text-center text-sm text-white/55">
              No hay distribuciones creadas todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {orderedDistributions.map((distribution) => (
                <div
                  key={distribution.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-black/15 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-base text-white">
                      {months[distribution.month]} {distribution.year}
                    </p>
                    <p className="mt-1 text-xs uppercase text-white/45">
                      Distribución mensual
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/distribucion/${distribution.id}`}
                      className="rounded-lg bg-[#adc0fa] px-4 py-2 text-xs uppercase text-[#121212] transition hover:bg-white"
                    >
                      Gestionar
                    </Link>
                    <button
                      type="button"
                      onClick={() => startEditing(distribution)}
                      className="rounded-lg border border-white/25 px-4 py-2 text-xs uppercase text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
                    >
                      Editar
                    </button>
                    {pendingDeleteId === distribution.id ? (
                      <>
                        <span className="text-xs text-red-200">¿Confirmar eliminación?</span>
                        <button
                          type="button"
                          onClick={() => confirmDelete(distribution.id)}
                          className="rounded-lg bg-red-500/80 px-4 py-2 text-xs uppercase text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="rounded-lg border border-white/25 px-4 py-2 text-xs uppercase text-white/70 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => confirmDelete(distribution.id)}
                        className="rounded-lg border border-red-300/30 px-4 py-2 text-xs uppercase text-red-200 transition hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-200"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </section>
    </main>
  );
}
