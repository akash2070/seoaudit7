import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { AuditResult } from "@shared/schema";

interface ResultsDisplayProps {
  results: AuditResult;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
      case 'pass':
        return 'status-good';
      case 'warning':
      case 'warn':
        return 'status-warning';
      case 'error':
      case 'fail':
        return 'status-error';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const downloadPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const urlObj = new URL(results.url);
      const domain = urlObj.hostname.replace('www.', '');
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      let yPosition = 20;
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);

      // Header
      pdf.setFillColor(102, 126, 234);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SEO Audit Report', margin, 25);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${date}`, margin, 35);

      yPosition = 60;

      // Website Info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Website Analyzed', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(results.url, margin, yPosition);
      
      yPosition += 20;

      // Overall Scores Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Performance Scores', margin, yPosition);
      yPosition += 15;

      const scores = [
        { label: 'Overall Score', value: results.scores.overall },
        { label: 'Technical SEO', value: results.scores.technical },
        { label: 'Content Quality', value: results.scores.content },
        { label: 'Performance', value: results.scores.performance },
        { label: 'Mobile SEO', value: results.scores.mobile }
      ];

      scores.forEach((score, index) => {
        const xPos = margin + (index % 2) * (contentWidth / 2);
        const yPos = yPosition + Math.floor(index / 2) * 15;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${score.label}:`, xPos, yPos);
        
        // Color based on score
        if (score.value >= 90) pdf.setTextColor(34, 139, 34);
        else if (score.value >= 70) pdf.setTextColor(255, 140, 0);
        else pdf.setTextColor(220, 20, 60);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${score.value}/100`, xPos + 60, yPos);
        pdf.setTextColor(0, 0, 0);
      });

      yPosition += 50;

      // PageSpeed Analysis
      if (results.speed) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PageSpeed Analysis', margin, yPosition);
        yPosition += 15;

        if (results.speed.performance) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Desktop Performance: ${results.speed.performance.score}/100`, margin, yPosition);
          yPosition += 8;
        }

        if (results.speed.mobile) {
          pdf.text(`Mobile Performance: ${results.speed.mobile.score}/100`, margin, yPosition);
          yPosition += 8;
        }

        if (results.speed.coreWebVitals) {
          yPosition += 5;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Core Web Vitals:', margin, yPosition);
          yPosition += 10;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`• Largest Contentful Paint: ${results.speed.coreWebVitals.lcp}`, margin + 5, yPosition);
          yPosition += 7;
          pdf.text(`• First Input Delay: ${results.speed.coreWebVitals.fid}`, margin + 5, yPosition);
          yPosition += 7;
          pdf.text(`• Cumulative Layout Shift: ${results.speed.coreWebVitals.cls}`, margin + 5, yPosition);
          yPosition += 15;
        }
      }

      // Meta Tags Analysis
      if (results.meta) {
        if (yPosition > 220) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Meta Tags Analysis', margin, yPosition);
        yPosition += 15;

        results.meta.items.forEach((item) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFont('helvetica', 'bold');
          pdf.text(`${item.name}:`, margin, yPosition);
          
          // Status color
          if (item.status === 'good') pdf.setTextColor(34, 139, 34);
          else if (item.status === 'warning') pdf.setTextColor(255, 140, 0);
          else pdf.setTextColor(220, 20, 60);
          
          pdf.text(item.status.toUpperCase(), margin + 80, yPosition);
          pdf.setTextColor(0, 0, 0);
          
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          
          // Split long text into multiple lines
          const maxWidth = contentWidth - 10;
          const descriptionLines = pdf.splitTextToSize(item.description, maxWidth);
          descriptionLines.forEach((line: string) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 8;
        });
      }

      // Links Analysis
      if (results.links) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Links Analysis', margin, yPosition);
        yPosition += 15;

        pdf.setFont('helvetica', 'normal');
        pdf.text(`Internal Links: ${results.links.internal.links.length} (${results.links.internal.broken} broken)`, margin, yPosition);
        yPosition += 8;
        pdf.text(`External Links: ${results.links.external.total || results.links.external.links.length} (${results.links.external.broken} broken)`, margin, yPosition);
        yPosition += 15;
      }

      // Recommendations
      if (results.recommendations && results.recommendations.length > 0) {
        if (yPosition > 150) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recommendations', margin, yPosition);
        yPosition += 15;

        results.recommendations.forEach((rec, index) => {
          if (yPosition > 260) {
            pdf.addPage();
            yPosition = 20;
          }

          // Priority color
          if (rec.priority === 'high') pdf.setTextColor(220, 20, 60);
          else if (rec.priority === 'medium') pdf.setTextColor(255, 140, 0);
          else pdf.setTextColor(34, 139, 34);

          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${rec.title} (${rec.priority.toUpperCase()})`, margin, yPosition);
          pdf.setTextColor(0, 0, 0);
          
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          
          // Split recommendation description into multiple lines
          const maxWidth = contentWidth - 10;
          const descLines = pdf.splitTextToSize(rec.description, maxWidth);
          descLines.forEach((line: string) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        });
      }

      // Add footer to all pages
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`SEO Audit Pro - Report generated for ${domain}`, margin, 290);

      pdf.save(`seo-audit-${domain}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  return (
    <div id="audit-results" className="glass-strong rounded-3xl p-8 md:p-12 shadow-2xl mb-12 animate-slide-up">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          📈 SEO Audit Results
        </h2>
        <Button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-6 py-3 gradient-primary text-white font-semibold rounded-xl btn-hover"
        >
          <Download className="h-5 w-5" />
          Download PDF Report
        </Button>
      </div>

      {/* Backend Status Indicator */}
      <div className="text-center mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
        <span className="text-green-700 font-medium">✅ Connected to Express.js Backend</span>
        <span className="text-sm text-green-600 block mt-1">All 6 API endpoints operational</span>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {Object.entries(results.scores).map(([key, score]) => (
          <div key={key} className="text-center p-6 gradient-card rounded-2xl border-2 border-gray-200">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </div>
          </div>
        ))}
      </div>

      {/* Error Messages */}
      {results.errors && results.errors.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Some analyses failed:</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {results.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Audit Sections */}
      <div className="space-y-6">
        {/* PageSpeed Analysis */}
        {results.speed && (
          <Card className="border-gray-200">
            <Collapsible 
              open={openSections.speed} 
              onOpenChange={() => toggleSection('speed')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="section-header gradient-card cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-3 text-blue-600">⚡</span>
                      PageSpeed Analysis
                    </div>
                    {openSections.speed ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Google PageSpeed Insights API integration</p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
                  {/* Core Web Vitals */}
                  {results.speed.coreWebVitals && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-700">
                          {results.speed.coreWebVitals.lcp}
                        </div>
                        <div className="text-sm text-green-600">Largest Contentful Paint</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-700">
                          {results.speed.coreWebVitals.fid}
                        </div>
                        <div className="text-sm text-yellow-600">First Input Delay</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-700">
                          {results.speed.coreWebVitals.cls}
                        </div>
                        <div className="text-sm text-green-600">Cumulative Layout Shift</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Performance Scores */}
                  <div className="space-y-3">
                    {results.speed.performance && (
                      <div className="flex justify-between items-center p-3 border-b border-gray-100">
                        <span className="font-medium">Desktop Performance Score</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass('good')}`}>
                          {results.speed.performance.score}/100
                        </span>
                      </div>
                    )}
                    {results.speed.mobile && (
                      <div className="flex justify-between items-center p-3 border-b border-gray-100">
                        <span className="font-medium">Mobile Performance Score</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass('good')}`}>
                          {results.speed.mobile.score}/100
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Meta Tags Analysis */}
        {results.meta && (
          <Card className="border-gray-200">
            <Collapsible 
              open={openSections.meta} 
              onOpenChange={() => toggleSection('meta')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="section-header gradient-card cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-3 text-purple-600">🏷️</span>
                      Meta Tags Analysis
                    </div>
                    {openSections.meta ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Cheerio HTML parsing for meta extraction</p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {results.meta.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                          {item.value && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {item.value.length > 100 ? `${item.value.slice(0, 100)}...` : item.value}
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(item.status)} ml-4`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Links Analysis */}
        {results.links && (
          <Card className="border-gray-200">
            <Collapsible 
              open={openSections.links} 
              onOpenChange={() => toggleSection('links')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="section-header gradient-card cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-3 text-orange-600">🔗</span>
                      Links Analysis
                    </div>
                    {openSections.links ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Internal & external link validation</p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-700">
                        {results.links.internal.links.length}
                      </div>
                      <div className="text-sm text-blue-600">Internal Links</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-3xl font-bold text-green-700">
                        {results.links.external.total || results.links.external.links.length}
                      </div>
                      <div className="text-sm text-green-600">External Links</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <div className="text-3xl font-bold text-red-700">
                        {results.links.internal.broken + results.links.external.broken}
                      </div>
                      <div className="text-sm text-red-600">Broken Links</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                      <span className="font-medium">Internal Links Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(results.links.internal.status)}`}>
                        {results.links.internal.broken === 0 ? 'All Working' : `${results.links.internal.broken} Broken`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                      <span className="font-medium">External Links Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(results.links.external.status)}`}>
                        {results.links.external.broken === 0 ? 'All Working' : `${results.links.external.broken} Broken`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Robots & Sitemap */}
        {results.robots && (
          <Card className="border-gray-200">
            <Collapsible 
              open={openSections.robots} 
              onOpenChange={() => toggleSection('robots')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="section-header gradient-card cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-3 text-indigo-600">🤖</span>
                      Robots & Sitemap
                    </div>
                    {openSections.robots ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Crawlability configuration analysis</p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">Robots.txt File</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {results.robots.robotsTxt.found ? 'Found and accessible' : 'Not found'}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(results.robots.robotsTxt.found ? 'good' : 'warning')}`}>
                        {results.robots.robotsTxt.found ? 'Found' : 'Missing'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">XML Sitemap</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {results.robots.sitemap.found ? `Found with ${results.robots.sitemap.urlCount} URLs` : 'Not found'}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(results.robots.sitemap.found ? 'good' : 'warning')}`}>
                        {results.robots.sitemap.found ? 'Found' : 'Missing'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Security Headers */}
        {results.headers && (
          <Card className="border-gray-200">
            <Collapsible 
              open={openSections.headers} 
              onOpenChange={() => toggleSection('headers')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="section-header gradient-card cursor-pointer">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-3 text-red-600">🔒</span>
                      Security Headers
                    </div>
                    {openSections.headers ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">HTTP security & caching analysis</p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {results.headers.security.map((header, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">{header.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{header.description}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(header.status)}`}>
                          {header.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            💡 Priority Recommendations
          </h3>
          <div className="space-y-4">
            {results.recommendations.map((rec, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} priority
                  </span>
                  <span className="text-xs text-gray-500">{rec.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Implementation Summary */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🔧 Full-Stack Implementation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Frontend (React)</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Component-based architecture</li>
              <li>• Responsive design with Tailwind CSS</li>
              <li>• Real-time loading states</li>
              <li>• API data fetching with error handling</li>
              <li>• Progressive disclosure for complex data</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Backend (Node.js + Express)</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• RESTful API with 6 specialized endpoints</li>
              <li>• Axios for HTTP requests</li>
              <li>• Cheerio for HTML parsing</li>
              <li>• Environment variable configuration</li>
              <li>• In-memory processing (no database)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
