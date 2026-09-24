export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-dashboard text-sidebar">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
            LI
          </div>
          <div>
            <h1 className="text-xl font-bold text-dark">Laundry Insight</h1>
            <p className="text-xs text-gray-500">Operasional & Analitik Bisnis Laundry</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Status Setup</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-success"></span>
              <span className="text-sm font-semibold text-dark">Next.js & Tailwind</span>
            </div>
          </div>
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Palette Skote</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-3.5 w-3.5 rounded bg-sidebar" title="Sidebar/Dark (#2A3042)"></span>
              <span className="h-3.5 w-3.5 rounded bg-primary" title="Primary (#0284C7)"></span>
              <span className="h-3.5 w-3.5 rounded bg-success" title="Success (#34C38F)"></span>
              <span className="h-3.5 w-3.5 rounded bg-warning" title="Warning (#F1B44C)"></span>
              <span className="h-3.5 w-3.5 rounded bg-danger" title="Danger (#F46A6A)"></span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Tahap 1: Inisialisasi Fondasi Selesai</span>
          <span className="text-primary font-medium">Ready</span>
        </div>
      </div>
    </main>
  );
}
