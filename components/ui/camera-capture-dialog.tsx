"use client";
import { ErrorToast } from "@/components/ui/error-toast";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { RiCameraLine, RiCameraSwitchLine, RiCheckLine, RiCloseLine, RiImageLine, RiLoader4Line, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { compressImage, preparePhoto } from "@/lib/image-compress";

type Facing = "environment" | "user";

/** Câmera ao vivo exige getUserMedia e conexão segura (HTTPS ou localhost). */
const liveCameraSupported = () => typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;


// Copiado do Nodus. Câmera ao vivo no próprio modal. Sem suporte (ou sem HTTPS), usa a câmera nativa do aparelho ou a galeria.
// Atalho de um toque: "Capturar" abre a câmera (ao vivo no modal ou a nativa) e "Anexar" abre a galeria.
export function PhotoSourceButtons({ title, disabled, onFile }: { title: string; disabled?: boolean; onFile: (file: File) => void }) {
  const nativeInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [failure, setFailure] = useState("");
  async function accept(file: File | undefined) {
    if (!file) return;
    setProcessing(true);
    setFailure("");
    try {
      onFile(await preparePhoto(file));
    } catch (reason) {
      // Antes o erro sumia e a foto simplesmente não era anexada.
      setFailure(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setProcessing(false);
    }
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {failure && <p role="alert" className="col-span-2 text-sm text-destructive">{failure}</p>}
      <Button type="button" className="h-11" disabled={disabled || processing}
        onClick={() => liveCameraSupported() ? setCapturing(true) : nativeInput.current?.click()}>
        {processing ? <RiLoader4Line className="animate-spin" /> : <RiCameraLine />}Capturar
      </Button>
      <Button type="button" variant="secondary" className="h-11" disabled={disabled || processing} onClick={() => galleryInput.current?.click()}>
        <RiImageLine />Anexar
      </Button>
      <input ref={nativeInput} type="file" accept="image/*" capture="environment" hidden
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void accept(file); }} />
      <input ref={galleryInput} type="file" accept="image/*" hidden
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void accept(file); }} />
      <CameraCaptureDialog open={capturing} onOpenChange={setCapturing} title={title} fullscreen
        onConfirm={(file) => { onFile(file); setCapturing(false); }} />
    </div>
  );
}

export function CameraCaptureDialog({ open, onOpenChange, title, description, confirmLabel = "Usar foto", busy = false, error, children, onConfirm, onOpenGallery, fullscreen = false }: {
  /** No celular, abre como app de câmera em tela cheia (sem campos extras abaixo). */
  fullscreen?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  children?: ReactNode;
  onConfirm: (file: File) => void;
  onOpenGallery?: () => void;
}) {
  const [mobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  if (fullscreen && mobile && !children) return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent showCloseButton={false}
        className="top-0 left-0 h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none bg-black p-0 text-white ring-0 sm:max-w-none sm:p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {open && <FullscreenCamera title={title} busy={busy} error={error} confirmLabel={confirmLabel} onCancel={() => onOpenChange(false)} onConfirm={onConfirm} onOpenGallery={onOpenGallery} />}
      </DialogContent>
    </Dialog>
  );
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* Monta só aberto: a câmera liga ao abrir e desliga ao fechar. */}
        {open && (
          <CameraCapture busy={busy} error={error} confirmLabel={confirmLabel} onCancel={() => onOpenChange(false)} onConfirm={onConfirm} onOpenGallery={onOpenGallery}>
            {children}
          </CameraCapture>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CameraCapture({ busy, error, confirmLabel, children, onCancel, onConfirm, onOpenGallery }: {
  busy: boolean;
  error?: string;
  confirmLabel: string;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  onOpenGallery?: () => void;
}) {
  const { video, nativeInput, galleryInput, live, cameraError, streaming, photo, preview, processing, setFacing, accept, capture, retake } = useCamera();

  return (
    <div className="grid gap-4">
      <div className="relative grid aspect-[3/4] max-h-[55dvh] w-full place-items-center overflow-hidden rounded-xl bg-black text-white sm:aspect-[4/3]">
        {preview ? (
          <img src={preview} alt="Foto capturada" className="size-full object-contain" />
        ) : live && !cameraError ? (
          <>
            <video ref={video} playsInline muted className="size-full object-cover" aria-label="Visualização da câmera" />
            {!streaming && <RiLoader4Line className="absolute size-8 animate-spin opacity-70" aria-label="Abrindo câmera" />}
          </>
        ) : (
          <div className="grid w-full max-w-xs justify-items-center gap-3 p-6 text-center text-sm text-white/80">
            {cameraError && <p>{cameraError}</p>}
            <Button type="button" size="lg" className="h-14 w-full text-base" onClick={() => nativeInput.current?.click()}>
              <RiCameraLine className="size-5" />Abrir câmera
            </Button>
            <Button type="button" size="lg" variant="secondary" className="h-12 w-full" onClick={() => onOpenGallery ? onOpenGallery() : galleryInput.current?.click()}>
              <RiImageLine />Anexar da galeria
            </Button>
          </div>
        )}
        {processing && <div className="absolute inset-0 grid place-items-center bg-black/50"><RiLoader4Line className="size-8 animate-spin" /></div>}
        {live && streaming && !preview && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 bg-linear-to-t from-black/60 to-transparent p-4">
            <button type="button" aria-label="Capturar foto" onClick={capture} disabled={processing}
              className="size-16 rounded-full border-4 border-white bg-white/30 outline-none transition-transform active:scale-90 focus-visible:ring-4 focus-visible:ring-white/50" />
            <button type="button" aria-label="Trocar câmera" onClick={() => setFacing((value) => value === "environment" ? "user" : "environment")}
              className="absolute right-4 grid size-10 place-items-center rounded-full bg-black/40 outline-none focus-visible:ring-3 focus-visible:ring-white/50">
              <RiCameraSwitchLine className="size-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {photo ? (
          <Button type="button" variant="outline" size="sm" onClick={retake} disabled={busy}><RiRefreshLine />Tirar outra</Button>
        ) : live && !cameraError && (
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenGallery ? onOpenGallery() : galleryInput.current?.click()}><RiImageLine />Anexar da galeria</Button>
        )}
        <input ref={nativeInput} type="file" accept="image/*" capture="environment" hidden
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void accept(file, file.name); }} />
        <input ref={galleryInput} type="file" accept="image/*" hidden
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void accept(file, file.name); }} />
      </div>

      {children}
      <ErrorToast message={error} />
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button>
        <Button type="button" disabled={!photo || busy || processing} onClick={() => photo && onConfirm(photo)}>
          {busy ? <><RiLoader4Line className="animate-spin" />Salvando…</> : confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

// Câmera ao vivo (ou câmera nativa/galeria como reserva), compartilhada pelo modal e pela tela cheia.
function useCamera() {
  const video = useRef<HTMLVideoElement>(null);
  const nativeInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [live] = useState(liveCameraSupported);
  const [facing, setFacing] = useState<Facing>("environment");
  const [cameraError, setCameraError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!live || photo) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false })
      .then((media) => {
        if (cancelled) return media.getTracks().forEach((track) => track.stop());
        stream = media;
        if (video.current) {
          video.current.srcObject = media;
          void video.current.play().catch(() => {});
        }
        setStreaming(true);
        setCameraError("");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setStreaming(false);
        setCameraError(reason instanceof DOMException && reason.name === "NotAllowedError"
          ? "A permissão da câmera foi negada. Use a câmera do aparelho ou escolha da galeria."
          : "Não foi possível abrir a câmera. Use a câmera do aparelho ou escolha da galeria.");
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      setStreaming(false);
    };
  }, [live, facing, photo]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const accept = async (source: Blob, name?: string) => {
    setProcessing(true);
    try {
      const file = await compressImage(source, name);
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    } catch (reason) {
      setCameraError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setProcessing(false);
    }
  }
  const capture = () => {
    const element = video.current;
    if (!element?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext("2d")?.drawImage(element, 0, 0);
    canvas.toBlob((blob) => { if (blob) void accept(blob); }, "image/jpeg", 0.92);
  }
  const retake = () => {
    setPhoto(null);
    setPreview("");
  }

  const switchCamera = () => setFacing((value) => value === "environment" ? "user" : "environment");
  return { video, nativeInput, galleryInput, live, cameraError, streaming, photo, preview, processing, setFacing, accept, capture, retake, switchCamera };
}

// Câmera em tela cheia no celular, como o app de câmera: vídeo ocupando tudo, título e fechar no topo,
// galeria · disparador · trocar câmera embaixo; depois da foto, "Tirar outra" e confirmar.
function FullscreenCamera({ title, busy, error, confirmLabel, onCancel, onConfirm, onOpenGallery }: {
  title: string;
  busy: boolean;
  error?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  onOpenGallery?: () => void;
}) {
  const camera = useCamera();
  const { video, nativeInput, galleryInput, live, cameraError, streaming, photo, preview, processing } = camera;
  return (
    <div className="absolute inset-0 bg-black">
      {preview ? (
        <img src={preview} alt="Foto capturada" className="absolute inset-0 size-full object-contain" />
      ) : live && !cameraError ? (
        <>
          <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" aria-label="Visualização da câmera" />
          {!streaming && <RiLoader4Line className="absolute top-1/2 left-1/2 size-8 -translate-1/2 animate-spin opacity-70" aria-label="Abrindo câmera" />}
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="grid w-full max-w-xs justify-items-center gap-3 text-center text-sm text-white/80">
            {cameraError ? <p>{cameraError}</p> : !live && <p>A câmera do app precisa de conexão segura (HTTPS). Por este endereço, use a câmera do aparelho ou a galeria.</p>}
            <Button type="button" size="lg" className="h-14 w-full text-base" onClick={() => nativeInput.current?.click()}>
              <RiCameraLine className="size-5" />Abrir câmera
            </Button>
            <Button type="button" size="lg" variant="secondary" className="h-12 w-full" onClick={() => onOpenGallery ? onOpenGallery() : galleryInput.current?.click()}>
              <RiImageLine />Anexar da galeria
            </Button>
          </div>
        </div>
      )}
      {processing && <div className="absolute inset-0 grid place-items-center bg-black/50"><RiLoader4Line className="size-8 animate-spin" /></div>}

      <div className="absolute inset-x-0 top-0 flex items-center gap-3 bg-linear-to-b from-black/70 to-transparent px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
        <p className="min-w-0 flex-1 truncate text-base font-semibold">{title}</p>
        <button type="button" aria-label="Fechar câmera" disabled={busy} onClick={onCancel}
          className="grid size-10 place-items-center rounded-full bg-black/40 outline-none backdrop-blur-md focus-visible:ring-3 focus-visible:ring-white/50">
          <RiCloseLine className="size-6" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-6 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {error && <p role="alert" className="mb-3 text-center text-sm text-red-300">{error}</p>}
        {photo ? (
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="lg" className="h-12 flex-1 border-white/40 bg-white/10 text-white hover:bg-white/20" disabled={busy} onClick={camera.retake}>
              <RiRefreshLine />Tirar outra
            </Button>
            <Button type="button" size="lg" className="h-12 flex-1" disabled={busy || processing} onClick={() => onConfirm(photo)}>
              {busy ? <><RiLoader4Line className="animate-spin" />Salvando…</> : <><RiCheckLine />{confirmLabel}</>}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 items-center">
            <button type="button" aria-label="Anexar da galeria" onClick={() => onOpenGallery ? onOpenGallery() : galleryInput.current?.click()}
              className="grid size-12 place-items-center justify-self-start rounded-full bg-black/40 outline-none backdrop-blur-md focus-visible:ring-3 focus-visible:ring-white/50">
              <RiImageLine className="size-6" />
            </button>
            {live && streaming
              ? <button type="button" aria-label="Capturar foto" onClick={camera.capture} disabled={processing}
                  className="size-20 justify-self-center rounded-full border-4 border-white bg-white/30 outline-none transition-transform active:scale-90 focus-visible:ring-4 focus-visible:ring-white/50" />
              : <span />}
            {live && streaming
              ? <button type="button" aria-label="Trocar câmera" onClick={camera.switchCamera}
                  className="grid size-12 place-items-center justify-self-end rounded-full bg-black/40 outline-none backdrop-blur-md focus-visible:ring-3 focus-visible:ring-white/50">
                  <RiCameraSwitchLine className="size-6" />
                </button>
              : <span />}
          </div>
        )}
      </div>
      <input ref={nativeInput} type="file" accept="image/*" capture="environment" hidden
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void camera.accept(file, file.name); }} />
      <input ref={galleryInput} type="file" accept="image/*" hidden
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void camera.accept(file, file.name); }} />
    </div>
  );
}
