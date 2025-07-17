export default function StaticPageShell({
  title, children
}: { title: string; children: React.ReactNode }) {
  return (
    <main className="container mx-auto max-w-3xl py-16 space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {children}
    </main>
  );
} 