const SIZES = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
] as const;

type SizeValue = (typeof SIZES)[number]["value"];

export class ImageSizeTune {
  static get isTune() {
    return true;
  }

  private data: { width: SizeValue };
  private wrapper: HTMLElement | null = null;

  constructor({ data }: { data?: { width?: SizeValue } }) {
    this.data = { width: data?.width ?? "100%" };
  }

  /** 블록 콘텐츠를 래핑 — 저장된 크기를 즉시 반영 */
  wrap(blockContent: HTMLElement): HTMLElement {
    this.wrapper = blockContent;
    this._applySize();
    return blockContent;
  }

  /** 블록 설정 패널에 렌더링 (툴바 ⚙ 클릭 시 노출) */
  render(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText =
      "display:flex;align-items:center;gap:4px;padding:4px 6px;";

    const label = document.createElement("span");
    label.textContent = "크기";
    label.style.cssText =
      "font-size:12px;color:#707684;margin-right:2px;white-space:nowrap;";
    container.appendChild(label);

    for (const size of SIZES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = size.label;
      this._styleBtn(btn, size.value === this.data.width);

      btn.addEventListener("click", () => {
        this.data = { width: size.value };
        this._applySize();
        container
          .querySelectorAll<HTMLButtonElement>("button")
          .forEach((b, i) => {
            this._styleBtn(b, SIZES[i].value === size.value);
          });
      });

      container.appendChild(btn);
    }

    return container;
  }

  save(): { width: SizeValue } {
    return this.data;
  }

  private _applySize(): void {
    if (!this.wrapper) return;
    const imageWrapper = this.wrapper.querySelector<HTMLElement>(
      ".image-tool__image"
    );
    if (imageWrapper) {
      imageWrapper.style.maxWidth = this.data.width;
      imageWrapper.style.margin =
        this.data.width === "100%" ? "0" : "0 auto";
    }
  }

  private _styleBtn(btn: HTMLButtonElement, active: boolean): void {
    btn.style.cssText = [
      "padding:3px 8px",
      "border-radius:4px",
      `border:1px solid ${active ? "#388ae5" : "#e0e0e0"}`,
      `background:${active ? "#e8f1fd" : "white"}`,
      `color:${active ? "#388ae5" : "#707684"}`,
      "cursor:pointer",
      "font-size:11px",
      `font-weight:${active ? "600" : "400"}`,
    ].join(";");
  }
}
