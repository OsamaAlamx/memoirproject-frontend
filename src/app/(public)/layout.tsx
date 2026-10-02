// src/app/(public)/layout.tsx
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main>{children}</main>
    </>
  );
}