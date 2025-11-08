'use client';

import { useState } from "react";
import SupabaseAuth from "~/components/SupabaseAuth";
import { Button } from "~/components/ui/button";

export default function UsuarioPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">Portal de Usuario</h1>
        <Button onClick={() => setShowAuth(true)} size="lg">
          Iniciar Sesión / Registrarse
        </Button>
      </div>
      
      <SupabaseAuth 
        open={showAuth} 
        onOpenChange={setShowAuth}
      />
    </div>
  );
}