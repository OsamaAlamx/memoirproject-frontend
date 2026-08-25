import { ContributorsPage } from "@/features/contributors/components/ContributorsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ memoirId: string }>;
}) {
  const { memoirId } = await params;
  return <ContributorsPage memoirId={memoirId} />;
}