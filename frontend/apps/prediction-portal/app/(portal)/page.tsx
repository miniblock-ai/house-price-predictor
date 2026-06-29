import { Button, Card } from '@project/shared-ui';

export default function PortalLanding() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">
        HousePrice Predictor
      </h1>
      <p className="text-neutral-500 mb-10">
        Property valuation and market analysis tools
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card title="Property Value Estimator">
          <p className="text-sm text-neutral-500 mb-6">
            Get instant AI-powered property valuations. Compare properties side-by-side.
          </p>
          <a
            href="/app1"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-card font-medium hover:bg-primary-700 transition-colors"
            data-testid="landing-link-app1"
          >
            Open Estimator
          </a>
        </Card>
        <Card title="Market Overview">
          <p className="text-sm text-neutral-500 mb-6">
            View regional property market statistics and trends.
          </p>
          <a
            href="/app2"
            className="inline-block px-6 py-3 bg-primary-500 text-white rounded-card font-medium hover:bg-primary-700 transition-colors"
            data-testid="landing-link-app2"
          >
            Open Market Overview
          </a>
        </Card>
      </div>
    </div>
  );
}
