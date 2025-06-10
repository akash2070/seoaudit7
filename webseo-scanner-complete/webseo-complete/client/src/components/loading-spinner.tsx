export default function LoadingSpinner() {
  return (
    <div className="glass-strong rounded-3xl p-12 shadow-2xl text-center mb-12 animate-fade-in">
      <div className="spinner mx-auto mb-6"></div>
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">
        Analyzing your website...
      </h3>
      <p className="text-gray-600 mb-8">
        Our backend APIs are processing your site across multiple dimensions
      </p>
      
      {/* Progress Indicators */}
      <div className="max-w-2xl mx-auto space-y-3">
        {[
          { icon: "🌐", text: "Fetching page content...", delay: 0 },
          { icon: "⚡", text: "Running PageSpeed analysis...", delay: 1 },
          { icon: "🏷️", text: "Extracting meta tags...", delay: 2 },
          { icon: "🔗", text: "Checking links and structure...", delay: 3 },
          { icon: "🔒", text: "Analyzing security headers...", delay: 4 },
          { icon: "🤖", text: "Validating robots.txt...", delay: 5 }
        ].map((step, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-opacity duration-500`}
            style={{ 
              animationDelay: `${step.delay * 0.8}s`,
              opacity: 0.6
            }}
          >
            <span className="text-sm text-gray-600">
              <span className="mr-2">{step.icon}</span>
              {step.text}
            </span>
            <div className="spinner-small"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
