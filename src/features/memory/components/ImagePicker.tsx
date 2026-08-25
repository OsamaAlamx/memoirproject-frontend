"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ALLOWED_PHOTO_MIME,
  MAX_PHOTO_SIZE_BYTES,
  MAX_PHOTOS_PER_MEMORY,
} from "@/features/memory/schemas";

export type PickedImage = {
  file: File;
  caption: string;
  previewUrl: string;
};

export function ImagePicker({
  images,
  onChange,
}: {
  images: PickedImage[];
  onChange: (imgs: PickedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_PHOTOS_PER_MEMORY - images.length;
    const next: PickedImage[] = [];

    for (const file of Array.from(files).slice(0, remaining)) {
      if (!ALLOWED_PHOTO_MIME.includes(file.type as (typeof ALLOWED_PHOTO_MIME)[number])) {
        alert(`${file.name}: only JPEG, PNG, or WebP allowed.`);
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        alert(`${file.name}: exceeds 10MB.`);
        continue;
      }
      next.push({
        file,
        caption: "",
        previewUrl: URL.createObjectURL(file),
      });
    }

    onChange([...images, ...next]);
  }

  function updateCaption(idx: number, caption: string) {
    const copy = [...images];
    copy[idx] = { ...copy[idx], caption };
    onChange(copy);
  }

  function remove(idx: number) {
    URL.revokeObjectURL(images[idx].previewUrl);
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-900/30 py-8 text-center text-sm text-amber-900/70 hover:bg-amber-50">
        <UploadCloud className="size-8" />
        <span className="font-medium">Upload a photograph</span>
        <span className="text-xs">
          JPEG, PNG, or WebP · up to {MAX_PHOTOS_PER_MEMORY} photographs
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_PHOTO_MIME.join(",")}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt=""
                className="h-32 w-full rounded-lg object-cover"
              />
              <input
                type="text"
                value={img.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Optional caption"
                className="w-full rounded-md border border-amber-900/20 px-2 py-1 text-xs"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(i)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}