"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (value: string) => void;
}

export default function QrScanner({ onScan }: Props) {
  const [ativa, setAtiva] = useState(false);
  const [erro, setErro] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function iniciar() {
    setErro("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setAtiva(true);
      iniciarLeitura();
    } catch {
      setErro("Sem acesso à câmera. Verifique as permissões.");
    }
  }

  function iniciarLeitura() {
    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        const match = code.data.match(/\/validar\/([a-f0-9-]{36})/);
        const valor = match ? match[1] : code.data;
        parar();
        onScan(valor);
      }
    }, 200);
  }

  function parar() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setAtiva(false);
  }

  useEffect(() => () => parar(), []);

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

      <video
        ref={videoRef}
        muted
        playsInline
        className={`w-full max-w-xs rounded ${ativa ? "block" : "hidden"}`}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
