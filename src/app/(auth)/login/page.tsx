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
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Bodega System</h1>
        <p className="mt-1 text-sm text-gray-500">
          Inicie sesion para continuar
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Correo electronico"
          type="email"
          placeholder="usuario@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Contrasena"
          type="password"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          Iniciar sesion
        </Button>
      </form>
    </>
  );
}
