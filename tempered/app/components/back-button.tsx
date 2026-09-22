import Link from "next/link";

type BackButtonProps = {
  href: string;
  children: React.ReactNode;
};

export default function BackButton({ href, children }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-xs font-bold uppercase text-white shadow-lg shadow-black/20 transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
    >
      <span aria-hidden="true" className="shrink-0">←</span>
      <span className="min-w-0 wrap-break-word">{children}</span>
    </Link>
  );
}