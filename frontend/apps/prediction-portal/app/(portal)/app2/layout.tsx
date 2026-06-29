import { FilterProvider } from '@/lib/app2/FilterContext';
import { App2Sidebar } from '@/components/app2/App2Sidebar';

export default function App2Layout({ children }: { children: React.ReactNode }) {
  return (
    <FilterProvider>
      <div data-testid="page-bg" className="flex flex-1 bg-primary-50 text-gray-900 min-h-[calc(100vh-4rem)]">
        <App2Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </FilterProvider>
  );
}
