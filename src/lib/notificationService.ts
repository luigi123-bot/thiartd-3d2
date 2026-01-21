import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface PedidoNotificacion {
  id: number;
  estado: string;
  datos_contacto: string;
  numero_tracking?: string;
  empresa_envio?: string;
  ciudad_envio?: string;
  departamento_envio?: string;
}

interface DatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
}

interface NotificacionData {
  id?: number;
  usuario_id?: string;
  pedido_id: number;
  tipo: 'email' | 'push' | 'sms';
  titulo: string;
  mensaje: string;
  enviado: boolean;
  fecha_envio?: string;
  created_at?: string;
}

export class NotificationService {
  /**
   * Envía notificación cuando cambia el estado de un pedido
   */
  static async notificarCambioEstado(
    pedidoId: number,
    nuevoEstado: string,
    datosAdicionales?: {
      ubicacion?: string;
      descripcion?: string;
      numeroTracking?: string;
      empresaEnvio?: string;
    }
  ): Promise<void> {
    try {
      // Obtener datos del pedido
      const { data: pedido } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single<PedidoNotificacion>();

      if (!pedido) return;

      const datosContacto = this.parseDatosContacto(pedido.datos_contacto ?? "{}");
      
      if (!datosContacto.email) {
        console.warn(`No se encontró email para el pedido ${pedidoId}`);
        return;
      }

      // Crear mensaje según el estado
      const { titulo, mensaje } = this.generarMensajeEstado(nuevoEstado, pedido, datosAdicionales);

      // Guardar notificación en la base de datos
      const notificacion: Omit<NotificacionData, 'id' | 'created_at'> = {
        pedido_id: pedidoId,
        tipo: 'email',
        titulo,
        mensaje,
        enviado: false,
      };

      const { data } = await supabase
        .from("notificaciones")
        .insert([notificacion])
        .select()
        .single<NotificacionData>();

      if (data) {
        // Aquí puedes integrar con un servicio de email real
        await this.enviarEmail(datosContacto.email, titulo, mensaje);
        
        // Marcar como enviado
        await supabase
          .from("notificaciones")
          .update({ enviado: true, fecha_envio: new Date().toISOString() })
          .eq("id", data.id);
      }

    } catch (error) {
      console.error("Error enviando notificación:", error);
    }
  }

  /**
   * Parsea los datos de contacto de forma segura
   */
  private static parseDatosContacto(datosContactoStr: string): DatosContacto {
    try {
      const parsed = JSON.parse(datosContactoStr) as unknown;
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as DatosContacto;
      }
      return {};
    } catch {
      return {};
    }
  }

  /**
   * Genera el título y mensaje según el estado
   */
  private static generarMensajeEstado(
    estado: string,
    pedido: PedidoNotificacion,
    datosAdicionales?: {
      ubicacion?: string;
      descripcion?: string;
      numeroTracking?: string;
      empresaEnvio?: string;
    }
  ): { titulo: string; mensaje: string } {
    const pedidoNum = `#${pedido.id}`;
    
    switch (estado) {
      case "pagado":
        return {
          titulo: `¡Pago confirmado para tu pedido ${pedidoNum}!`,
          mensaje: `Hemos confirmado el pago de tu pedido ${pedidoNum}. Comenzaremos a prepararlo pronto y te notificaremos cuando esté listo para envío.`
        };
      
      case "en_preparacion":
        return {
          titulo: `Tu pedido ${pedidoNum} está en preparación`,
          mensaje: `¡Buenas noticias! Hemos comenzado a preparar tu pedido ${pedidoNum}. Te notificaremos cuando esté listo para envío.`
        };
      
      case "en_envio":
        const trackingInfo = datosAdicionales?.numeroTracking 
          ? ` Tu número de seguimiento es: ${datosAdicionales.numeroTracking}`
          : "";
        const empresaInfo = datosAdicionales?.empresaEnvio
          ? ` con ${datosAdicionales.empresaEnvio}`
          : "";
        
        return {
          titulo: `Tu pedido ${pedidoNum} está en camino`,
          mensaje: `¡Tu pedido ${pedidoNum} ha sido enviado${empresaInfo}!${trackingInfo} Recibirás actualizaciones sobre su ubicación.`
        };
      
      case "en_transito":
        const ubicacionInfo = datosAdicionales?.ubicacion 
          ? ` Se encuentra actualmente en: ${datosAdicionales.ubicacion}`
          : "";
        
        return {
          titulo: `Actualización de envío - Pedido ${pedidoNum}`,
          mensaje: `Tu pedido ${pedidoNum} está en tránsito.${ubicacionInfo} ${datosAdicionales?.descripcion ?? ""}`
        };
      
      case "entregado":
        return {
          titulo: `¡Tu pedido ${pedidoNum} ha sido entregado!`,
          mensaje: `¡Excelente! Tu pedido ${pedidoNum} ha sido entregado exitosamente. Esperamos que disfrutes tu compra. ¡Gracias por elegirnos!`
        };
      
      case "problema_entrega":
        return {
          titulo: `Problema con la entrega del pedido ${pedidoNum}`,
          mensaje: `Hemos detectado un problema con la entrega de tu pedido ${pedidoNum}. ${datosAdicionales?.descripcion ?? ""} Nuestro equipo está trabajando para solucionarlo. Te contactaremos pronto.`
        };
      
      default:
        return {
          titulo: `Actualización del pedido ${pedidoNum}`,
          mensaje: `Tu pedido ${pedidoNum} ha sido actualizado al estado: ${estado}. ${datosAdicionales?.descripcion ?? ""}`
        };
    }
  }

  /**
   * Envía email (integrar con servicio real como SendGrid, Resend, etc.)
   */
  private static async enviarEmail(email: string, titulo: string, mensaje: string): Promise<void> {
    try {
      // Aquí integrarías con tu servicio de email preferido
      console.log("Enviando email a:", email);
      console.log("Título:", titulo);
      console.log("Mensaje:", mensaje);
      
      // Ejemplo de integración (descomenta cuando tengas el servicio configurado):
      /*
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, titulo, mensaje })
      });
      
      if (!response.ok) {
        throw new Error('Error enviando email');
      }
      */
      
    } catch (error) {
      console.error("Error enviando email:", error);
      throw error;
    }
  }

  /**
   * Obtiene notificaciones pendientes de envío
   */
  static async obtenerNotificacionesPendientes(): Promise<NotificacionData[]> {
    const { data } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("enviado", false)
      .order("created_at", { ascending: true });
    
    return (data as NotificacionData[]) ?? [];
  }

  /**
   * Reintenta envío de notificaciones fallidas
   */
  static async reintentarNotificacionesFallidas(): Promise<NotificacionData[]> {
    const notificacionesPendientes = await this.obtenerNotificacionesPendientes();
    
    for (const notificacion of notificacionesPendientes) {
      try {
        // Obtener datos del pedido para el email
        const { data: pedido } = await supabase
          .from("pedidos")
          .select("datos_contacto")
          .eq("id", notificacion.pedido_id)
          .single<{ datos_contacto: string }>();

        if (pedido) {
          const datosContacto = this.parseDatosContacto(pedido.datos_contacto);
          
          if (datosContacto.email) {
            await this.enviarEmail(datosContacto.email, notificacion.titulo, notificacion.mensaje);
            
            // Marcar como enviado
            await supabase
              .from("notificaciones")
              .update({ enviado: true, fecha_envio: new Date().toISOString() })
              .eq("id", notificacion.id);
          }
        }
      } catch (error) {
        console.error(`Error reenviando notificación ${notificacion.id}:`, error);
      }
    }
    
    return (await this.obtenerNotificacionesPendientes());
  }
}
