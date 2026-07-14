import React from 'react';
import { Link } from 'react-router-dom';
import { Button as AntButton } from 'antd';
import * as Lucide from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Lucide.Hexagon size={32} className="text-sky-600" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">Delexy</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth/login" className="text-slate-600 hover:text-sky-600 font-medium transition-colors">
            Sign In
          </Link>
          <Link to="/auth/register">
            <AntButton type="primary" size="large" className="font-medium">
              Create Account
            </AntButton>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 py-20 lg:py-32">
        <div className="inline-block mb-4 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold tracking-wide">
          BETA RELEASE 1.0
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight mb-6">
          The Enterprise <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-800">Sourcing Engine</span>
        </h1>
        <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Delexy connects global engineering suppliers with enterprise buyers. Manage RFQs, track procurement, and scale your supply chain in one unified platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/auth/register">
            <AntButton type="primary" size="large" className="h-14 px-8 text-lg font-medium flex items-center gap-2">
              Start Sourcing Now <Lucide.ArrowRight size={20} />
            </AntButton>
          </Link>
          <Link to="/auth/login">
            <AntButton size="large" className="h-14 px-8 text-lg font-medium">
              Access Supplier Portal
            </AntButton>
          </Link>
        </div>

        {/* Features Preview */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4 text-sky-600">
              <Lucide.ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Suppliers</h3>
            <p className="text-slate-600">Access a curated network of ISO-certified manufacturing and engineering partners globally.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4 text-sky-600">
              <Lucide.Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Instant RFQs</h3>
            <p className="text-slate-600">Generate, distribute, and analyze Request for Quotations with automated AI-driven insights.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4 text-sky-600">
              <Lucide.Globe size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Tenant Setup</h3>
            <p className="text-slate-600">Manage multiple organizational contexts, roles, and complex approval workflows seamlessly.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Delexy Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
