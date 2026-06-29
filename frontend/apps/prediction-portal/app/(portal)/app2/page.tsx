import { DashboardShell } from '@/components/app2/DashboardShell';

export default function App2DashboardPage() {
  return (
    <>
      <div className="px-6 pt-6 pb-2">
        <h1 data-testid="content.title" className="text-2xl font-bold text-gray-900">Market Analysis Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Explore market trends and property insights
        </p>
      </div>
      <DashboardShell />
    </>
  );
}
