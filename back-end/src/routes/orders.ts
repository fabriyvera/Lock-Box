import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { clientFactory } from '../services/supabase-client.js';

const router = Router();

// Instanciamos el creador de clientes con tus variables de entorno
const getSupabaseClient = clientFactory(env);

// ==========================================
// POST: Crear una nueva orden (Escrow Checkout)
// ==========================================
router.post('/checkout', async (req: Request, res: Response): Promise<void> => {
  console.log("📥 Petición de Checkout recibida:", req.body);
  
  try {
    const { product_id, quantity, unit_price } = req.body;

    const subtotal = quantity * unit_price;
    const commissionRate = 0.05;
    const commissionAmount = subtotal * commissionRate;
    const totalAmount = subtotal + commissionAmount;

    const qrToken = `LBX-${uuidv4().substring(0, 12).toUpperCase()}`;
    const qrExpiresAt = new Date();
    qrExpiresAt.setDate(qrExpiresAt.getDate() + 5);

    const newOrder = {
      // Reemplaza los textos por estos IDs exactos que ya pasaron la validación:
      buyer_id: '623181c1-2575-4c3d-97a3-5caadbab1c28', 
      seller_id: '623181c1-2575-4c3d-97a3-5caadbab1c28', 
      lockbox_id: '089c131b-8e59-43b1-b21b-5ab0b03c21c7', 
      
      status: 'pending' as const,
      subtotal,
      commission_amount: commissionAmount,
      total_amount: totalAmount,
      qr_code: qrToken,
      qr_expires_at: qrExpiresAt.toISOString(),
      
      buyer_label: `Compra de producto #${product_id}`, 
      settlement_delay_hours: 48
    };

    const supabase = getSupabaseClient(); 

    // ¡Adiós al "as any"! Ahora TypeScript confía en tu database.ts
    const { data, error } = await supabase
      .from('orders')
      .insert(newOrder)
      .select('id')
      .single();

    if (error) {
      console.error("❌ Error al insertar en Supabase (orders):", error);
      res.status(500).json({ error: "Error en la base de datos al guardar la orden" });
      return;
    }

    // ==========================================
    // NUEVO: Insertar el detalle en order_items
    // ==========================================
    const orderItem = {
      order_id: data.id,           // Vinculamos con la orden recién creada
      product_id: product_id,      // Viene de tu frontend ('101', '102', etc.)
      product_title: `Producto #${product_id}`, // Nombre temporal
      quantity: quantity,
      unit_price: unit_price,
      subtotal: subtotal
    };

    // Usamos "as any" temporalmente por si product_id exige un UUID y envías '101'
    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItem as any);

    if (itemError) {
      console.error("❌ Error al insertar en order_items:", itemError);
      res.status(500).json({ error: "Error al guardar los detalles del producto" });
      return;
    }
    // ==========================================

    console.log("✅ Orden y detalles guardados con éxito en Supabase. ID:", data.id);
    res.status(201).json({
      message: "Pago retenido exitosamente",
      order_id: data.id, 
      qr_code: qrToken,
      lockbox_id: newOrder.lockbox_id,
      status: newOrder.status
    });

  } catch (error) {
    console.error("❌ Error inesperado en checkout:", error);
    res.status(500).json({ error: "Error interno al procesar el checkout" });
  }
});

// ==========================================
// GET: Escanear QR y obtener detalles de la orden
// ==========================================
router.get('/scan/:qr_code', async (req: Request, res: Response): Promise<void> => {
  console.log(`🔍 Escaneando código QR: ${req.params.qr_code}`);
  
  try {
    const { qr_code } = req.params;
    const supabase = getSupabaseClient(); 

    // ¡Adiós al "as any"! Reconoce qr_code nativamente.
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, buyer_label, qr_expires_at')
      .eq('qr_code' as any, qr_code)
      .single();

    if (error || !data) {
      console.log("⚠️ Código no encontrado o expirado.");
      res.status(404).json({ error: "Código QR no válido o no encontrado" });
      return;
    }

    res.status(200).json({
      message: "Orden encontrada exitosamente",
      order: data
    });

  } catch (error) {
    console.error("❌ Error interno al escanear QR:", error);
    res.status(500).json({ error: "Error al procesar el escáner" });
  }
});

// ==========================================
// PATCH: Actualizar el estado de la orden (Motor de estados)
// ==========================================
router.patch('/:order_id/status', async (req: Request, res: Response): Promise<void> => {
  console.log(`🔄 Petición para actualizar estado de la orden: ${req.params.order_id}`);
  
  try {
    const { order_id } = req.params;
    const { status } = req.body; // Ej: 'ready_for_pickup', 'completed', 'cancelled'

    if (!status) {
      res.status(400).json({ error: "El campo 'status' es obligatorio" });
      return;
    }

    const supabase = getSupabaseClient(); 

    // Actualizamos solo la columna status de la orden correspondiente
    const { data, error } = await supabase
      .from('orders')
      .update({ status: status })
      .eq('id' as any, order_id)
      .select('id, status')
      .single();

    if (error) {
      console.error("❌ Error al actualizar el estado:", error);
      res.status(500).json({ error: "Error en la base de datos al actualizar la orden" });
      return;
    }

    console.log(`✅ Estado de la orden actualizado a: ${status}`);
    res.status(200).json({
      message: "Estado de la orden actualizado exitosamente",
      order: data
    });

  } catch (error) {
    console.error("❌ Error interno al actualizar estado:", error);
    res.status(500).json({ error: "Error interno al procesar la actualización" });
  }
});
export default router;