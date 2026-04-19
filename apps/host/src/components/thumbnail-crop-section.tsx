"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createClient } from "@nomal-world/db/client";

type CropTab = "card" | "detail";

const ASPECT_RATIOS: Record<CropTab, number> = {
  card: 4 / 3,
  detail: 16 / 9,
};

interface ThumbnailCropSectionProps {
  initialCardUrl: string;
  initialDetailUrl: string;
  onCardChange: (url: string) => void;
  onDetailChange: (url: string) => void;
}

export function ThumbnailCropSection({
  initialCardUrl,
  initialDetailUrl,
  onCardChange,
  onDetailChange,
}: ThumbnailCropSectionProps) {
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CropTab>("card");
  const [cardCrop, setCardCrop] = useState<Crop>();
  const [detailCrop, setDetailCrop] = useState<Crop>();
  const [completedCardCrop, setCompletedCardCrop] = useState<PixelCrop>();
  const [completedDetailCrop, setCompletedDetailCrop] = useState<PixelCrop>();
  const [cardPreview, setCardPreview] = useState(initialCardUrl);
  const [detailPreview, setDetailPreview] = useState(initialDetailUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (originalSrc) URL.revokeObjectURL(originalSrc);
    const url = URL.createObjectURL(file);
    setOriginalSrc(url);
    setCardCrop(undefined);
    setDetailCrop(undefined);
    setCompletedCardCrop(undefined);
    setCompletedDetailCrop(undefined);
    setActiveTab("card");
  };

  const initCrop = (tab: CropTab, width: number, height: number) => {
    const crop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, ASPECT_RATIOS[tab], width, height),
      width,
      height
    );
    if (tab === "card") setCardCrop(crop);
    else setDetailCrop(crop);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    initCrop(activeTab, width, height);
  };

  const handleTabChange = (tab: CropTab) => {
    setActiveTab(tab);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      initCrop(tab, width, height);
    }
  };

  const applyCrop = useCallback(async () => {
    const completedCrop = activeTab === "card" ? completedCardCrop : completedDetailCrop;
    if (!imgRef.current || !completedCrop) return;

    setUploading(true);
    setError("");

    try {
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(completedCrop.width * scaleX);
      canvas.height = Math.round(completedCrop.height * scaleY);

      const ctx = canvas.getContext("2d", { colorSpace: "srgb" });
      if (!ctx) throw new Error("Canvas not supported");

      ctx.drawImage(
        img,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas to blob failed"))),
          "image/jpeg",
          0.92
        );
      });

      const supabase = createClient();
      const prefix = activeTab === "card" ? "card" : "detail";
      const fileName = `thumbnails/${prefix}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("gathering-images")
        .upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("gathering-images")
        .getPublicUrl(fileName);

      if (activeTab === "card") {
        setCardPreview(urlData.publicUrl);
        onCardChange(urlData.publicUrl);
      } else {
        setDetailPreview(urlData.publicUrl);
        onDetailChange(urlData.publicUrl);
      }
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }, [activeTab, completedCardCrop, completedDetailCrop, onCardChange, onDetailChange]);

  const currentCrop = activeTab === "card" ? cardCrop : detailCrop;
  const setCurrentCrop = (c: Crop) => {
    if (activeTab === "card") setCardCrop(c);
    else setDetailCrop(c);
  };
  const setCurrentCompletedCrop = (c: PixelCrop) => {
    if (activeTab === "card") setCompletedCardCrop(c);
    else setCompletedDetailCrop(c);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
      />

      {originalSrc && (
        <div className="space-y-3">
          {/* 탭 */}
          <div className="flex rounded-lg border overflow-hidden">
            {(["card", "detail"] as CropTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {tab === "card" ? "카드용 (4:3)" : "상세용 (16:9)"}
              </button>
            ))}
          </div>

          {/* 크롭 영역 */}
          <div className="overflow-hidden rounded-lg border bg-gray-50 flex justify-center">
            <ReactCrop
              crop={currentCrop}
              onChange={(c) => setCurrentCrop(c)}
              onComplete={(c) => setCurrentCompletedCrop(c)}
              aspect={ASPECT_RATIOS[activeTab]}
              keepSelection
            >
              <img
                ref={imgRef}
                src={originalSrc}
                alt="크롭할 이미지"
                onLoad={onImageLoad}
                className="max-h-[380px] max-w-full"
              />
            </ReactCrop>
          </div>

          <p className="text-xs text-muted-foreground">
            원하는 영역을 드래그로 선택한 뒤 아래 버튼을 눌러 적용하세요.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={applyCrop}
            disabled={uploading || !completedCardCrop && activeTab === "card" || !completedDetailCrop && activeTab === "detail"}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {uploading
              ? "업로드 중..."
              : activeTab === "card"
              ? "카드용으로 적용"
              : "상세용으로 적용"}
          </button>
        </div>
      )}

      {/* 미리보기 */}
      {(cardPreview || detailPreview) && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          {cardPreview && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">카드 미리보기 (4:3)</p>
              <img
                src={cardPreview}
                alt="카드 미리보기"
                className="w-full aspect-[4/3] object-cover rounded-lg border"
              />
            </div>
          )}
          {detailPreview && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">상세 미리보기 (16:9)</p>
              <img
                src={detailPreview}
                alt="상세 미리보기"
                className="w-full aspect-[16/9] object-cover rounded-lg border"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
