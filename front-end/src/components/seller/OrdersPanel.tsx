'use client';

import { useState } from 'react';
import { Search, Download, Truck, MapPin, ShieldCheck, ChevronRight } from 'lucide-react';
import { ORDER_LABELS, type SellerOrder } from '@/lib/seller/model';
import { money } from '@/lib/seller/domain';
import Dialog from './Dialog';
import { Badge, Empty, dateLabel, type PanelProps } from './ui';
import styles from './seller.module.css';

function csvCell(value: string) {
  return '"' + (/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""') + '"';
}
export default function OrdersPanel({ state, act }: PanelProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const orders = state.orders.filter(
    (order) =>
      (status === 'all' || order.status === status) &&
      `${order.id} ${order.buyer} ${order.productTitle}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = state.orders.find((order) => order.id === selectedId);
  function exportOrders() {
    const rows = [
      [
        'Pedido',
        'Comprador',
        'Producto',
        'Cantidad',
        'Estado',
        'Bruto Bs.',
        'Comisión Bs.',
        'Neto Bs.',
        'Fecha',
      ],
      ...orders.map((order) => [
        order.id,
        order.buyer,
        order.productTitle,
        String(order.quantity),
        ORDER_LABELS[order.status],
        (order.subtotalCents / 100).toFixed(2),
        (order.commissionCents / 100).toFixed(2),
        ((order.subtotalCents - order.commissionCents) / 100).toFixed(2),
        order.createdAt,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lockbox-ventas-demo.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function tone(order: SellerOrder) {
    return order.status === 'released'
      ? 'green'
      : order.status === 'paid'
        ? 'amber'
        : order.status === 'disputed'
          ? 'red'
          : 'blue';
  }
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Pedidos y ventas</h2>
          <p>Del pago protegido a la entrega, sigue cada pedido.</p>
        </div>
        <button className={styles.secondary} onClick={exportOrders} disabled={!orders.length}>
          <Download size={16} /> Exportar vista CSV
        </button>
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={17} />
          <input
            aria-label="Buscar pedidos"
            placeholder="Buscar pedido, comprador o producto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar pedidos"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {Object.entries(ORDER_LABELS).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <span className={styles.muted}>{orders.length} pedidos</span>
      </div>
      <div className={styles.card}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido / comprador</th>
                <th>Producto</th>
                <th>Estado</th>
                <th>Venta neta</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                    <small>
                      {order.buyer} · {dateLabel(order.createdAt)}
                    </small>
                  </td>
                  <td>
                    {order.productTitle}
                    <small>
                      {order.quantity} unidad{order.quantity === 1 ? '' : 'es'}
                    </small>
                  </td>
                  <td>
                    <Badge tone={tone(order)}>{ORDER_LABELS[order.status]}</Badge>
                  </td>
                  <td>
                    <strong>{money(order.subtotalCents - order.commissionCents)}</strong>
                    <small>Comisión {money(order.commissionCents)}</small>
                  </td>
                  <td>
                    <button
                      className={styles.iconButton}
                      aria-label={`Ver pedido ${order.id}`}
                      onClick={() => setSelectedId(order.id)}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && (
          <Empty title="Sin pedidos en esta vista">
            Prueba otra búsqueda o cambia el filtro de estado.
          </Empty>
        )}
      </div>
      <p className={styles.note}>
        <ShieldCheck size={18} />
        El vendedor despacha; el Punto LockBox confirma recepción y entrega. El pago se libera
        después de validar el QR.
      </p>
      {selected && (
        <Dialog title={`Pedido ${selected.id}`} onClose={() => setSelectedId(null)}>
          <div className={styles.form}>
            <Badge tone={tone(selected)}>{ORDER_LABELS[selected.status]}</Badge>
            <h3>{selected.productTitle}</h3>
            <p>
              {selected.buyer} · {selected.quantity} unidad{selected.quantity === 1 ? '' : 'es'}
            </p>
            <div className={styles.pointBox}>
              <MapPin size={22} />
              <div>
                <strong>{selected.point}</strong>
                <p>{selected.address}</p>
              </div>
            </div>
            <dl className={styles.amountList}>
              <div>
                <dt>Venta bruta</dt>
                <dd>{money(selected.subtotalCents)}</dd>
              </div>
              <div>
                <dt>Comisión de esta venta</dt>
                <dd>− {money(selected.commissionCents)}</dd>
              </div>
              <div>
                <dt>Ingreso neto</dt>
                <dd>{money(selected.subtotalCents - selected.commissionCents)}</dd>
              </div>
            </dl>
            <h3>Historial del pedido</h3>
            <ol className={styles.timeline}>
              {selected.history.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <strong>{ORDER_LABELS[event.status]}</strong>
                  <span>{dateLabel(event.at)}</span>
                </li>
              ))}
            </ol>
            {selected.status === 'paid' ? (
              <>
                <p className={styles.muted}>
                  Marca el despacho cuando el paquete esté preparado y salga hacia el punto
                  asignado. El dinero seguirá retenido.
                </p>
                <button
                  className={styles.primary}
                  onClick={() =>
                    act(
                      { type: 'dispatchOrder', id: selected.id, at: new Date().toISOString() },
                      'Pedido marcado como despachado. El pago sigue en garantía.',
                    )
                  }
                >
                  <Truck size={17} /> Marcar como despachado
                </button>
              </>
            ) : (
              <p className={styles.note}>
                La siguiente acción corresponde al comprador, al Punto LockBox o al sistema, según
                el estado.
              </p>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
