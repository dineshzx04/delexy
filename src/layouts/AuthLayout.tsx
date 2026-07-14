import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import * as Lucide from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-row bg-white">
      {/* Left side - Branding/Marketing (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-sky-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-sky-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-sky-100 transition-colors">
            <Lucide.Hexagon size={32} className="text-sky-400" />
            <span className="text-2xl font-bold tracking-tight">Delexy</span>
          </Link>
          <div className="mt-24 max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-6">
              The B2B Engineering Marketplace & Procurement Platform
            </h1>
            <p className="text-sky-200 text-lg">
              Streamline your RFQs, manage your suppliers, and scale your global sourcing with enterprise-grade tools.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sky-400 text-sm">
          © {new Date().getFullYear()} Delexy Inc. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-slate-800">
            <Lucide.Hexagon size={28} className="text-sky-600" />
            <span className="text-xl font-bold tracking-tight">Delexy</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
