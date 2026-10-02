import MemoirList from "@/features/memoir/MemoirList";

export default function Page() {
  return (
    <main className="min-h-screen bg-memory-bg text-memory-primary px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl mb-2">Your memoirs</h1>
        <p className="text-sm text-memory-muted mb-8">
          Select a memoir to open its dashboard, or delete one you no longer need.
        </p>
        <MemoirList />
      </div>
    </main>
  );
}
