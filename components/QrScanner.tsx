"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (value: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const [ativa, setAtiva] = useState(false);
  const [erro, setErro] = useState("");
  const scannerRef = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null);
  const elementId = "qr-scanner-element";

  async function iniciar() {
    setErro("");
    const { Html5Qrcode } = await import("html5-qrcode");
    scannerRef.current = new Html5Qrcode(elementId);
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Extrai só o UUID do QR code se for uma URL /validar/UUID
          const match = decodedText.match(/\/validar\/([a-f0-9-]{36})/);
          const valor = match ? match[1] : decodedText;
          onScan(valor);
          parar();
        },
        () => {}
      );
      setAtiva(true);
    } catch {
      setErro("Sem acesso à câmera. Verifique as permissões.");
      scannerRef.current = null;
    }
  }

  async function parar() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setAtiva(false);
  }

  useEffect(() => {
    return () => { parar(); };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={ativa ? parar : iniciar}
        className={`px-4 py-3 border text-xs tracking-widest uppercase transition-all ${
          ativa
            ? "border-red-500 text-red-400 hover:bg-red-500 hover:text-black"
            : "border-white text-white hover:bg-white hover:text-black"
        }`}
      >
        {ativa ? "Fechar câmera" : "Abrir câmera"}
      </button>

      {erro && <p className="text-red-500 text-xs">{erro}</p>}

      <div
        id={elementId}
        className={`w-full rounded overflow-hidden ${ativa ? "block" : "hidden"}`}
        style={{ maxWidth: 320 }}
      />
    </div>
  );
}
