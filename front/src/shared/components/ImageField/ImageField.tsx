import { type ChangeEvent, useRef, useState } from "react";
import { getAuthSession } from "../../auth/session";
import type { ApiResponse } from "../../types/api.types";
import "./ImageField.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type ImageUploadKind = "logo" | "product-image" | "opportunity-image";

type ImageFieldProps = {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  kind: ImageUploadKind;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
};

type UploadResponse = {
  url: string;
};

const toDisplaySrc = (value: string): string => {
  const cleaned = value.trim();
  if (!cleaned) {
    return "";
  }
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.startsWith("blob:")) {
    return cleaned;
  }
  // Accept both "/uploads/..." and "uploads/..."
  if (cleaned.startsWith("/uploads/") || cleaned.startsWith("uploads/")) {
    const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
    return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
  }
  return cleaned;
};

export default function ImageField({
  label,
  value,
  onChange,
  kind,
  disabled = false,
  placeholder = "https://... o subí un archivo",
  helpText = "Podés subir JPG/PNG/WEBP (máx. 3 MB) o pegar una URL."
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    kind === "logo"
      ? `${API_BASE_URL}/api/uploads/logo`
      : kind === "opportunity-image"
        ? `${API_BASE_URL}/api/uploads/opportunity-image`
        : `${API_BASE_URL}/api/uploads/product-image`;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || disabled) {
      return;
    }

    const token = getAuthSession()?.token;
    if (!token) {
      setErrorMessage("Tenés que iniciar sesión para subir imágenes.");
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Formato no permitido. Usá JPG, PNG o WEBP.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage("La imagen supera el máximo de 3 MB.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body
      });

      const result = (await response.json()) as ApiResponse<UploadResponse>;

      if (!response.ok || !result.success || !result.data?.url) {
        setErrorMessage(result.error ?? "No se pudo subir la imagen.");
        return;
      }

      onChange(result.data.url);
    } catch {
      setErrorMessage("No se pudo conectar para subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const previewSrc = toDisplaySrc(value);

  return (
    <div className="image-field">
      <label className="image-field-label">
        {label}
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setErrorMessage("");
          }}
          disabled={disabled || isUploading}
          placeholder={placeholder}
        />
      </label>

      <div className="image-field-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          hidden
          onChange={(event) => void handleFileChange(event)}
          disabled={disabled || isUploading}
        />
        <button
          type="button"
          className="image-field-upload-btn"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? "Subiendo..." : "Subir imagen"}
        </button>
        {value.trim() ? (
          <button
            type="button"
            className="image-field-clear-btn"
            onClick={() => onChange("")}
            disabled={disabled || isUploading}
          >
            Quitar
          </button>
        ) : null}
      </div>

      <small className="image-field-help">{helpText}</small>
      {errorMessage ? <p className="image-field-error">{errorMessage}</p> : null}

      {previewSrc ? (
        <div className="image-field-preview">
          <img src={previewSrc} alt="Vista previa" />
        </div>
      ) : null}
    </div>
  );
}

export { toDisplaySrc };
