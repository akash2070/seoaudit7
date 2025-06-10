export default function FeatureGrid() {
  const features = [
    {
      icon: "⚡",
      title: "Lightning Fast Analysis",
      description: "Get comprehensive SEO insights in seconds with our advanced Express.js backend and optimized API endpoints"
    },
    {
      icon: "🔧",
      title: "Full-Stack Architecture", 
      description: "React frontend with Node.js backend, featuring 6 specialized API endpoints for comprehensive analysis"
    },
    {
      icon: "📊",
      title: "100+ SEO Factors",
      description: "Analyze technical SEO, meta tags, performance, links, robots.txt, and security headers"
    },
    {
      icon: "🎯",
      title: "Google PageSpeed Integration",
      description: "Real PageSpeed Insights API integration with mobile-first analysis and Core Web Vitals"
    },
    {
      icon: "☁️",
      title: "Cloud Ready",
      description: "Deploy frontend to Vercel and backend to Render/Railway with zero vendor lock-in"
    },
    {
      icon: "🔒",
      title: "Security & Privacy",
      description: "In-memory processing, security header analysis, and SSL validation without data storage"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
      {features.map((feature, index) => (
        <div
          key={index}
          className="glass rounded-2xl p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
        >
          <div className="text-5xl mb-6">{feature.icon}</div>
          <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
          <p className="text-gray-600 leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
