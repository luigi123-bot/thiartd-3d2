import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

type Props = {
  userName: string;
  userEmail: string;
};

export default function AvatarMenu({ userName, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchRole() {
      if (!userEmail) return;
      const { data } = await supabase
        .from("usuarios")
        .select("role")
        .eq("email", userEmail)
        .single();
      console.log("Role obtenido:", data?.role);
      if (data?.role && typeof data.role === "string") setRole(data.role);
      else setRole(null);
    }
    void fetchRole();
  }, [userEmail]);

  const handleLogout = async () => {
    // await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="relative flex items-center">
      <span className="mr-2 font-semibold text-[#007973]">{userName}</span>
      {/* Log visual para depuración del role (dentro del menú) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus:outline-none"
        aria-label="Abrir menú de usuario"
      >
        <Image
          src="/avatar.png"
          alt="Avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full border border-[#007973]"
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-12 w-44 bg-white border rounded shadow-lg z-50">
          {/* Mostrar el valor de role para depuración */}
          <div className="px-4 py-1 text-xs text-gray-500 border-b">role: {role ?? 'sin rol'}</div>
          <ul className="py-2">
            <li>
              <button
                className="w-full text-left px-4 py-2 hover:bg-[#e0f2f1]"
                onClick={() => {
                  setOpen(false);
                  router.push("/envios");
                }}
              >
                Envíos
              </button>
            </li>
            {/* Solo mostrar Panel de administración si el role es admin */}
            {role === "admin" && (
              <li>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-[#e0f2f1]"
                  onClick={() => {
                    setOpen(false);
                    router.push("/admin");
                  }}
                >
                  Panel de administración
                </button>
              </li>
            )}
            <li>
              <button
                className="w-full text-left px-4 py-2 hover:bg-[#e0f2f1]"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
