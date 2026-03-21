import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json() as { userId?: string; productos?: unknown[] };
    const userId = body.userId;
    const productos = body.productos;

    if (!userId || !productos) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Upsert the cart for the user
    // Usamos el id del usuario de auth o el de la tabla personalizada
    console.log(`[SYNC-CART] Guardando carrito para usuario_id: ${userId} (${productos.length} items).`);
    const { error } = await supabase
      .from('carrito')
      .upsert({
        usuario_id: userId,
        productos: JSON.stringify(productos),
        updated_at: new Date().toISOString(),
        recordatorio_enviado: false, // Reset reminder flag on update
      }, { onConflict: 'usuario_id' });
    
    if (error) {
      console.error(`[SYNC-CART] Error al guardar en Supabase:`, error);
      throw error;
    }

    console.log(`[SYNC-CART] ✅ Carrito persistido con éxito para ${userId}.`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err as { message: string };
    console.error('Error syncing cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    const { data: cart, error } = await supabase
      .from('carrito')
      .select('productos')
      .eq('usuario_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }

    const productos = cart?.productos ? (JSON.parse(cart.productos as string) as unknown[]) : [];
    return NextResponse.json({ productos });
  } catch (err) {
    const error = err as { message: string };
    console.error('Error in GET /api/cart/sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
