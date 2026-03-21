import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAbandonedCartReminder } from '~/lib/email-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    console.log('[REMIND] Buscando carritos abandonados antes de:', twoDaysAgo.toISOString());

    // Buscamos carritos que fueron actualizados hace más de 2 días y que no han sido recordados
    const { data: abandonedCarts, error: cartsError } = await supabase
      .from('carrito')
      .select('*, usuarios(*)')
      .lt('updated_at', twoDaysAgo.toISOString())
      .eq('recordatorio_enviado', false);

    if (cartsError) {
      console.error('Error fetching carts:', cartsError);
      throw cartsError;
    }

    console.log(`[REMIND] Se encontraron ${abandonedCarts?.length || 0} carritos abandonados.`);

    const results = [];
    interface AbandonedCartItem {
      nombre: string;
      cantidad: number;
      precio: number;
      imagen: string;
    }

    interface CartRow {
      id: string;
      usuarios: { email?: string; nombre?: string } | null;
      productos: string;
    }

    for (const rawCart of (abandonedCarts ?? [])) {
      const cart = rawCart as unknown as CartRow;
      const user = cart.usuarios;
      const email = user?.email;
      const nombre = user?.nombre ?? 'Cliente';

      if (!email) {
        console.warn(`[REMIND] El carrito ${cart.id} no tiene un usuario con email válido.`);
        continue;
      }

      let productos: AbandonedCartItem[] = [];
      try {
        productos = JSON.parse(cart.productos) as AbandonedCartItem[];
      } catch {
        console.error(`[REMIND] Error al parsear productos del carrito ${cart.id}`);
        continue;
      }

      if (!productos || productos.length === 0) {
        continue;
      }

      console.log(`[REMIND] Enviando recordatorio a ${email}...`);

      const emailResult = await sendAbandonedCartReminder({
        to: email,
        nombre: nombre,
        productos: productos,
      });

      if (emailResult.success) {
        console.log(`[REMIND] ✅ Recordatorio enviado a ${email}`);
        
        const { error: updateError } = await supabase
          .from('carrito')
          .update({ 
            recordatorio_enviado: true,
            ultimo_recordatorio_at: new Date().toISOString() 
          })
          .eq('id', cart.id);
        
        if (updateError) {
            console.error(`[REMIND] Error al actualizar estado del carrito ${cart.id}:`, updateError);
        }

        results.push({ email, status: 'sent' });
      } else {
        console.error(`[REMIND] ❌ Error enviando a ${email}:`, emailResult.error);
        results.push({ email, status: 'failed', error: emailResult.error });
      }
    }

    return NextResponse.json({ 
      processed: results.length,
      results 
    });
  } catch (err) {
    const error = err as { message: string };
    console.error('Error in reminder task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
