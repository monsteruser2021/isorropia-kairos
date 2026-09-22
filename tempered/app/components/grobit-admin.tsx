"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BackButton from "./back-button";
import { getSessionUserId, type Habit, weekDays } from "./grobit-data";

const allDays = weekDays.map((day) => day.value);

export default function GrobitAdmin() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [days, setDays] = useState(allDays);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const userId = typeof document === "undefined" ? null : getSessionUserId();

  useEffect(() => {
    if (!userId) return;
    return onSnapshot(query(collection(db, "habits"), where("userId", "==", userId)), (snapshot) => setHabits(snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name ?? ""), active: item.data().active !== false, days: Array.isArray(item.data().days) ? item.data().days.map(Number) : allDays }))), () => setError("No se pudieron cargar los hábitos."));
  }, [userId]);

  const resetForm = () => { setName(""); setDays(allDays); setEditingId(""); };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !name.trim() || days.length === 0) return;
    try {
      if (editingId) await updateDoc(doc(db, "habits", editingId), { name: name.trim(), days });
      else await addDoc(collection(db, "habits"), { userId, name: name.trim(), days, active: true, createdAt: new Date() });
      resetForm();
    } catch { setError("No se pudo guardar el hábito."); }
  };
  const edit = (habit: Habit) => { setEditingId(habit.id); setName(habit.name); setDays(habit.days); };
  const toggleActive = async (habit: Habit) => { try { await updateDoc(doc(db, "habits", habit.id), { active: !habit.active }); } catch { setError("No se pudo actualizar el hábito."); } };
  const remove = async (habit: Habit) => { if (!window.confirm(`¿Eliminar ${habit.name}?`)) return; try { await deleteDoc(doc(db, "habits", habit.id)); if (editingId === habit.id) resetForm(); } catch { setError("No se pudo eliminar el hábito."); } };

  return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><BackButton href="/grobit">Volver a Grobit</BackButton><Link href="/grobit" className="text-xs uppercase text-white/65 underline-offset-4 hover:text-white hover:underline">Ver checklist</Link></div><header className="mt-12"><p className="text-xs uppercase tracking-[0.16em] text-white/55">Grobit</p><h1 className="mt-4 max-w-full wrap-break-word text-3xl uppercase tracking-widest text-[#76c978] sm:text-5xl">Administración de hábitos</h1><p className="mt-5 text-sm leading-6 text-white/70">Define qué hábitos aparecen en tu checklist y qué días deben cumplirse.</p></header>{error && <p className="mt-6 rounded-xl border border-amber-200/40 bg-black/30 p-4 text-sm text-amber-100">{error}</p>}<form onSubmit={submit} className="mt-10 rounded-2xl border border-white/20 bg-black/25 p-5 sm:p-7"><h2 className="text-lg uppercase text-white">{editingId ? "Editar hábito" : "Nuevo hábito"}</h2><label className="mt-5 block text-xs uppercase text-white/65">Nombre<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-[#76c978]" placeholder="Ej. Leer 20 minutos" /></label><fieldset className="mt-5"><legend className="text-xs uppercase text-white/65">Días activos</legend><div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">{weekDays.map((day) => <label key={day.value} className="flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 p-3 text-xs text-white transition hover:border-[#76c978]/70"><input type="checkbox" checked={days.includes(day.value)} onChange={() => setDays((current) => current.includes(day.value) ? current.filter((item) => item !== day.value) : [...current, day.value])} className="size-4 accent-[#76c978]" />{day.label}</label>)}</div></fieldset><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="submit" disabled={!name.trim() || days.length === 0} className="min-h-11 rounded-xl bg-[#76c978] px-5 py-3 text-xs font-bold uppercase text-[#121212] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{editingId ? "Guardar cambios" : "Agregar hábito"}</button>{editingId && <button type="button" onClick={resetForm} className="min-h-11 rounded-xl border border-white/25 px-5 py-3 text-xs uppercase text-white hover:bg-white/10">Cancelar</button>}</div></form><section className="mt-8 space-y-3" aria-labelledby="habits-list-title"><h2 id="habits-list-title" className="text-lg uppercase text-white">Hábitos configurados</h2>{habits.length === 0 ? <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-white/55">Todavía no hay hábitos configurados.</p> : habits.map((habit) => <article key={habit.id} className="flex min-w-0 flex-col gap-4 rounded-xl border border-white/15 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className={`wrap-break-word text-sm uppercase ${habit.active ? "text-white" : "text-white/45 line-through"}`}>{habit.name}</h3><p className="mt-2 text-xs text-white/50">{habit.days.map((day) => weekDays.find((item) => item.value === day)?.label).join(" · ")}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => edit(habit)} className="min-h-10 rounded-lg border border-white/25 px-3 py-2 text-xs uppercase text-white hover:bg-white/10">Editar</button><button type="button" onClick={() => void toggleActive(habit)} className="min-h-10 rounded-lg border border-[#76c978]/50 px-3 py-2 text-xs uppercase text-[#b8f0b9]">{habit.active ? "Pausar" : "Activar"}</button><button type="button" onClick={() => void remove(habit)} className="min-h-10 rounded-lg border border-red-300/30 px-3 py-2 text-xs uppercase text-red-200">Eliminar</button></div></article>)}</section></main>;
}