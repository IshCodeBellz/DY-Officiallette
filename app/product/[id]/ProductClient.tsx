"use client";
import { useEffect, useState } from "react";
import { useCart, useWishlist } from "@/components/providers/CartProvider";
import { lineIdFor } from "@/lib/types";
import { pushRecentlyViewed } from "@/components/home/RecentlyViewed";
import { useToast } from "@/components/providers/ToastProvider";

interface ProductClientProps {
  product: {
    id: string;
    name: string;
    priceCents: number;
    image: string;
    description: string;
    sizes: string[];
    images: string[];
  };
}

export default function ProductClient({ product }: ProductClientProps) {
  const [size, setSize] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const wishId = lineIdFor(product.id, size || undefined);
  const { push } = useToast();

  // Track recently viewed (client only, once on mount / product change)
  useEffect(() => {
    pushRecentlyViewed(product.id);
    // Fire a DETAIL_VIEW engagement event
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [JSON.stringify([{ productId: product.id, type: "DETAIL_VIEW" }])],
          { type: "application/json" }
        )
      );
    } catch {}
  }, [product.id]);

  // Gallery interaction & enhancements (keyboard, swipe, preload, zoom modal)
  useEffect(() => {
    if (!product.images.length) return;
    const root = document.getElementById("gallery-root");
    if (!root) return;
    const slides = Array.from(
      root.querySelectorAll<HTMLDivElement>("[id^='image-']")
    );
    const counter = document.getElementById("gallery-counter");
    const zoomModal = document.getElementById("gallery-zoom-modal");
    const zoomSlides = zoomModal
      ? Array.from(
          zoomModal.querySelectorAll<HTMLDivElement>("[data-zoom-index]")
        )
      : [];
    const zoomCounter = document.getElementById("zoom-counter");
    const zoomButton = root.querySelector<HTMLButtonElement>(
      "[data-gallery-zoom]"
    );
    const zoomClose =
      zoomModal?.querySelector<HTMLButtonElement>("[data-zoom-close]");
    const zoomPrev =
      zoomModal?.querySelector<HTMLButtonElement>("[data-zoom-prev]");
    const zoomNext =
      zoomModal?.querySelector<HTMLButtonElement>("[data-zoom-next]");

    let active = 0;
    let zoomOpen = false;
    let touchStartX: number | null = null;
    let touchStartY: number | null = null;

    function updateCounter() {
      if (counter) counter.textContent = `${active + 1} / ${slides.length}`;
      if (zoomCounter)
        zoomCounter.textContent = `${active + 1} / ${slides.length}`;
    }
    function setActive(i: number) {
      active = (i + slides.length) % slides.length;
      slides.forEach((el, idx) =>
        el.setAttribute("data-active", String(idx === active))
      );
      zoomSlides.forEach((el, idx) =>
        el.setAttribute("data-active", String(idx === active))
      );
      setActiveIndex(active);
      updateCounter();
      preloadAdjacent(active);
    }
    function handlePrev() {
      setActive(active - 1);
    }
    function handleNext() {
      setActive(active + 1);
    }

    function preloadAdjacent(i: number) {
      const ahead = [
        (i + 1) % slides.length,
        (i - 1 + slides.length) % slides.length,
      ];
      ahead.forEach((idx) => {
        const imgEl = slides[idx].querySelector<HTMLImageElement>("img");
        const src = imgEl?.getAttribute("src");
        if (src) {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.as = "image";
          link.href = src;
          document.head.appendChild(link);
          // Clean up later
          setTimeout(() => link.remove(), 4000);
        }
      });
    }

    // Initial activation
    setActive(0);

    const prevBtn = document.querySelector<HTMLButtonElement>(
      "[data-gallery-prev]"
    );
    const nextBtn = document.querySelector<HTMLButtonElement>(
      "[data-gallery-next]"
    );
    prevBtn?.addEventListener("click", handlePrev);
    nextBtn?.addEventListener("click", handleNext);

    // Hash navigation (thumbnail anchor clicks)
    function hashListener() {
      const hash = window.location.hash;
      if (hash.startsWith("#image-")) {
        const idx = parseInt(hash.replace("#image-", ""), 10);
        if (!Number.isNaN(idx) && idx >= 0 && idx < slides.length)
          setActive(idx);
      }
    }
    window.addEventListener("hashchange", hashListener);
    hashListener();

    // Keyboard navigation (Left/Right arrows + Escape closes zoom)
    function keyListener(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape" && zoomOpen) {
        closeZoom();
      }
    }
    root.addEventListener("keydown", keyListener);
    document.addEventListener("keydown", keyListener);

    // Swipe gestures
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      // prevent vertical scroll hijack threshold
      if (touchStartX == null || touchStartY == null) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (Math.abs(dx) > 30 && dy < 40) {
        if (dx > 0) handlePrev();
        else handleNext();
        touchStartX = null;
        touchStartY = null;
      }
    }
    function onTouchEnd() {
      touchStartX = null;
      touchStartY = null;
    }
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });

    // Zoom modal management
    function openZoom() {
      if (!zoomModal) return;
      zoomModal.classList.remove("hidden");
      zoomModal.classList.add("flex");
      zoomOpen = true;
      setActive(active); // sync active slide
      (
        zoomModal.querySelector("[data-zoom-close]") as HTMLElement | null
      )?.focus();
      document.documentElement.style.overflow = "hidden";
    }
    function closeZoom() {
      if (!zoomModal) return;
      zoomModal.classList.add("hidden");
      zoomModal.classList.remove("flex");
      zoomOpen = false;
      document.documentElement.style.overflow = "";
      root?.focus();
    }
    zoomButton?.addEventListener("click", openZoom);
    zoomClose?.addEventListener("click", closeZoom);
    zoomPrev?.addEventListener("click", handlePrev);
    zoomNext?.addEventListener("click", handleNext);
    function backdropClose(e: MouseEvent) {
      if (e.target === zoomModal) closeZoom();
    }
    zoomModal?.addEventListener("click", backdropClose);

    // Clean up
    return () => {
      prevBtn?.removeEventListener("click", handlePrev);
      nextBtn?.removeEventListener("click", handleNext);
      window.removeEventListener("hashchange", hashListener);
      root.removeEventListener("keydown", keyListener);
      document.removeEventListener("keydown", keyListener);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      zoomButton?.removeEventListener("click", openZoom);
      zoomClose?.removeEventListener("click", closeZoom);
      zoomPrev?.removeEventListener("click", handlePrev);
      zoomNext?.removeEventListener("click", handleNext);
      zoomModal?.removeEventListener("click", backdropClose);
    };
  }, [product.images]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (product.sizes.length && !size) {
      alert("Please select a size");
      return;
    }
    addItem(
      {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        image: product.image,
        size: size || undefined,
      },
      1
    );
    // Fire-and-forget engagement event (add to cart)
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [JSON.stringify([{ productId: product.id, type: "ADD_TO_CART" }])],
          { type: "application/json" }
        )
      );
    } catch {}
    push({ type: "success", message: "Added to bag" });
  }

  function handleWishlist() {
    toggle({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      image: product.image,
      size: size || undefined,
    });
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [
            JSON.stringify([
              {
                productId: product.id,
                type: has(wishId) ? "UNWISHLIST" : "WISHLIST",
              },
            ]),
          ],
          { type: "application/json" }
        )
      );
    } catch {}
    push({
      type: has(wishId) ? "info" : "success",
      message: has(wishId) ? "Removed from saved" : "Saved",
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleAdd}>
      {product.sizes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1">
            Size
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <option value="">Select size</option>
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="btn-primary w-full">
        Add to bag
      </button>
      <button
        type="button"
        onClick={handleWishlist}
        className={`btn-outline w-full ${
          has(wishId) ? "border-neutral-900" : ""
        }`}
      >
        {has(wishId) ? "Remove from saved" : "Save for later"}
      </button>
    </form>
  );
}
