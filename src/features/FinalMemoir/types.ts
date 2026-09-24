export interface MemoryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface MemoryAudio {
  id: string;
  url: string;
  caption?: string;
  transcript?: {
    display_text?: string;
    raw_text?: string;
    confidence?: number;
    language?: string;
  } | null;
}

export interface MemoryItem {
  id: string;
  author: string;
  title?: string;
  text: string;
  reactionsCount: number;
  imageUrl?: string;
  imageCaption?: string;
  images?: MemoryImage[];
  audioClips?: MemoryAudio[];
  chapter: string;
  chapterSubtitle?: string;
  date: string;
}

export interface ShortQuote {
  id: string;
  author: string;
  text: string;
}

export interface HeroPhoto {
  id: string;
  url: string;
  caption: string;
}