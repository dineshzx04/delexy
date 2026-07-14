import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { PATHS } from '../routes/paths';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Branding / Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#001529] relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <Link to={PATHS.HOME} className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">EM</span>
            </div>
            EngMarket
          </Link>
          <p className="mt-6 text-xl text-gray-300 font-medium max-w-md leading-relaxed">
            The world's leading multi-tenant engineering and industrial marketplace.
          </p>
        </div>
        
        <div className="relative z-10 text-sm text-gray-400">
          © {new Date().getFullYear()} EngMarket Inc. All rights reserved.
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/4 -left-32 w-72 h-72 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Right side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-[#fafafb] lg:bg-white shadow-[0_0_40px_rgba(0,0,0,0.05)] lg:shadow-none z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center flex justify-center">
            <Link to={PATHS.HOME} className="text-2xl font-bold text-primary-600 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <span className="text-white text-sm">EM</span>
              </div>
              EngMarket
            </Link>
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
