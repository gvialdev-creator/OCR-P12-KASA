"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
} from "@/components/ui/icons";

interface PropertyCarouselProps {
  images: string[];
  title: string;
}

const AUTOPLAY_DELAY = 3000;

export function PropertyCarousel({ images, title }: PropertyCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [manuallyResumed, setManuallyResumed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const canNavigate = images.length > 1;
  const thumbnails = images;
  const showThumbnailsOnSide = images.length > 1 && images.length <= 4;
  const autoplayActive =
    canNavigate && isPlaying && (manuallyResumed || (!isHovered && !hasFocus)) && !reducedMotion;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!autoplayActive) return;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(interval);
  }, [autoplayActive, images.length]);

  function selectImage(index: number) {
    setActiveIndex(index);
    setIsPlaying(false);
    setManuallyResumed(false);
  }

  function showPrevious() {
    selectImage((activeIndex - 1 + images.length) % images.length);
  }

  function showNext() {
    selectImage((activeIndex + 1) % images.length);
  }

  if (images.length === 0) {
    return (
      <div className="flex h-90 items-center justify-center rounded-lg bg-neutral-light-grey px-6 text-center text-neutral-dark-grey sm:h-90">
        Aucune photo disponible pour {title}
      </div>
    );
  }

  return (
    <section
      aria-label={`Galerie photos de ${title}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setHasFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
    >
      <div
        className={
          showThumbnailsOnSide
            ? "md:flex md:gap-2"
            : undefined
        }
      >
        <div
          className={`relative h-90 overflow-hidden rounded-lg bg-neutral-light-grey sm:h-90 ${showThumbnailsOnSide ? "md:min-w-0 md:flex-1 md:basis-0" : ""}`}
        >
          {images.map((image, index) => (
            <Image
              key={image}
              src={image}
              alt={`Photo ${index + 1} sur ${images.length} de ${title}`}
              fill
              preload={index === 0}
              loading="eager"
              sizes={
                showThumbnailsOnSide
                  ? "(max-width: 767px) calc(100vw - 48px), 550px"
                  : "(max-width: 767px) calc(100vw - 48px), 736px"
              }
              className={`object-cover object-center transition-opacity duration-500 ease-out motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />
          ))}

          {canNavigate && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center cursor-pointer rounded-full bg-neutral-white/90 text-neutral-black shadow-card transition-colors hover:bg-neutral-white"
                aria-label="Photo précédente"
                onClick={showPrevious}
              >
                <ArrowLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center cursor-pointer rounded-full bg-neutral-white/90 text-neutral-black shadow-card transition-colors hover:bg-neutral-white"
                aria-label="Photo suivante"
                onClick={showNext}
              >
                <ArrowLeftIcon className="size-5 rotate-180" />
              </button>
              <button
                type="button"
                className="absolute bottom-3 right-3 flex size-9 items-center justify-center cursor-pointer rounded-full bg-neutral-white/90 text-neutral-black shadow-card"
                aria-label={isPlaying ? "Mettre le diaporama en pause" : "Reprendre le diaporama"}
                aria-pressed={!isPlaying}
                onClick={() => {
                  setManuallyResumed(!isPlaying);
                  setIsPlaying((playing) => !playing);
                }}
              >
                {isPlaying ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
              </button>
              <nav
                aria-label="Navigation entre les photos"
                className="scrollbar-none absolute bottom-3 left-1/2 flex max-w-[calc(100%-7rem)] -translate-x-1/2 gap-2 overflow-x-auto rounded-full bg-neutral-black/40 px-2 py-1"
              >
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex size-3 shrink-0 items-center justify-center cursor-pointer rounded-full"
                    aria-label={`Aller à la photo ${index + 1} sur ${images.length}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => selectImage(index)}
                  >
                    <span
                      className={`size-2 rounded-full ${index === activeIndex ? "bg-neutral-white" : "bg-neutral-white/50"}`}
                    />
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>

        {canNavigate && thumbnails.length > 0 && (
          <div
            className={
              showThumbnailsOnSide
                ? "mt-2 grid grid-cols-4 gap-2 md:mt-0 md:h-90 md:min-w-0 md:flex-1 md:basis-0 md:grid-cols-2 md:auto-rows-fr"
                : "mt-2 flex overflow-auto gap-2.5 px-1 py-1 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-brand-main-red scrollbar-track-slate-transparent"
            }
          >
            {thumbnails.map((image, index) => {
              const imageIndex = index;

              return (
                <button
                  key={image}
                  type="button"
                  className={`relative h-20 overflow-hidden cursor-pointer rounded-md bg-neutral-light-grey outline-offset-2 transition-opacity hover:opacity-90 sm:h-24 md:min-h-0 ${showThumbnailsOnSide ? "md:h-auto" : "max-w-[calc(25%-10px)] flex-[1_0_25%]"} ${imageIndex === activeIndex ? "outline-2 outline-brand-main-red" : ""}`}
                  aria-label={`Afficher la photo ${imageIndex + 1}`}
                  aria-current={imageIndex === activeIndex ? "true" : undefined}
                  onClick={() => selectImage(imageIndex)}
                >
                  <Image
                    src={image}
                    alt={`Aperçu de la photo ${imageIndex + 1} de ${title}`}
                    fill
                    loading="eager"
                    sizes="(max-width: 767px) 25vw, 180px"
                    className="object-cover object-center"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}