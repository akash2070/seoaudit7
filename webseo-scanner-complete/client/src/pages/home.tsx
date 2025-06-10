import { useState } from "react";
import AuditForm from "@/components/audit-form";
import LoadingSpinner from "@/components/loading-spinner";
import ResultsDisplay from "@/components/results-display";
import FeatureGrid from "@/components/feature-grid";
import { useToast } from "@/hooks/use-toast";
import type { AuditResult } from "@shared/schema";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResult | null>(null);
  const { toast } = useToast();

  const handleAudit = async (url: string) => {
    setIsLoading(true);
    setAuditResults(null);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAuditResults(data);
      
      toast({
        title: "Audit Complete",
        description: "Your SEO audit has been completed successfully.",
      });

    } catch (error: any) {
      console.error('Audit error:', error);
      toast({
        title: "Audit Failed", 
        description: error.message || "An error occurred during the audit",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBackend = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      toast({
        title: "Backend Status",
        description: `All ${data.endpoints?.length || 6} API endpoints operational`,
      });
    } catch (error) {
      toast({
        title: "Backend Error",
        description: "Failed to connect to backend API",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="text-center text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
            WebSeoScanner
          </h1>
          <h2 className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed mb-4">
            Professional website SEO analysis tool. Comprehensive auditing with Google PageSpeed insights, meta tag optimization, and performance metrics.
          </h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Advanced SEO scanner providing detailed analysis and actionable recommendations for better search rankings.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm opacity-80">
            <span className="bg-white/20 px-3 py-1 rounded-full">✨ React Frontend</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">⚡ Express Backend</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">🔗 REST API</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">☁️ Cloud Ready</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Audit Form */}
        <AuditForm onAudit={handleAudit} isLoading={isLoading} />

        {/* Features Grid */}
        <FeatureGrid />

        {/* Loading Spinner */}
        {isLoading && <LoadingSpinner />}

        {/* Results */}
        {auditResults && <ResultsDisplay results={auditResults} />}

        {/* SEO Content Section */}
        <section className="glass-strong rounded-2xl p-8 mt-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Why Choose WebSeoScanner?</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Advanced Analysis</h4>
              <p className="text-gray-600 leading-relaxed">
                Our tool performs comprehensive analysis using Google PageSpeed Insights API, examining meta tags, 
                links, security headers, and Core Web Vitals to give you actionable insights.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Professional Reports</h4>
              <p className="text-gray-600 leading-relaxed">
                Generate detailed PDF reports with color-coded recommendations, performance scores, 
                and specific improvement suggestions for your website's SEO optimization.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button 
              onClick={testBackend}
              className="px-6 py-3 bg-white/20 border border-white/30 text-gray-800 rounded-xl hover:bg-white/30 transition-all duration-300 btn-hover"
            >
              Test Backend Connection
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="text-center text-white/80 py-12 px-4">
        <p className="text-lg">© 2025 WebSeoScanner - Professional Website Analysis Tool</p>
        <p className="text-sm mt-2 opacity-75">Advanced SEO Scanner | Built with React, Express, and Google PageSpeed Insights API</p>
      </footer>
    </div>
  );
}
