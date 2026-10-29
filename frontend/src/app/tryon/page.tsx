"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  ImageOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  Shirt,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import BagIcon from "@/components/BagIcon";
import WishlistIcon from "@/components/WishlistIcon";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type UploadResponse = {
  success: boolean;
  message: string;
  image_id: string;
  width: number;
  height: number;
};

type PrepareResponse = {
  success: boolean;
  message: string;
  status: string;
  tryon_request: {
    image_id: string;
    product_id: number;
    product_name: string;
    product_image_url: string;
    category: string;
  };
};

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  collection: string | null;
  image_url: string | null;
  stock: number;
};

export default function TryOnPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // PHOTO UPLOAD STATE
  // ==========================================

  const [selectedFile, setSelectedFile] = useState<File | null>(
    null
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [uploadResult, setUploadResult] =
    useState<UploadResponse | null>(null);

  // ==========================================
  // PRODUCT CATALOG STATE
  // ==========================================

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  const [selectedProductId, setSelectedProductId] =
    useState<number | null>(null);

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    null;

  // ==========================================
  // PREPARE TRY-ON REQUEST STATE
  // ==========================================

  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState("");
  const [preparedResult, setPreparedResult] =
    useState<PrepareResponse | null>(null);

  // AI-generated image is returned as a PNG blob.
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // ==========================================
  // CLEAN UP IMAGE PREVIEW
  // ==========================================

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Revoke object URLs when replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [generatedUrl]);

  // ==========================================
  // FETCH PRODUCTS FROM FASTAPI
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      setLoadingProducts(true);
      setProductError("");

      try {
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load clothing collection.");
        }

        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid product catalog response.");
        }

        const catalog = data as Product[];

        setProducts(catalog);
      } catch (err) {
        if (controller.signal.aborted) return;

        setProductError(
          err instanceof Error
            ? err.message
            : "Failed to load clothing collection."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  // ==========================================
  // SELECT AND VALIDATE PHOTO
  // ==========================================

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setPrepareError("");
    setPreparedResult(null);
    setGeneratedUrl(null);
    setGenerateError("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadResult(null);

    event.target.value = "";
  }

  // ==========================================
  // REMOVE PHOTO
  // ==========================================

  function removeImage() {
    setPrepareError("");
    setPreparedResult(null);
    setGeneratedUrl(null);
    setGenerateError("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // ==========================================
  // UPLOAD PHOTO TO FASTAPI
  // ==========================================

  async function handleUpload() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError("");
    setUploadResult(null);
    setPreparedResult(null);
    setPrepareError("");
    setGeneratedUrl(null);
    setGenerateError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_URL}/tryon/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to upload your image."
        );
      }

      setUploadResult(data as UploadResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  // ==========================================
  // SELECT OUTFIT
  // ==========================================

  function handleSelectProduct(productId: number) {
    if (preparing || generating) return;
    setSelectedProductId(productId);
    setPreparedResult(null);
    setPrepareError("");
    setGeneratedUrl(null);
    setGenerateError("");
  }

  // ==========================================
  // PREPARE PHOTO + OUTFIT FOR AI INFERENCE
  // ==========================================

  async function handlePrepareLook() {
    if (!uploadResult || !selectedProduct || preparing || uploading) {
      return;
    }

    setPreparing(true);
    setPrepareError("");
    setPreparedResult(null);

    try {
      const response = await fetch(`${API_URL}/tryon/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: uploadResult.image_id,
          product_id: selectedProduct.id,
        }),
      });

      const data: PrepareResponse & { detail?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to prepare your virtual try-on."
        );
      }

      if (!data.success || !data.tryon_request) {
        throw new Error("Unexpected response from try-on service.");
      }

      setPreparedResult(data);
    } catch (err) {
      setPrepareError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPreparing(false);
    }
  }

  // ==========================================
  // GENERATE AI TRY-ON IMAGE
  // ==========================================

  async function handleGenerateLook() {
    if (!uploadResult || !selectedProduct || generating || preparing) return;

    setGenerating(true);
    setGenerateError("");
    setGeneratedUrl(null);

    try {
      const response = await fetch(`${API_URL}/tryon/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: uploadResult.image_id,
          product_id: selectedProduct.id,
        }),
      });

      if (!response.ok) {
        let message = "Unable to generate your virtual try-on.";
        try {
          const body = await response.json();
          if (typeof body.detail === "string") message = body.detail;
        } catch {
          // The server may return a non-JSON error.
        }
        if (response.status === 503) {
          message = "AI try-on is temporarily unavailable. The GPU service is not connected yet.";
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("The AI service returned an unexpected response.");
      }
      setGeneratedUrl(URL.createObjectURL(blob));
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Unable to reach the AI service."
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      {/* ======================================
          NAVIGATION
      ====================================== */}

      <header className="border-b border-white/15 px-6 py-6 md:px-12">
        <nav className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-[0.25em]"
          >
            TRYONIX<span className="text-[#b9a6dc]">.</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/shop"
              className="text-xs tracking-[0.2em] text-white/70 transition hover:text-white"
            >
              SHOP
            </Link>

            <WishlistIcon />
            <BagIcon />
          </div>
        </nav>
      </header>

      {/* ======================================
          HERO
      ====================================== */}

      <section className="mx-auto max-w-[1600px] px-6 pb-16 pt-16 md:px-12 md:pt-24">
        <Link
          href="/shop"
          className="mb-12 inline-flex items-center gap-2 text-xs tracking-[0.2em] text-white/50 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          BACK TO SHOP
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-6 flex items-center gap-2 text-xs tracking-[0.3em] text-[#b9a6dc]">
            <Sparkles size={15} />
            THE FUTURE OF FASHION
          </p>

          <h1 className="max-w-5xl text-[clamp(3.5rem,9vw,9rem)] font-black leading-[0.9] tracking-[-0.07em]">
            VIRTUAL
            <br />
            TRY-ON<span className="text-[#b9a6dc]">.</span>
          </h1>

          <p className="mt-8 max-w-xl text-sm leading-8 text-white/50 md:text-base">
            Your style. Your photo. A whole new way to experience
            fashion. Upload your image, select your favorite
            outfit and prepare to discover a new look.
          </p>
        </motion.div>
      </section>

      {/* ======================================
          VIRTUAL TRY-ON STUDIO
      ====================================== */}

      <section className="mx-auto max-w-[1600px] px-6 pb-32 md:px-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* ==================================
              STEP 01: PHOTO UPLOAD
          ================================== */}

          <div className="border border-white/15 bg-[#151515] p-6 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-[#b9a6dc]">
                  STEP 01 / YOUR PHOTO
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Upload your image.
                </h2>
              </div>

              <ImagePlus
                size={25}
                className="text-[#b9a6dc]"
                strokeWidth={1.5}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading || preparing || generating}
              className="hidden"
              aria-label="Select your photo"
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || preparing || generating}
                className="flex min-h-[400px] w-full flex-col items-center justify-center border border-dashed border-[#b9a6dc]/40 bg-[#101010] p-8 text-center transition hover:border-[#b9a6dc] hover:bg-[#19161f]"
              >
                <UploadCloud
                  size={46}
                  strokeWidth={1.2}
                  className="mb-7 text-[#b9a6dc]"
                />

                <h3 className="text-xl font-semibold tracking-tight">
                  YOUR LOOK STARTS HERE.
                </h3>

                <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">
                  Click to select a clear, full-body photo.
                  Make sure your body and outfit are visible.
                </p>

                <span className="mt-8 bg-[#b9a6dc] px-7 py-4 text-xs font-semibold tracking-[0.2em] text-black">
                  CHOOSE PHOTO
                </span>

                <p className="mt-6 text-xs text-white/35">
                  JPG, PNG, WEBP · MAX 5 MB
                </p>
              </button>
            ) : (
              <div>
                <div className="relative flex min-h-[400px] items-center justify-center overflow-hidden border border-white/15 bg-[#101010]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected virtual try-on photo"
                    className="max-h-[550px] w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={uploading || preparing || generating}
                    aria-label="Remove selected image"
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-[#b9a6dc] hover:text-black disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <p className="mt-4 truncate text-xs text-white/50">
                  {selectedFile?.name}
                </p>

                {!uploadResult && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-6 flex w-full items-center justify-center gap-3 bg-[#b9a6dc] px-7 py-5 text-xs font-semibold tracking-[0.2em] text-black transition hover:bg-white disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        UPLOADING...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={18} />
                        UPLOAD YOUR PHOTO
                      </>
                    )}
                  </button>
                )}

                {uploadResult && (
                  <div
                    role="status"
                    className="mt-6 flex items-start gap-3 border border-[#b9a6dc]/40 bg-[#b9a6dc]/10 p-5"
                  >
                    <CheckCircle2
                      size={20}
                      className="shrink-0 text-[#b9a6dc]"
                    />

                    <div>
                      <p className="text-sm font-semibold">
                        PHOTO UPLOADED SUCCESSFULLY
                      </p>

                      <p className="mt-2 text-xs text-white/50">
                        Resolution: {uploadResult.width} ×{" "}
                        {uploadResult.height}
                      </p>

                      <p className="mt-2 text-xs text-white/50">
                        Your photo is ready for the next step.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-5 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300"
              >
                {error}
              </div>
            )}
          </div>

          {/* ==================================
              STEP 02: CLOTHING SELECTION
          ================================== */}

          <div className="flex flex-col border border-white/15 bg-[#151515] p-6 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.3em] text-[#b9a6dc]">
                  STEP 02 / YOUR STYLE
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Choose your outfit.
                </h2>
              </div>

              <Shirt
                size={26}
                strokeWidth={1.5}
                className="text-[#b9a6dc]"
              />
            </div>

            {/* LOADING PRODUCTS */}

            {loadingProducts && (
              <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
                <Loader2
                  size={30}
                  className="animate-spin text-[#b9a6dc]"
                />

                <p className="text-xs tracking-[0.2em] text-white/50">
                  LOADING COLLECTION...
                </p>
              </div>
            )}

            {/* PRODUCT ERROR */}

            {!loadingProducts && productError && (
              <div
                role="alert"
                className="flex min-h-[300px] flex-col items-center justify-center text-center"
              >
                <p className="text-sm text-red-300">
                  {productError}
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-6 inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-xs tracking-widest transition hover:border-[#b9a6dc]"
                >
                  <RefreshCw size={15} />
                  RETRY
                </button>
              </div>
            )}

            {/* EMPTY COLLECTION */}

            {!loadingProducts &&
              !productError &&
              products.length === 0 && (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <Shirt
                    size={40}
                    className="mb-6 text-[#b9a6dc]"
                  />

                  <p className="text-lg font-semibold">
                    NO OUTFITS AVAILABLE
                  </p>

                  <p className="mt-3 text-sm text-white/50">
                    Please check back later.
                  </p>
                </div>
              )}

            {/* PRODUCT GRID */}

            {!loadingProducts &&
              !productError &&
              products.length > 0 && (
                <>
                  <p className="mb-6 text-xs leading-6 text-white/50">
                    Select a piece from the TRYONIX collection
                    to prepare your virtual look.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {products.map((product) => {
                      const isSelected =
                        selectedProductId === product.id;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            handleSelectProduct(product.id)
                          }
                          aria-pressed={isSelected}
                          disabled={preparing || generating}
                          className={`group relative overflow-hidden border text-left transition-all duration-300 ${
                            isSelected
                              ? "border-[#b9a6dc] bg-[#211b29]"
                              : "border-white/15 bg-[#101010] hover:border-white/40"
                          }`}
                        >
                          <div className="relative aspect-[3/4] overflow-hidden bg-[#242424]">
                            {product.image_url ? (
                              <div
                                role="img"
                                aria-label={product.name}
                                className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{
                                  backgroundImage: `url("${product.image_url}")`,
                                }}
                              />
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-3 text-white/30">
                                <ImageOff size={28} />
                                <span className="text-[10px]">
                                  NO IMAGE
                                </span>
                              </div>
                            )}

                            {isSelected && (
                              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#b9a6dc] text-black">
                                <Check size={17} />
                              </div>
                            )}
                          </div>

                          <div className="p-3 sm:p-4">
                            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-[#b9a6dc]">
                              {product.category}
                            </p>

                            <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5">
                              {product.name}
                            </h3>

                            <p className="mt-3 text-sm text-white/70">
                              ₹
                              {Number(
                                product.price
                              ).toLocaleString("en-IN")}
                            </p>

                            <p
                              className={`mt-4 text-[10px] font-semibold tracking-[0.12em] ${
                                isSelected
                                  ? "text-[#b9a6dc]"
                                  : "text-white/40"
                              }`}
                            >
                              {isSelected
                                ? "✓ SELECTED"
                                : "SELECT OUTFIT"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
          </div>
        </div>

        {/* ======================================
            SELECTED OUTFIT SUMMARY
        ====================================== */}

        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 border border-[#b9a6dc]/30 bg-[#17131d] p-6 md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="mb-3 text-[10px] tracking-[0.3em] text-[#b9a6dc]">
                  YOUR SELECTED LOOK
                </p>

                <h3 className="text-xl font-semibold">
                  {selectedProduct.name}
                </h3>

                <p className="mt-2 text-sm text-white/50">
                  {selectedProduct.category} · ₹
                  {Number(
                    selectedProduct.price
                  ).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs tracking-[0.15em] text-[#b9a6dc]">
                <CheckCircle2 size={18} />
                OUTFIT SELECTED
              </div>
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              {uploadResult ? (
                <p className="flex items-center gap-3 text-sm text-white/70">
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-[#b9a6dc]"
                  />
                  Photo and outfit are ready for AI processing.
                </p>
              ) : (
                <p className="text-sm text-white/50">
                  Upload your photo in Step 01 to complete
                  the try-on inputs.
                </p>
              )}

              <button
                type="button"
                onClick={handlePrepareLook}
                disabled={!uploadResult || preparing || uploading || generating}
                className="mt-6 flex w-full items-center justify-center gap-3 bg-[#b9a6dc] px-6 py-5 text-xs font-semibold tracking-[0.15em] text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {preparing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    PREPARING YOUR LOOK...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    PREPARE MY LOOK
                  </>
                )}
              </button>

              {prepareError && (
                <p role="alert" className="mt-5 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                  {prepareError}
                </p>
              )}

              {preparedResult && (
                <div role="status" className="mt-6 border border-[#b9a6dc]/40 bg-[#b9a6dc]/10 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#b9a6dc]">
                    <CheckCircle2 size={19} />
                    YOUR LOOK IS PREPARED
                  </p>
                  <p className="mt-3 text-sm text-white/70">
                    {preparedResult.tryon_request.product_name}
                  </p>
                  <p className="mt-2 break-all text-xs text-white/50">
                    Photo ID: {preparedResult.tryon_request.image_id}
                  </p>
                  <p className="mt-2 text-xs text-white/50">
                    Status: {preparedResult.status}
                  </p>
                  <p className="mt-4 text-xs leading-6 text-white/50">
                    Photo and outfit have been validated by the backend.
                    You can now request AI image generation below.
                  </p>
                </div>
              )}

              {preparedResult && (
                <button
                  type="button"
                  onClick={handleGenerateLook}
                  disabled={generating || uploading || preparing}
                  className="mt-6 flex w-full items-center justify-center gap-3 border border-[#b9a6dc] bg-[#b9a6dc] px-6 py-5 text-xs font-semibold tracking-[0.15em] text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      GENERATING YOUR LOOK...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      GENERATE MY LOOK
                    </>
                  )}
                </button>
              )}

              {generateError && (
                <p role="alert" className="mt-5 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                  {generateError}
                </p>
              )}

              {generatedUrl && (
                <div className="mt-8 border border-[#b9a6dc]/40 bg-[#101010] p-5">
                  <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#b9a6dc]">
                    <CheckCircle2 size={19} /> YOUR AI TRY-ON RESULT
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedUrl}
                    alt="AI-generated virtual try-on result"
                    className="mx-auto max-h-[750px] w-full object-contain"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* PRIVACY NOTICE */}

        <p className="mt-6 text-xs leading-6 text-white/35">
          Privacy notice: Photos are uploaded to the TRYONIX
          development server. Use test images only until
          authentication, automatic deletion and privacy
          protections are implemented.
        </p>
      </section>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="border-t border-white/15 px-6 py-10 text-center text-xs tracking-[0.2em] text-white/40">
        TRYONIX — DON&apos;T JUST WEAR IT. EXPERIENCE IT.
      </footer>
    </main>
  );
}