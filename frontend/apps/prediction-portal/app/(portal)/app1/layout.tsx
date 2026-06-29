import { ComparisonProvider } from '@/lib/app1/ComparisonContext';
import { App1Sidebar } from '@/components/app1/App1Sidebar';
import { ComparisonBar } from '@/components/app1/ComparisonBar';

export default function App1Layout({ children }: { children: React.ReactNode }) {
  return (
    <ComparisonProvider>
      <div className="flex flex-1 bg-primary-50 pb-12">
        <App1Sidebar />
        <main className="flex-1">{children}</main>
      </div>
      <ComparisonBar />
    </ComparisonProvider>
  );
}
