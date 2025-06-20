export default function Footer() {
  return (
    <footer className="w-full bg-[#007973] text-white py-6 mt-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img
            src="/IG%20Foto%20de%20Perfil.png"
            alt="Logo Thiart3D"
            className="h-8 w-8 rounded-full object-cover shadow"
          />
          <span className="font-bold text-lg">Thiart3D</span>
        </div>
        <div className="text-sm mt-2 md:mt-0">
          © {new Date().getFullYear()} Thiart3D. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
