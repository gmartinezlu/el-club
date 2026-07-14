import { useRef, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { uploadAvatar } from "../services/supabase/avatarUpload";
import { getErrorMessage } from "../utils/errors";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}

export function AvatarUpload({
  userId,
  currentUrl,
  onUploaded,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAvatar(userId, file);
      onUploaded(url);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo subir la foto"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm text-club-muted">Foto de perfil</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-club-green/10 bg-white/60 transition hover:border-club-green/30 disabled:opacity-60"
        >
          {currentUrl ? (
            <img
              src={currentUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-club-green">
              <Sparkles className="h-6 w-6" strokeWidth={1.5} />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
          </span>
        </button>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-2xl border border-club-green/15 bg-white/55 px-4 py-2 text-sm text-club-green transition hover:bg-white/80 disabled:opacity-60"
          >
            {uploading ? "Subiendo..." : "Cambiar foto"}
          </button>
          <p className="text-xs text-club-muted">JPG o PNG, máximo 2 MB</p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
