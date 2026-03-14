"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result) {
        setError("Ocurrio un error inesperado.");
        return;
      }

      if (result.error) {
        setError("Credenciales invalidas. Intente de nuevo.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexion. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-8 md:p-12 animate-in fade-in zoom-in duration-500">
      <div className="mb-10 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 mb-4 border border-white/20">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
          Bodega <span className="text-gradient">Inteligente</span>
        </h1>
        <p className="text-gray-400 font-medium">
          Bienvenido. Por favor identifícate.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-200">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 ml-1">Correo Electrónico</label>
          <Input
            type="email"
            placeholder="admin@progreso.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 rounded-xl focus:ring-indigo-500/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 ml-1">Contraseña</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 rounded-xl focus:ring-indigo-500/30"
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full h-14 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border-none shadow-lg shadow-indigo-600/20 rounded-xl text-lg font-bold"
        >
          Acceder al Sistema
        </Button>
      </form>
      
      <div className="mt-10 pt-8 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500 font-medium">
          &copy; 2026 Ladrillera El Progreso. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
