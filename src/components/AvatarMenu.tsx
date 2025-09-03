import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  userName: string;
};

export default function AvatarMenu({ userName }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    // Aquí deberías limpiar las cookies/tokens y redirigir al login
    // await supabase.auth.signOut()
    router.push("/login");
  };

  return (
    <div className="relative flex items-center">
      <span className="mr-2 font-semibold text-[#007973]">{userName}</span>
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
     