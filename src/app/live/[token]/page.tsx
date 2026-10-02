"use client";

import { useParams } from "next/navigation";
import ReaderView from "@/features/share/ReaderView";

export default function Page() {
  const { token } = useParams<{ token: string }>();
  if (!token) return null;
  return <ReaderView token={token} />;
}
