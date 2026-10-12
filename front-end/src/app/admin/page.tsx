"use client";

import { useState, useRef, useEffect } from "react";

// --- TIPOS Y DATOS SIMULADOS PARA LA VISTA ---
type LockerStatus = 'disponible' | 'ocupado' | 'listo';
interface Locker { id: string; status: LockerStatus; info?: string; }
interface Activity { id: number; text: string; time: string; type: 'success' | 'info' | 'warning'; }

const initialLockers: Locker[] = [
  { id: 'A1', status: 'disponible' },
  { id: 'A2', status: 'ocupado', info: 'Esperando Retiro' },
  { id: 'A3', status: 'disponible' },
  { id: 'A4', status: 'listo', info: 'Repartidor en camino' },
  { id: 'B1', status: 'ocupado', info: 'ID: 674a...af78' },
  { id: 'B2', status: 'listo', info: 'Dana Jaroco' },
  { id: 'B3', status: 'disponible' },
  { id: 'B4', status: 'disponible' },
];

export default function AdminDashboard() {
  const [scannedCode, setScannedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockers, setLockers] = useState<Locker[]>(initialLockers);
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, text: "Casillero A3 abierto por Cliente", time: "10:45", type: "success" },
    { id: 2, text: "Pedido 674a97b5 depositado en B1", time: "10:30", type: "warning" },
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Mantener el foco en el input para lectores QR físicos
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleProcessQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode) return;

    setLoading(true);

    try {
      // 1. Petición a tu API real de Supabase / Express
      const response = await fetch(`http://localhost:4000/orders/${scannedCode.trim()}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }), 
      });

      if (!response.ok) throw new Error("Código inválido");

      // 2. Actualizar la Actividad Reciente en la UI
      const newActivity: Activity = {
        id: Date.now(),
        text: `Orden ${scannedCode.substring(0, 8)} entregada con éxito`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'success'
      };
      setActivities([newActivity, ...activities]);

      // 3. Simular que un casillero se libera (ej. el B1)
      setLockers(prev => prev.map(l => l.id === 'B1' ? { ...l, status: 'disponible', info: undefined } : l));
      
    } catch (error) {
      console.error(error);
      const errorActivity: Activity = {
        id: Date.now(),
        text: `Fallo al leer código: ${scannedCode.substring(0, 6)}...`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'warning'
      };
      setActivities([errorActivity, ...activities]);
    } finally {
      setLoading(false);
      setScannedCode(""); 
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // --- COLORES SEGÚN ESTADO ---
  const getStatusColor = (status: LockerStatus) => {
    if (status === 'disponible') return 'border-[#4ade80] text-[#4ade80]';
    if (status === 'ocupado') return 'border-[#f97316] text-[#f97316]';
    return 'border-[#3b82f6] text-[#3b82f6]';
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-[#4ade80] selection:text-black">
      {/* NAVBAR SUPERIOR */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex bg-[#1e293b] rounded overflow-hidden font-bold">
            <span className="bg-[#4ade80] text-[#0B0F19] px-3 py-1">LOCK</span>
            <span className="px-3 py-1 text-white">BOX</span>
          </div>
          <span className="text-gray-400 text-sm hidden md:block">Vista Administrador - Punto de Recojo</span>
        </div>
        <div className="bg-[#4ade80] text-[#0B0F19] px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-[#0B0F19] rounded-full animate-pulse"></div>
          Live Locker Status
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center">
            👤
          </div>
          <span className="hidden sm:block">Admin - La Paz</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Control del Punto de Recojo - Casilleros Centro</h1>

        {/* TARJETAS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-3"><span className="text-[#f97316]">📦</span> Casilleros Ocupados</div>
            <span className="font-bold text-gray-400">(12/20)</span>
          </div>
          <div className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-3"><span className="text-[#eab308]">⏳</span> Pendientes de Retiro</div>
            <span className="font-bold text-gray-400">(8)</span>
          </div>
          <div className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-3"><span className="text-[#4ade80]">✅</span> Entregados Hoy</div>
            <span className="font-bold text-gray-400">(14)</span>
          </div>
        </div>

        {/* SECCIÓN PRINCIPAL: ESCÁNER Y ACTIVIDAD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LADO IZQUIERDO: Escáner y Grid (Ocupa 2 columnas en PC) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* CAJA DEL ESCÁNER */}
            <div className="bg-[#111827] border border-[#4ade80]/30 p-1 rounded-2xl overflow-hidden">
              <h2 className="text-lg font-bold p-4 pb-0 mb-4">Escanear Código QR</h2>
              <div className="flex flex-col md:flex-row gap-6 p-4 pt-0">
                
                {/* Animación simulación de cámara */}
                <div className="w-full md:w-1/2 bg-[#1e293b] aspect-video rounded-xl relative flex items-center justify-center border border-gray-700">
                  {/* Esquinas verdes del lector QR */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-[#4ade80] rounded-tl"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-[#4ade80] rounded-tr"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-[#4ade80] rounded-bl"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-[#4ade80] rounded-br"></div>
                  {/* Línea láser de escaneo */}
                  <div className="w-[80%] h-[1px] bg-[#4ade80] shadow-[0_0_8px_#4ade80] animate-[scan_2s_ease-in-out_infinite] absolute"></div>
                </div>

                {/* Formulario de Input */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <h3 className="font-bold text-center mb-4">Escanear QR de Cliente o Repartidor</h3>
                  <form onSubmit={handleProcessQR} className="flex flex-col gap-4">
                    <input
                      ref={inputRef}
                      type="text"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      placeholder="Esperando lectura de QR..."
                      disabled={loading}
                      className="w-full bg-[#1e293b] border border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-[#4ade80] transition-colors text-white"
                    />
                    <button 
                      type="submit"
                      disabled={loading || !scannedCode}
                      className={`w-full p-3 rounded-lg font-bold transition-all ${
                        loading || !scannedCode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-[#4ade80] text-black hover:bg-[#34d399]'
                      }`}
                    >
                      {loading ? 'Procesando...' : 'Procesar Escaneo / Abrir Casillero'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* GRID DE CASILLEROS */}
            <div>
              <h2 className="text-lg font-bold mb-4">Estado de Casilleros (Locker Grid)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {lockers.map((locker) => (
                  <div key={locker.id} className={`p-4 rounded-xl border-2 bg-[#111827] ${getStatusColor(locker.status)} bg-opacity-20`}>
                    <div className="font-bold text-xl mb-1">{locker.id}</div>
                    <div className="text-xs font-semibold capitalize">{locker.status}</div>
                    {locker.info && <div className="text-[10px] text-gray-400 mt-2">{locker.info}</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* LADO DERECHO: Actividad Reciente */}
          <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
            <h2 className="text-lg font-bold mb-6">Actividad Reciente</h2>
            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex gap-4 p-3 bg-[#1e293b] rounded-lg border border-gray-700/50">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                    ${act.type === 'success' ? 'bg-[#4ade80]/20 text-[#4ade80]' : 'bg-[#f97316]/20 text-[#f97316]'}`}
                  >
                    {act.type === 'success' ? '🔓' : '📦'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 leading-tight">{act.text}</p>
                    <span className="text-xs text-gray-500">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Estilos para la animación del láser */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 10%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 90%; }
        }
      `}} />
    </div>
  );
}