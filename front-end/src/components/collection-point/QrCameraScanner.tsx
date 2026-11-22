"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImageUp, LoaderCircle } from "lucide-react";

interface QrCameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QrCameraScanner({
  onScan,
  onClose,
}: QrCameraScannerProps) {
  const readerId = useId().replace(/:/g, "");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handledRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!active) return;

        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            void stopScanner().finally(() => onScan(decodedText.trim()));
          },
          () => {
            // Ignora frames sin QR detectado
          },
        );
      } catch (err) {
        if (!active) return;
        setCameraError(
          err instanceof Error
            ? "No se pudo acceder a la cámara. Verifica los permisos o sube una imagen del QR."
            : "Cámara no disponible.",
        );
      } finally {
        if (active) setStarting(false);
      }
    }

    async function stopScanner() {
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (!instance) return;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch {
        // Evita errores si el DOM ya se desmontó
      }
    }

    void startCamera();

    return () => {
      active = false;
      void stopScanner();
    };
  }, [onScan, readerId]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      let instance = scannerRef.current;

      if (instance?.isScanning) {
        await instance.stop();
      } else if (!instance) {
        instance = new Html5Qrcode(readerId);
        scannerRef.current = instance;
      }

      const decodedText = await instance.scanFile(file, false);
      handledRef.current = true;
      onScan(decodedText.trim());
    } catch {
      setCameraError("No se encontró un código QR válido en la imagen.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div
        id={readerId}
        style={{
          width: "100%",
          minHeight: "260px",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#0f172a",
        }}
      />

      {starting && (
        <p
          role="status"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <LoaderCircle size={16} aria-hidden="true" />
          Iniciando cámara…
        </p>
      )}

      {cameraError && (
        <p role="alert" style={{ color: "#dc2626", fontSize: "0.9rem" }}>
          {cameraError}
        </p>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "space-between",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void handleFileUpload(e)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <ImageUp size={16} aria-hidden="true" />
          Subir imagen QR
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <Camera size={16} aria-hidden="true" />
          Cerrar escáner
        </button>
      </div>
    </div>
  );
}