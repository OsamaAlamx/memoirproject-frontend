import type { Metadata } from "next";
import { Chewy, League_Spartan } from "next/font/google";
import { DashboardNav } from "@/features/dashboard/components/DashboardNav";

const chewy = Chewy({
  weight: "400",
  variable: "--font-chewy",
  subsets: ["latin"],
  display: "swap",
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memoir Dashboard",
  description: "Preserve stories, photographs, voices, and moments for generations.",
};

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ memoirId: string }>;
}>) {
  const { memoirId } = await params;

  return (
    <div className={`${chewy.variable} ${leagueSpartan.variable} min-h-screen bg-[#FDFBF7] font-sans text-amber-950 antialiased`}>
      <DashboardNav memoirId={memoirId} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}