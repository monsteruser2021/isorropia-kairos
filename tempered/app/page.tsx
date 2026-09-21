export default function Home() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#121212] to-[#2e4484] px-5 py-10">
			<section className="w-[60vw] max-w-2xl min-w-0 rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-12">
				<div className="mx-auto max-w-md">
					<h1 className="font-display text-center text-4xl uppercase tracking-[0.1em] text-[#adc0fa] sm:text-5xl">
						Tempered
					</h1>

					<form className="mt-12 space-y-6">
						<div>
							<label
								htmlFor="username"
								className="mb-2 block text-sm font-medium text-white/85"
							>
								Usuario
							</label>
							<input
								id="username"
								name="username"
								type="text"
								autoComplete="username"
								required
								className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20"
								placeholder="Ingresa tu usuario"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="mb-2 block text-sm font-medium text-white/85"
							>
								Contraseña
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								className="w-full rounded-xl border border-white/25 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-white/70 focus:bg-black/30 focus:ring-2 focus:ring-white/20"
								placeholder="Ingresa tu contraseña"
							/>
						</div>

						<button
							type="submit"
							className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-[#121212] transition hover:bg-white/85 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.99]"
						>
							Entrar
						</button>
					</form>
				</div>
			</section>
		</main>
	);
}
