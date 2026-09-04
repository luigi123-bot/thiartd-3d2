import { NextResponse } from "next/server";
import { getSupabaseAnon } from "~/lib/supabaseServer";
import { sendUnansweredMessageAlertEmail } from "~/lib/email-service";


// Set para rastrear mensajes para los que ya se programó o envió alerta
const notifiedMessages = new Set<string | number>();

export async function POST(req: Request) {
  const supabase = getSupabaseAnon();
  try {
    const body = await req.json() as {
      messageId?: number | string;
      clienteNombre?: string;
      clienteEmail?: string;
      mensaje?: string;
    };

    const { messageId, clienteNombre = "Cliente", clienteEmail = "", mensaje = "" } = body;

    if (!clienteEmail || !mensaje) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const key = `${clienteEmail}-${messageId ?? Date.now()}`;
    if (notifiedMessages.has(key)) {
      return NextResponse.json({ status: "already_scheduled" });
    }
    notifiedMessages.add(key);

    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "thiart3d@gmail.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const adminChatUrl = `${appUrl}/admin/mensajes`;

    // Programar chequeo a los 2 minutos (120,000 ms)
    setTimeout(() => { void (async () => {
      try {
        // Verificar si el mensaje fue leído o respondido
        if (messageId) {
          const { data: msgRow } = await supabase
            .from("mensajes")
            .select("id, leido, respondido")
            .eq("id", messageId)
            .single();

          if (msgRow?.leido || msgRow?.respondido) {
            console.log(`ℹ️ Mensaje #${messageId} ya fue atendido, no se envía correo.`);
            return;
          }
        }

        // Verificar si algún administrador respondió a este cliente en los últimos 2 minutos
        const { data: adminReplies } = await supabase
          .from("mensajes")
          .select("id")
          .eq("email", clienteEmail)
          .eq("nombre", "Admin")
          .gte("creado_en", new Date(Date.now() - 150000).toISOString())
          .limit(1);

        if (adminReplies && adminReplies.length > 0) {
          console.log(`ℹ️ Un asesor ya respondió a ${clienteEmail}, no se envía correo.`);
          return;
        }

        // Si sigue sin leer/responder tras 2 minutos, enviar alerta por correo
        console.log(`⏰ 2 minutos sin respuesta para mensaje de ${clienteEmail}. Enviando correo a ${adminEmail}...`);
        await sendUnansweredMessageAlertEmail({
          to: adminEmail,
          clienteNombre,
          clienteEmail,
          mensaje,
          creadoEn: new Date().toISOString(),
          adminChatUrl,
        });
      } catch (err) {
        console.error("❌ Error en chequeo retardado de mensaje sin responder:", err);
      }
    })(); }, 120000); // 2 minutos

    return NextResponse.json({ status: "scheduled", delayMs: 120000 });
  } catch (err) {
    console.error("Error en notify-delayed route:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Endpoint GET para chequeo manual o cron de mensajes sin responder > 2 min
export async function GET() {
  const supabase = getSupabaseAnon();
  try {
    const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.GMAIL_USER ?? "thiart3d@gmail.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { data: unansweredMessages, error } = await supabase
      .from("mensajes")
      .select("*")
      .eq("leido", false)
      .neq("nombre", "Admin")
      .lte("creado_en", twoMinutesAgo)
      .order("creado_en", { ascending: false })
      .limit(5);

    if (error || !unansweredMessages || unansweredMessages.length === 0) {
      return NextResponse.json({ count: 0, message: "Sin mensajes pendientes de alerta" });
    }

    let sentCount = 0;
    for (const msg of unansweredMessages as { id: number; nombre: string; email: string; mensaje: string; creado_en: string }[]) {
      if (!notifiedMessages.has(msg.id)) {
        notifiedMessages.add(msg.id);
        await sendUnansweredMessageAlertEmail({
          to: adminEmail,
          clienteNombre: msg.nombre || "Cliente",
          clienteEmail: msg.email,
          mensaje: msg.mensaje,
          creadoEn: msg.creado_en,
          adminChatUrl: `${appUrl}/admin/mensajes`,
        });
        sentCount++;
      }
    }

    return NextResponse.json({ sentCount });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
