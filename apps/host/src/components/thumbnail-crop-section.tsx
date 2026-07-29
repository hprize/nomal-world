"use client";

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
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

export interface ThumbnailCropSectionHandle {
  // 보관 중인 크롭 Blob을 업로드하고 실제 URL과 업로드된 파일 경로를 반환.
  // pending(blob) 정리는 여기서 하지 않음 → 저장 전체 성공 시 commit()에서 정리.
  flushPendingUploads: () => Promise<{ cardUrl: string | null; detailUrl: string | null; uploadedPaths: string[] }>;
  // 저장 전체 성공 확정 시 호출 — blob URL 해제 및 pending 정리
  commit: () => void;
}

interface ThumbnailCropSectionProps {
  initialCardUrl: string;
  initialDetailUrl: string;
  onCardChange: (url: string) => void;
  onDetailChange: (url: string) => void;
}

export const ThumbnailCropSection = forwardRef<ThumbnailCropSectionHandle, ThumbnailCropSectionProps>(
  ({ initialCardUrl, initialDetailUrl, onCardChange, onDetailChange }, ref) => {
    const [originalSrc, setOriginalSrc] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<CropTab>("card");
    const [cardCrop, setCardCrop] = useState<Crop>();
    const [detailCrop, setDetailCrop] = useState<Crop>();
    const [completedCardCrop, setCompletedCardCrop] = useState<PixelCrop>();
    const [completedDetailCrop, setCompletedDetailCrop] = useState<PixelCrop>();
    const [cardPreview, setCardPreview] = useState(initialCardUrl);
    const [detailPreview, setDetailPreview] = useState(initialDetailUrl);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState("");
    const imgRef = useRef<HTMLImageElement>(null);
    const pendingBlobsRef = useRef<{
      card?: { blob: Blob; blobUrl: string };
      detail?: { blob: Blob; blobUrl: string };
    }>({});

    // 언마운트 시 보관 중인 blob URL 전체 해제
    useEffect(() => {
      return () => {
        for (const tab of ["card", "detail"] as const) {
          const pending = pendingBlobsRef.current[tab];
          if (pending) URL.revokeObjectURL(pending.blobUrl);
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      flushPendingUploads: async () => {
        const supabase = createClient();
        const uploadedPaths: string[] = [];
        const result: { cardUrl: string | null; detailUrl: string | null } = {
          cardUrl: null,
          detailUrl: null,
        };

        try {
          for (const tab of ["card", "detail"] as const) {
            const pending = pendingBlobsRef.current[tab];
            if (!pending) continue;

            const fileName = `thumbnails/${tab}_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("gathering-images")
              .upload(fileName, pending.blob, { contentType: "image/jpeg" });
            if (uploadError) throw uploadError;

            uploadedPaths.push(fileName);
            const { data: urlData } = supabase.storage
              .from("gathering-images")
              .getPublicUrl(fileName);

            // blob URL 해제·pending 제거는 commit()에서 — 저장 실패 시 재시도를 위해 여기서 정리하지 않음
            result[`${tab}Url`] = urlData.publicUrl;
          }

          return { ...result, uploadedPaths };
        } catch (err) {
          // 이번 flush에서 올린 파일만 롤백 (pending 보존 → 재시도 가능)
          if (uploadedPaths.length > 0) {
            await supabase.storage.from("gathering-images").remove(uploadedPaths);
          }
          throw err;
        }
      },
      commit: () => {
        // 저장 전체 성공 확정 → 보관 중이던 blob URL 해제 및 pending 정리
        for (const tab of ["card", "detail"] as const) {
          const pending = pendingBlobsRef.current[tab];
          if (pending) URL.revokeObjectURL(pending.blobUrl);
          delete pendingBlobsRef.current[tab];
        }
      },
    }));

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

      setApplying(true);
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

        // 같은 탭을 재적용할 때 이전 blob URL 해제
        const prev = pendingBlobsRef.current[activeTab];
        if (prev) URL.revokeObjectURL(prev.blobUrl);

        const blobUrl = URL.createObjectURL(blob);
        pendingBlobsRef.current[activeTab] = { blob, blobUrl };

        if (activeTab === "card") {
          setCardPreview(blobUrl);
          onCardChange(blobUrl);
        } else {
          setDetailPreview(blobUrl);
          onDetailChange(blobUrl);
        }
      } catch {
        setError("이미지 처리에 실패했습니다.");
      } finally {
        setApplying(false);
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
              disabled={applying || !completedCardCrop && activeTab === "card" || !completedDetailCrop && activeTab === "detail"}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {applying
                ? "적용 중..."
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
);

ThumbnailCropSection.displayName = "ThumbnailCropSection";
