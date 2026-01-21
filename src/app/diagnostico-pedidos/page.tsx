"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DiagnosticoResultado {
  timestamp: string;
  env: {
    supabaseUrl: string;
    hasAnonKey: boolean;
    anonKeyPrefix: string;
  };
  usuario: {
    autenticado: boolean;
    userId?: string;
    email?: string;
    error?: string;
  } | null;
  pedidos: {
    todos: {
      cantidad: number;
      data: unknown;
      error?: string;
      errorDetails?: unknown;
    };
    mis_pedidos?: {
      cantidad: number;
      data: unknown;
      error?: string;
      errorDetails?: unknown;
    };
    count: {
      total: number | null;
      error?: string;
    };
  } | null;
  errores: Array<{
    mensaje: string;
    stack: string | null;
  }>;
}

export default function DiagnosticoPage() {
  const [resultado, setResultado] = useState<DiagnosticoResultado | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUsuario(data?.user ?? null);
    })();
  }, []);

  const probarConexion = async () => {
    setLoading(true);
    const resultados: DiagnosticoResultado = {
      timestamp: new Date().toISOString(),
      env: {
        supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        anonKeyPrefix: supabaseAnonKey.substring(0, 20) + "...",
      },
      usuario: null,
      pedidos: null,
      errores: [],
    };

    try {
      // 1. Verificar usuario
      const { data: userData, error: userError } = await supabase.auth.getUser();
      resultados.usuario = {
        autenticado: !!userData?.user,
        userId: userData?.user?.id,
        email: userData?.user?.email,
        error: userError?.message,
      };

      // 2. Intentar obtener TODOS los pedidos (sin filtro)
      console.log("🔍 Intentando obtener todos los pedidos...");
      const { data: todosPedidos, error: todosPedidosError } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // 4. Intentar contar pedidos
      const { count, error: countError } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true });

      resultados.pedidos = {
        todos: {
          cantidad: todosPedidos?.length ?? 0,
          data: todosPedidos,
          error: todosPedidosError?.message,
          errorDetails: todosPedidosError,
        },
        count: {
          total: count,
          error: countError?.message,
        },
      };

      // 3. Si hay usuario, intentar obtener sus pedidos
      if (userData?.user) {
        const { data: misPedidos, error: misPedidosError } = await supabase
          .from("pedidos")
          .select("*")
          .eq("cliente_id", userData.user.id)
          .order("created_at", { ascending: false });

        resultados.pedidos.mis_pedidos = {
          cantidad: misPedidos?.length ?? 0,
          data: misPedidos,
          error: misPedidosError?.message,
          errorDetails: misPedidosError,
        };
      }

    } catch (error) {
      resultados.errores.push({
        mensaje: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? (error.stack ?? null) : null,
      });
    }

    setResultado(resultados);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">🔍 Diagnóstico de Pedidos</h1>

          {usuario && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm">
                <strong>Usuario autenticado:</strong> {usuario.email}
              </p>
              <p className="text-xs text-gray-600">ID: {usuario.id}</p>
            </div>
          )}

          <Button onClick={probarConexion} disabled={loading} className="mb-6">
            {loading ? "Ejecutando diagnóstico..." : "🔍 Ejecutar Diagnóstico"}
          </Button>

          {resultado && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">Configuración:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(resultado.env, null, 2)}
                </pre>
              </div>

              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">Usuario:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(resultado.usuario, null, 2)}
                </pre>
              </div>

              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">Pedidos:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
                  {JSON.stringify(resultado.pedidos, null, 2)}
                </pre>
              </div>

              {resultado.errores.length > 0 && (
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <h3 className="font-semibold mb-2 text-red-700">Errores:</h3>
                  <pre className="text-xs text-red-600 overflow-auto">
                    {JSON.stringify(resultado.errores, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
