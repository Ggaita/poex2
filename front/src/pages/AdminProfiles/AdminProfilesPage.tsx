import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../layouts/PrivateLayout";
import { clearAuthSession, getAuthSession } from "../../shared/auth/session";
import type { ApiResponse } from "../../shared/types/api.types";
import type {
  AdminProfileFormState,
  CompanyProductView,
  CompanyProfileAdminView,
  CompanyProfileAuditLogView,
  ProfileEditMode,
  ProfileFieldKey
} from "./admin-profiles.types";
import OsmLocationPicker from "../../shared/components/OsmLocationPicker/OsmLocationPicker";
import ImageField, {
  toDisplaySrc
} from "../../shared/components/ImageField/ImageField";
import "./AdminProfilesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const editModeOptions: Array<{ value: ProfileEditMode; label: string }> = [
  { value: "agency", label: "Gestiona Agencia" },
  { value: "company", label: "Gestiona Empresa" },
  { value: "mixed", label: "Gestión Mixta" }
];

const fieldLabels: Record<ProfileFieldKey, string> = {
  companyName: "Nombre empresa",
  contactName: "Contacto",
  contactEmail: "Email",
  phone: "Teléfono",
  taxId: "CUIT / Tax ID",
  description: "Descripción",
  sector: "Sector",
  subSector: "Subsector",
  product: "Producto",
  keywords: "Palabras clave",
  tariffPosition: "Posición arancelaria",
  exportDestinations: "Mercados destino",
  awards: "Premios",
  certifications: "Certificaciones",
  logoUrl: "Logo empresa",
  website: "Sitio web",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  otherLink: "Otro enlace",
  address: "Dirección",
  city: "Ciudad",
  googleMapsEmbed: "Google Maps embed",
  latitude: "Latitud",
  longitude: "Longitud"
};

const visibilityFieldOrder = Object.keys(fieldLabels) as ProfileFieldKey[];

const emptyFormState: AdminProfileFormState = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  taxId: "",
  description: "",
  sector: "",
  subSector: "",
  product: "",
  keywords: "",
  tariffPosition: "",
  exportDestinations: "",
  awards: "",
  certifications: "",
  logoUrl: "",
  website: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  otherLink: "",
  address: "",
  city: "",
  googleMapsEmbed: "",
  latitude: "",
  longitude: ""
};

interface ProductFormState {
  name: string;
  description: string;
  imageUrl: string;
  tariffPosition: string;
  isTariffPositionUnknown: boolean;
}

const emptyProductFormState: ProductFormState = {
  name: "",
  description: "",
  imageUrl: "",
  tariffPosition: "",
  isTariffPositionUnknown: false
};

const toFormState = (profile: CompanyProfileAdminView): AdminProfileFormState => {
  return {
    companyName: profile.companyName ?? "",
    contactName: profile.contactName ?? "",
    contactEmail: profile.contactEmail ?? "",
    phone: profile.phone ?? "",
    taxId: profile.taxId ?? "",
    description: profile.description ?? "",
    sector: profile.sector ?? "",
    subSector: profile.subSector ?? "",
    product: profile.product ?? "",
    keywords: profile.keywords ?? "",
    tariffPosition: profile.tariffPosition ?? "",
    exportDestinations: profile.exportDestinations ?? "",
    awards: profile.awards ?? "",
    certifications: profile.certifications ?? "",
    logoUrl: profile.logoUrl ?? "",
    website: profile.website ?? "",
    facebook: profile.facebook ?? "",
    instagram: profile.instagram ?? "",
    linkedin: profile.linkedin ?? "",
    youtube: profile.youtube ?? "",
    otherLink: profile.otherLink ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    googleMapsEmbed: profile.googleMapsEmbed ?? "",
    latitude:
      typeof profile.latitude === "number" && Number.isFinite(profile.latitude)
        ? String(profile.latitude)
        : "",
    longitude:
      typeof profile.longitude === "number" && Number.isFinite(profile.longitude)
        ? String(profile.longitude)
        : ""
  };
};

const toProductFormState = (product: CompanyProductView): ProductFormState => {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    tariffPosition: product.tariffPosition ?? "",
    isTariffPositionUnknown: Boolean(product.isTariffPositionUnknown)
  };
};

const toProductTariffLabel = (product: CompanyProductView): string => {
  if (product.isTariffPositionUnknown) {
    return "P.A. no informada";
  }

  if (product.tariffPosition) {
    return `P.A.: ${product.tariffPosition}`;
  }

  return "P.A. sin definir";
};

const toProductReviewLabel = (product: CompanyProductView): string => {
  if (product.isAccepted === true) {
    return "Aceptado";
  }

  if (product.isAccepted === false) {
    return "No aceptado";
  }

  return "Pendiente de revisión";
};

const toProductReviewTone = (
  product: CompanyProductView
): "accepted" | "rejected" | "pending" => {
  if (product.isAccepted === true) {
    return "accepted";
  }

  if (product.isAccepted === false) {
    return "rejected";
  }

  return "pending";
};

const byProductUpdatedAtDesc = (
  left: CompanyProductView,
  right: CompanyProductView
): number => {
  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return right.id - left.id;
};

const upsertProduct = (
  currentProducts: CompanyProductView[],
  nextProduct: CompanyProductView
): CompanyProductView[] => {
  return [...currentProducts.filter((product) => product.id !== nextProduct.id), nextProduct].sort(
    byProductUpdatedAtDesc
  );
};

const removeProduct = (
  currentProducts: CompanyProductView[],
  productId: number
): CompanyProductView[] => {
  return currentProducts.filter((product) => product.id !== productId);
};

const trimNullable = (value: string): string | null => {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
};

const parseNullableNumber = (value: string): number | null => {
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStatusLabel = (profile: CompanyProfileAdminView): string => {
  return profile.isPublished ? "Publicado" : "No publicado";
};

const toAuditFieldLabel = (fieldKey?: string): string => {
  if (!fieldKey) {
    return "Cambio general";
  }

  if (fieldKey in fieldLabels) {
    return fieldLabels[fieldKey as ProfileFieldKey];
  }

  return fieldKey;
};

const toAuditActionTone = (action: string): "neutral" | "success" | "warning" | "danger" => {
  const normalized = action.toLowerCase();
  if (normalized.includes("unpublish") || normalized.includes("hide") || normalized.includes("ocult")) {
    return "warning";
  }

  if (
    normalized.includes("create") ||
    normalized.includes("approve") ||
    normalized.includes("publish") ||
    normalized.includes("visible")
  ) {
    return "success";
  }


  if (normalized.includes("delete") || normalized.includes("remove") || normalized.includes("reject")) {
    return "danger";
  }

  return "neutral";
};

const formatAuditDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

export default function AdminProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<CompanyProfileAdminView[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfileAdminView | null>(null);
  const [auditRows, setAuditRows] = useState<CompanyProfileAuditLogView[]>([]);
  const [formState, setFormState] = useState<AdminProfileFormState>(emptyFormState);
  const [query, setQuery] = useState("");
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormState, setCreateFormState] =
    useState<AdminProfileFormState>(emptyFormState);
  const [createEditMode, setCreateEditMode] = useState<ProfileEditMode>("mixed");
  const [createIsPublished, setCreateIsPublished] = useState(false);
  const [visibilityDraft, setVisibilityDraft] = useState<
    Record<ProfileFieldKey, boolean> | null
  >(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [reviewingProductId, setReviewingProductId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [productFormState, setProductFormState] =
    useState<ProductFormState>(emptyProductFormState);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showOnlyPendingProducts, setShowOnlyPendingProducts] = useState(false);
  const [reviewMessageByProductId, setReviewMessageByProductId] = useState<
    Record<number, string>
  >({});

  const activeVisibility = visibilityDraft ?? selectedProfile?.visibility ?? null;

  const visibleFieldsCount = useMemo(() => {
    if (!activeVisibility) {
      return 0;
    }

    return Object.values(activeVisibility).filter(Boolean).length;
  }, [activeVisibility]);

  const hasVisibilityChanges = useMemo(() => {
    if (!selectedProfile || !visibilityDraft) {
      return false;
    }

    return visibilityFieldOrder.some(
      (fieldKey) => visibilityDraft[fieldKey] !== selectedProfile.visibility[fieldKey]
    );
  }, [selectedProfile, visibilityDraft]);

  const filteredProducts = useMemo(() => {
    if (!selectedProfile) {
      return [];
    }

    const products = selectedProfile.products ?? [];
    if (!showOnlyPendingProducts) {
      return products;
    }

    return products.filter((product) => product.isAccepted === null);
  }, [selectedProfile, showOnlyPendingProducts]);

  const handleUnauthorized = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const getAuthHeader = (): string | null => {
    const token = getAuthSession()?.token;
    return token ? `Bearer ${token}` : null;
  };

  const loadProfiles = async (nextQuery?: string): Promise<void> => {
    setIsListLoading(true);
    setErrorMessage("");

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const search = nextQuery?.trim()
      ? `?q=${encodeURIComponent(nextQuery.trim())}`
      : "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profiles${search}`, {
        headers: { Authorization: authHeader }
      });
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setProfiles([]);
        setSelectedId(null);
        setSelectedProfile(null);
        setErrorMessage(result.error ?? "No se pudieron cargar los perfiles.");
        return;
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      setProfiles(rows);

      const keepSelected = selectedId !== null && rows.some((row) => row.id === selectedId);
      const nextSelectedId = keepSelected ? selectedId : (rows[0]?.id ?? null);
      setSelectedId(nextSelectedId);

if (nextSelectedId === null) {
        setSelectedProfile(null);
        setAuditRows([]);
        setFormState(emptyFormState);
        setVisibilityDraft(null);
        setProductFormState(emptyProductFormState);
        setEditingProductId(null);
        setReviewingProductId(null);
        setDeletingProductId(null);
        setReviewMessageByProductId({});
      }
    } catch {
      setProfiles([]);
      setSelectedId(null);
setSelectedProfile(null);
      setAuditRows([]);
      setVisibilityDraft(null);
      setProductFormState(emptyProductFormState);
      setEditingProductId(null);
      setReviewingProductId(null);
      setDeletingProductId(null);
      setReviewMessageByProductId({});
      setErrorMessage("No se pudo conectar con el backend para cargar perfiles.");
    } finally {
      setIsListLoading(false);
    }
  };

  const loadProfileDetail = async (profileId: number): Promise<void> => {
    setIsDetailLoading(true);
    setErrorMessage("");

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    try {
      const [detailResponse, auditResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/profiles/${profileId}`, {
          headers: { Authorization: authHeader }
        }),
        fetch(`${API_BASE_URL}/api/admin/profiles/${profileId}/audit?limit=80`, {
          headers: { Authorization: authHeader }
        })
      ]);

      const detailResult = (await detailResponse.json()) as ApiResponse<CompanyProfileAdminView>;
      const auditResult = (await auditResponse.json()) as ApiResponse<
        CompanyProfileAuditLogView[]
      >;

      if (detailResponse.status === 401 || auditResponse.status === 401) {
        handleUnauthorized();
        return;
      }

if (!detailResponse.ok || !detailResult.success) {
        setSelectedProfile(null);
        setAuditRows([]);
        setVisibilityDraft(null);
        setProductFormState(emptyProductFormState);
        setEditingProductId(null);
        setReviewingProductId(null);
        setDeletingProductId(null);
        setReviewMessageByProductId({});
        setErrorMessage(detailResult.error ?? "No se pudo cargar el perfil.");
        return;
      }

      setSelectedProfile(detailResult.data);
      setFormState(toFormState(detailResult.data));
      setVisibilityDraft({ ...detailResult.data.visibility });
      setAuditRows(Array.isArray(auditResult.data) ? auditResult.data : []);
      setProductFormState(emptyProductFormState);
      setEditingProductId(null);
      setReviewingProductId(null);
      setDeletingProductId(null);
      setReviewMessageByProductId(
        Object.fromEntries(
          (detailResult.data.products ?? []).map((product) => [
            product.id,
            product.rejectionMessage ?? ""
          ])
        )
      );
} catch {
      setSelectedProfile(null);
      setAuditRows([]);
      setVisibilityDraft(null);
      setProductFormState(emptyProductFormState);
      setEditingProductId(null);
      setReviewingProductId(null);
      setDeletingProductId(null);
      setReviewMessageByProductId({});
      setErrorMessage("No se pudo conectar con el backend para cargar el detalle.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfileDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleMapLocationChange = (coords: {
    latitude: number;
    longitude: number;
  }): void => {
    setFormState((prev) => ({
      ...prev,
      latitude: coords.latitude.toFixed(6),
      longitude: coords.longitude.toFixed(6)
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleProductFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setProductFormState((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleProductUnknownToggle = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextChecked = event.target.checked;
    setProductFormState((prev) => ({
      ...prev,
      isTariffPositionUnknown: nextChecked,
      tariffPosition: nextChecked ? "" : prev.tariffPosition
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleStartProductEdit = (product: CompanyProductView): void => {
    setEditingProductId(product.id);
    setProductFormState(toProductFormState(product));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleCancelProductEdit = (): void => {
    setEditingProductId(null);
    setProductFormState(emptyProductFormState);
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleReviewMessageChange = (productId: number, value: string): void => {
    setReviewMessageByProductId((prev) => ({
      ...prev,
      [productId]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleReviewProduct = async (
    product: CompanyProductView,
    isAccepted: boolean
  ): Promise<void> => {
    if (!selectedProfile) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const rejectionMessageRaw =
      reviewMessageByProductId[product.id] ?? product.rejectionMessage ?? "";
    const rejectionMessage = rejectionMessageRaw.trim();

    if (!isAccepted && !rejectionMessage) {
      setErrorMessage("Para marcar No aceptado, escribí un mensaje para la empresa.");
      return;
    }

    setReviewingProductId(product.id);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/products/${product.id}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            isAccepted,
            rejectionMessage: isAccepted ? null : rejectionMessage
          })
        }
      );
      const result = (await response.json()) as ApiResponse<CompanyProductView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.error ?? "No se pudo registrar la revisión del producto.");
        return;
      }

      setSelectedProfile((prev) =>
        prev
          ? {
              ...prev,
              products: upsertProduct(prev.products ?? [], result.data)
            }
          : prev
      );
      setReviewMessageByProductId((prev) => ({
        ...prev,
        [product.id]: result.data.rejectionMessage ?? ""
      }));
      setInfoMessage(
        isAccepted
          ? "Producto aceptado correctamente."
          : "Producto marcado como no aceptado."
      );
      await loadProfileDetail(selectedProfile.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para revisar el producto.");
    } finally {
      setReviewingProductId(null);
    }
  };

  const handleSubmitProduct = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!selectedProfile) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const name = productFormState.name.trim();
    if (!name) {
      setErrorMessage("El nombre del producto es obligatorio.");
      return;
    }

    const profileId = selectedProfile.id;
    const isEditing = editingProductId !== null;
    const endpoint = isEditing
      ? `${API_BASE_URL}/api/admin/profiles/${profileId}/products/${editingProductId}`
      : `${API_BASE_URL}/api/admin/profiles/${profileId}/products`;

    const payload = {
      name,
      description: trimNullable(productFormState.description),
      imageUrl: trimNullable(productFormState.imageUrl),
      tariffPosition: productFormState.isTariffPositionUnknown
        ? null
        : trimNullable(productFormState.tariffPosition),
      isTariffPositionUnknown: productFormState.isTariffPositionUnknown
    };

    setIsSavingProduct(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApiResponse<CompanyProductView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.error ?? "No se pudo guardar el producto.");
        return;
      }

      setSelectedProfile((prev) =>
        prev
          ? {
              ...prev,
              products: upsertProduct(prev.products ?? [], result.data)
            }
          : prev
      );
      setEditingProductId(null);
      setProductFormState(emptyProductFormState);
      setInfoMessage(
        isEditing ? "Producto actualizado correctamente." : "Producto creado correctamente."
      );
      await loadProfileDetail(profileId);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar el producto.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number): Promise<void> => {
    if (!selectedProfile) {
      return;
    }

    if (!window.confirm("¿Querés eliminar este producto?")) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const profileId = selectedProfile.id;

    setDeletingProductId(productId);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${profileId}/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authHeader
          }
        }
      );
      const result = (await response.json()) as ApiResponse<null>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo eliminar el producto.");
        return;
      }

      setSelectedProfile((prev) =>
        prev
          ? {
              ...prev,
              products: removeProduct(prev.products ?? [], productId)
            }
          : prev
      );
      if (editingProductId === productId) {
        setEditingProductId(null);
        setProductFormState(emptyProductFormState);
      }
      setInfoMessage("Producto eliminado correctamente.");
      await loadProfileDetail(profileId);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para eliminar el producto.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleSaveData = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!selectedProfile) {
      return;
    }

    if (
      !formState.companyName.trim() ||
      !formState.contactName.trim() ||
      !formState.contactEmail.trim()
    ) {
      setErrorMessage("Completá nombre de empresa, contacto y email.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSavingData(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const payload = {
        companyName: formState.companyName.trim(),
        contactName: formState.contactName.trim(),
        contactEmail: formState.contactEmail.trim(),
        phone: trimNullable(formState.phone),
        taxId: trimNullable(formState.taxId),
        description: trimNullable(formState.description),
        sector: trimNullable(formState.sector),
        subSector: trimNullable(formState.subSector),
        product: trimNullable(formState.product),
        keywords: trimNullable(formState.keywords),
        tariffPosition: trimNullable(formState.tariffPosition),
        exportDestinations: trimNullable(formState.exportDestinations),
        awards: trimNullable(formState.awards),
        certifications: trimNullable(formState.certifications),
        logoUrl: trimNullable(formState.logoUrl),
        website: trimNullable(formState.website),
        facebook: trimNullable(formState.facebook),
        instagram: trimNullable(formState.instagram),
        linkedin: trimNullable(formState.linkedin),
        youtube: trimNullable(formState.youtube),
        otherLink: trimNullable(formState.otherLink),
        address: trimNullable(formState.address),
        city: trimNullable(formState.city),
        googleMapsEmbed: trimNullable(formState.googleMapsEmbed),
        latitude: parseNullableNumber(formState.latitude),
        longitude: parseNullableNumber(formState.longitude)
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/data`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify(payload)
        }
      );

      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo guardar el perfil.");
        return;
      }

      setSelectedProfile(result.data);
      setFormState(toFormState(result.data));
      setInfoMessage("Datos del perfil actualizados.");
      await loadProfiles(query);
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar.");
    } finally {
      setIsSavingData(false);
    }
  };

  const handleSaveSettings = async (): Promise<void> => {
    if (!selectedProfile) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSavingSettings(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            editMode: selectedProfile.editMode,
            isPublished: selectedProfile.isPublished
          })
        }
      );
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo guardar la configuración.");
        return;
      }

      setSelectedProfile(result.data);
      setInfoMessage("Configuración de publicación/edición actualizada.");
      await loadProfiles(query);
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar configuración.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setCreateFormState((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleCreateProfile = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (
      !createFormState.companyName.trim() ||
      !createFormState.contactName.trim() ||
      !createFormState.contactEmail.trim()
    ) {
      setErrorMessage("Para crear una empresa completá nombre, contacto y email.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsCreatingProfile(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const payload = {
        companyName: createFormState.companyName.trim(),
        contactName: createFormState.contactName.trim(),
        contactEmail: createFormState.contactEmail.trim(),
        phone: trimNullable(createFormState.phone),
        taxId: trimNullable(createFormState.taxId),
        description: trimNullable(createFormState.description),
        sector: trimNullable(createFormState.sector),
        subSector: trimNullable(createFormState.subSector),
        product: trimNullable(createFormState.product),
        keywords: trimNullable(createFormState.keywords),
        tariffPosition: trimNullable(createFormState.tariffPosition),
        exportDestinations: trimNullable(createFormState.exportDestinations),
        awards: trimNullable(createFormState.awards),
        certifications: trimNullable(createFormState.certifications),
        logoUrl: trimNullable(createFormState.logoUrl),
        website: trimNullable(createFormState.website),
        facebook: trimNullable(createFormState.facebook),
        instagram: trimNullable(createFormState.instagram),
        linkedin: trimNullable(createFormState.linkedin),
        youtube: trimNullable(createFormState.youtube),
        otherLink: trimNullable(createFormState.otherLink),
        address: trimNullable(createFormState.address),
        city: trimNullable(createFormState.city),
        googleMapsEmbed: trimNullable(createFormState.googleMapsEmbed),
        latitude: parseNullableNumber(createFormState.latitude),
        longitude: parseNullableNumber(createFormState.longitude),
        editMode: createEditMode,
        isPublished: createIsPublished
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.error ?? "No se pudo crear la empresa.");
        return;
      }

      setCreateFormState(emptyFormState);
      setCreateEditMode("mixed");
      setCreateIsPublished(false);
      setShowCreateForm(false);
      setInfoMessage(`Empresa creada: ${result.data.companyName}.`);
      setSelectedId(result.data.id);
      await loadProfiles(query);
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para crear la empresa.");
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleToggleVisibilityDraft = (
    fieldKey: ProfileFieldKey,
    nextVisible: boolean
  ): void => {
    setVisibilityDraft((prev) => {
      const base = prev ?? selectedProfile?.visibility;
      if (!base) {
        return prev;
      }

      return {
        ...base,
        [fieldKey]: nextVisible
      };
    });
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleResetVisibilityDraft = (): void => {
    if (!selectedProfile) {
      return;
    }

    setVisibilityDraft({ ...selectedProfile.visibility });
    setErrorMessage("");
    setInfoMessage("Cambios de visibilidad descartados.");
  };

  const handleSaveVisibility = async (): Promise<void> => {
    if (!selectedProfile || !visibilityDraft) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSavingVisibility(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/visibility`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            visibility: visibilityDraft
          })
        }
      );
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.error ?? "No se pudo guardar la visibilidad.");
        return;
      }

      setSelectedProfile(result.data);
      setVisibilityDraft({ ...result.data.visibility });
      setInfoMessage("Visibilidad por campo guardada correctamente.");
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar visibilidad.");
    } finally {
      setIsSavingVisibility(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="admin-profiles-page">
        <div className="admin-profiles-shell">
          <header className="admin-profiles-header">
            <p>Perfiles de empresas</p>
            <h1>Gestión de ficha, visibilidad y auditoría</h1>
            <small>
              Configurá qué puede editar la empresa y qué campos se publican sin exponer
              datos ocultos.
            </small>
          </header>

          {errorMessage ? <p className="admin-profiles-feedback error">{errorMessage}</p> : null}
          {infoMessage ? <p className="admin-profiles-feedback info">{infoMessage}</p> : null}

          <div className="admin-profiles-grid">
            <aside className="profiles-list-card">
<div className="profiles-list-toolbar">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por empresa/sector/producto"
                />
                <button
                  type="button"
                  onClick={() => void loadProfiles(query)}
                  disabled={isListLoading}
                >
                  {isListLoading ? "Cargando..." : "Buscar"}
                </button>
              </div>

              <button
                type="button"
                className="create-company-toggle"
                onClick={() => {
                  setShowCreateForm((prev) => !prev);
                  setErrorMessage("");
                  setInfoMessage("");
                }}
              >
                {showCreateForm ? "Cerrar alta de empresa" : "+ Nueva empresa"}
              </button>

              {showCreateForm ? (
                <form className="create-company-card" onSubmit={handleCreateProfile}>
                  <h3>Crear empresa</h3>
                  <div className="create-company-grid">
                    <label>
                      Nombre empresa *
                      <input
                        name="companyName"
                        value={createFormState.companyName}
                        onChange={handleCreateFormChange}
                        disabled={isCreatingProfile}
                      />
                    </label>
                    <label>
                      Contacto *
                      <input
                        name="contactName"
                        value={createFormState.contactName}
                        onChange={handleCreateFormChange}
                        disabled={isCreatingProfile}
                      />
                    </label>
                    <label>
                      Email *
                      <input
                        name="contactEmail"
                        value={createFormState.contactEmail}
                        onChange={handleCreateFormChange}
                        disabled={isCreatingProfile}
                      />
                    </label>
                    <label>
                      Teléfono
                      <input
                        name="phone"
                        value={createFormState.phone}
                        onChange={handleCreateFormChange}
                        disabled={isCreatingProfile}
                      />
                    </label>
                    <label>
                      Sector
                      <input
                        name="sector"
                        value={createFormState.sector}
                        onChange={handleCreateFormChange}
                        disabled={isCreatingProfile}
                      />
                    </label>
                    <label>
                      Ciudad
                      <input
                        name="city"
                        value={createFormState.city}
                        onChange={handleCreateFormChange}
                        disabled={isCreatingProfile}
                      />
                    </label>
                    <label>
                      Modo de edición
                      <select
                        value={createEditMode}
                        onChange={(event) =>
                          setCreateEditMode(event.target.value as ProfileEditMode)
                        }
                        disabled={isCreatingProfile}
                      >
                        {editModeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="settings-publish">
                      <input
                        type="checkbox"
                        checked={createIsPublished}
                        onChange={(event) => setCreateIsPublished(event.target.checked)}
                        disabled={isCreatingProfile}
                      />
                      <span>Publicar al crear</span>
                    </label>
                  </div>
                  <button type="submit" disabled={isCreatingProfile}>
                    {isCreatingProfile ? "Creando..." : "Crear empresa"}
                  </button>
                </form>
              ) : null}

              {isListLoading ? <p className="list-feedback">Cargando perfiles...</p> : null}

              {!isListLoading && profiles.length === 0 ? (
                <p className="list-feedback">No hay perfiles disponibles.</p>
              ) : null}

              <ul className="profiles-list">
                {profiles.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={selectedId === row.id ? "profile-row active" : "profile-row"}
                    >
                      <strong>{row.companyName}</strong>
                      <small>{row.contactEmail}</small>
                      <small>{toStatusLabel(row)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="profile-detail-card">
              {isDetailLoading ? (
                <p className="detail-feedback">Cargando detalle del perfil...</p>
              ) : null}

              {!isDetailLoading && !selectedProfile ? (
                <p className="detail-feedback">
                  Seleccioná un perfil para editar datos, publicación y visibilidad.
                </p>
              ) : null}

              {!isDetailLoading && selectedProfile ? (
                <div className="profile-detail-content">
                  <header className="profile-detail-header">
                    <h2>{selectedProfile.companyName}</h2>
                    <small>
                      {toStatusLabel(selectedProfile)} · {visibleFieldsCount} campos visibles
                    </small>
                  </header>

                  <section className="settings-card">
                    <h3>Configuración general</h3>
                    <div className="settings-grid">
                      <label>
                        Modo de edición
                        <select
                          value={selectedProfile.editMode}
                          onChange={(event) =>
                            setSelectedProfile((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    editMode: event.target.value as ProfileEditMode
                                  }
                                : prev
                            )
                          }
                        >
                          {editModeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="settings-publish">
                        <input
                          type="checkbox"
                          checked={selectedProfile.isPublished}
                          onChange={(event) =>
                            setSelectedProfile((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    isPublished: event.target.checked
                                  }
                                : prev
                            )
                          }
                        />
                        <span>Perfil publicado</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSaveSettings()}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? "Guardando..." : "Guardar configuración"}
                    </button>
                  </section>

                  <form className="admin-profile-form" onSubmit={handleSaveData}>
                    <section className="settings-card">
                      <h3>Datos del perfil</h3>
                      <div className="form-grid">
                        <label>
                          Nombre empresa *
                          <input
                            name="companyName"
                            value={formState.companyName}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Contacto *
                          <input
                            name="contactName"
                            value={formState.contactName}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Email *
                          <input
                            name="contactEmail"
                            value={formState.contactEmail}
                            onChange={handleFormChange}
                          />
                        </label>
<div className="full">
                          <ImageField
                            label="Logo empresa"
                            kind="logo"
                            value={formState.logoUrl}
                            onChange={(nextValue) =>
                              setFormState((prev) => ({
                                ...prev,
                                logoUrl: nextValue
                              }))
                            }
                          />
                        </div>
                        <label>
                          Teléfono
                          <input
                            name="phone"
                            value={formState.phone}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Sector
                          <input
                            name="sector"
                            value={formState.sector}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Subsector
                          <input
                            name="subSector"
                            value={formState.subSector}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Producto
                          <input
                            name="product"
                            value={formState.product}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Keywords
                          <input
                            name="keywords"
                            value={formState.keywords}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Ciudad
                          <input
                            name="city"
                            value={formState.city}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Dirección
                          <input
                            name="address"
                            value={formState.address}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Latitud
                          <input
                            name="latitude"
                            value={formState.latitude}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Longitud
                          <input
                            name="longitude"
                            value={formState.longitude}
                            onChange={handleFormChange}
                          />
                        </label>
                        <div className="admin-map-block full">
                          <div className="admin-map-head">
                            <p>Ubicación en OpenStreetMap</p>
                            <small>
                              Hacé clic en el mapa para actualizar latitud y longitud
                              del perfil.
                            </small>
                          </div>
                          <OsmLocationPicker
                            latitude={parseNullableNumber(formState.latitude)}
                            longitude={parseNullableNumber(formState.longitude)}
                            onChange={handleMapLocationChange}
                          />
                        </div>
                        <label className="full">
                          Descripción
                          <textarea
                            rows={3}
                            name="description"
                            value={formState.description}
                            onChange={handleFormChange}
                          />
                        </label>
                      </div>
                      <button type="submit" disabled={isSavingData}>
                        {isSavingData ? "Guardando..." : "Guardar datos"}
                      </button>
                    </section>
                  </form>

                  <form className="settings-card products-management-card" onSubmit={handleSubmitProduct}>
                    <div className="products-head">
                      <h3>Productos exportables</h3>
                      <small>
                        Cargá o editá productos por empresa con imagen, descripción y P.A.
                        conocida/desconocida.
                      </small>
                    </div>
                    <div className="products-form-grid">
                      <label>
                        Nombre del producto *
                        <input
                          name="name"
                          value={productFormState.name}
                          onChange={handleProductFieldChange}
                          disabled={isSavingProduct}
                        />
                      </label>
<div className="full">
                        <ImageField
                          label="Imagen del producto"
                          kind="product-image"
                          value={productFormState.imageUrl}
                          disabled={isSavingProduct}
                          onChange={(nextValue) =>
                            setProductFormState((prev) => ({
                              ...prev,
                              imageUrl: nextValue
                            }))
                          }
                        />
                      </div>
                      <label className="full">
                        Descripción del producto
                        <textarea
                          rows={3}
                          name="description"
                          value={productFormState.description}
                          onChange={handleProductFieldChange}
                          disabled={isSavingProduct}
                        />
                      </label>
                      <label>
                        Posición arancelaria (P.A.)
                        <input
                          name="tariffPosition"
                          value={productFormState.tariffPosition}
                          onChange={handleProductFieldChange}
                          disabled={isSavingProduct || productFormState.isTariffPositionUnknown}
                          placeholder="Ej: 0201.30"
                        />
                      </label>
                      <label className="full product-unknown-toggle">
                        <input
                          type="checkbox"
                          checked={productFormState.isTariffPositionUnknown}
                          onChange={handleProductUnknownToggle}
                          disabled={isSavingProduct}
                        />
                        <span>No conozco la Posición Arancelaria (P.A.)</span>
                      </label>
                    </div>
                    <div className="products-form-actions">
                      {editingProductId !== null ? (
                        <button
                          type="button"
                          className="secondary"
                          onClick={handleCancelProductEdit}
                          disabled={isSavingProduct}
                        >
                          Cancelar edición
                        </button>
                      ) : null}
                      <button type="submit" disabled={isSavingProduct}>
                        {isSavingProduct
                          ? "Guardando..."
                          : editingProductId !== null
                            ? "Actualizar producto"
                            : "Agregar producto"}
                      </button>
                    </div>
                    <label className="products-pending-filter">
                      <input
                        type="checkbox"
                        checked={showOnlyPendingProducts}
                        onChange={(event) => setShowOnlyPendingProducts(event.target.checked)}
                      />
                      <span>Mostrar solo pendientes de revisión</span>
                    </label>
                    {selectedProfile.products.length === 0 ? (
                      <p className="products-empty">Esta empresa todavía no tiene productos cargados.</p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="products-empty">
                        No hay productos pendientes de revisión para esta empresa.
                      </p>
                    ) : (
                      <ul className="products-list">
                        {filteredProducts.map((product) => (
                          <li
                            key={product.id}
                            className={
                              editingProductId === product.id
                                ? "product-item editing"
                                : "product-item"
                            }
                          >
                            <div className="product-main">
                              <div className="product-main-head">
                                <strong>{product.name}</strong>
                                <span
                                  className={`product-review-badge ${toProductReviewTone(product)}`}
                                >
                                  {toProductReviewLabel(product)}
                                </span>
                              </div>
                              <small>
                                {toProductTariffLabel(product)} · actualizado{" "}
                                {formatAuditDateTime(product.updatedAt)}
                              </small>
                              {product.isAccepted === false && product.rejectionMessage ? (
                                <p className="product-rejection-note">
                                  No aceptado: {product.rejectionMessage}
                                </p>
                              ) : null}
                              {product.description ? <p>{product.description}</p> : null}
                              {product.imageUrl ? (
                                <div className="product-image-preview-wrap">
                                  <img
                                    className="product-image-preview"
                                    src={toDisplaySrc(product.imageUrl)}
                                    alt={`Imagen de ${product.name}`}
                                  />
                                  <a href={toDisplaySrc(product.imageUrl)} target="_blank" rel="noreferrer">
                                    Ver imagen
                                  </a>
                                </div>
                              ) : null}
                            </div>
                            <div className="product-controls">
                              <div className="product-review-panel">
                                <label htmlFor={`review-message-${product.id}`}>
                                  Mensaje para "No aceptado"
                                </label>
                                <textarea
                                  id={`review-message-${product.id}`}
                                  rows={2}
                                  value={reviewMessageByProductId[product.id] ?? ""}
                                  onChange={(event) =>
                                    handleReviewMessageChange(product.id, event.target.value)
                                  }
                                  disabled={
                                    isSavingProduct || deletingProductId === product.id || reviewingProductId === product.id
                                  }
                                />
                                <div className="product-review-actions">
                                  <button
                                    type="button"
                                    className="success"
                                    onClick={() => void handleReviewProduct(product, true)}
                                    disabled={
                                      isSavingProduct || deletingProductId === product.id || reviewingProductId === product.id
                                    }
                                  >
                                    {reviewingProductId === product.id ? "Procesando..." : "Aceptar"}
                                  </button>
                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={() => void handleReviewProduct(product, false)}
                                    disabled={
                                      isSavingProduct || deletingProductId === product.id || reviewingProductId === product.id
                                    }
                                  >
                                    {reviewingProductId === product.id
                                      ? "Procesando..."
                                      : "No aceptar"}
                                  </button>
                                </div>
                              </div>
                              <div className="product-actions">
                                <button
                                  type="button"
                                  className="secondary"
                                  onClick={() => handleStartProductEdit(product)}
                                  disabled={
                                    isSavingProduct || deletingProductId === product.id || reviewingProductId === product.id
                                  }
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => void handleDeleteProduct(product.id)}
                                  disabled={
                                    isSavingProduct || deletingProductId === product.id || reviewingProductId === product.id
                                  }
                                >
                                  {deletingProductId === product.id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </form>

<section className="settings-card">
                    <div className="section-head">
                      <h3>Visibilidad por campo</h3>
                      <small>
                        Marcá qué datos se muestran en la ficha pública y guardá esta sección.
                      </small>
                    </div>
                    <div className="visibility-grid">
                      {visibilityFieldOrder.map((fieldKey) => (
                        <label key={fieldKey}>
                          <input
                            type="checkbox"
                            checked={Boolean(activeVisibility?.[fieldKey])}
                            onChange={(event) =>
                              handleToggleVisibilityDraft(fieldKey, event.target.checked)
                            }
                            disabled={isSavingVisibility}
                          />
                          <span>{fieldLabels[fieldKey]}</span>
                        </label>
                      ))}
                    </div>
                    <div className="section-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={handleResetVisibilityDraft}
                        disabled={isSavingVisibility || !hasVisibilityChanges}
                      >
                        Descartar cambios
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSaveVisibility()}
                        disabled={isSavingVisibility || !hasVisibilityChanges}
                      >
                        {isSavingVisibility ? "Guardando..." : "Guardar visibilidad"}
                      </button>
                    </div>
                  </section>

                  <section className="settings-card audit-card">
                    <div className="audit-header">
                      <h3>Auditoría</h3>
                      <span>{auditRows.length} eventos</span>
                    </div>
                    {auditRows.length === 0 ? (
                      <p className="audit-empty">Sin eventos registrados para este perfil.</p>
                    ) : (
                      <ul className="audit-list">
                        {auditRows.map((row) => (
                          <li key={row.id} className="audit-item">
                            <div className="audit-item-top">
                              <span className={`audit-action-badge ${toAuditActionTone(row.action)}`}>
                                {row.action}
                              </span>
                              <time dateTime={row.createdAt}>{formatAuditDateTime(row.createdAt)}</time>
                            </div>
                            {row.oldValue || row.newValue ? (
                              <p className="audit-item-description">
                                {row.oldValue ? (
                                  <>
                                    Antes: <strong>{row.oldValue}</strong>
                                  </>
                                ) : null}
                                {row.oldValue && row.newValue ? (
                                  <span aria-hidden="true"> → </span>
                                ) : null}
                                {row.newValue ? (
                                  <>
                                    Ahora: <strong>{row.newValue}</strong>
                                  </>
                                ) : null}
                              </p>
                            ) : (
                              <p className="audit-item-description audit-item-description-muted">
                                Sin detalle de valores para este evento.
                              </p>
                            )}
                            <div className="audit-item-meta">
                              <span className="audit-field-chip">
                                {toAuditFieldLabel(row.fieldKey)}
                              </span>
                              <span className="audit-actor-chip">{row.actorEmail ?? "Sistema"}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}

