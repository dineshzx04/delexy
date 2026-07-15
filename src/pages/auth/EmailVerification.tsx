import React from 'react';
import { Button as AntButton } from 'antd';
import * as Lucide from 'lucide-react';
import { Link } from 'react-router-dom';

const EmailVerification: React.FC = () => {
  return (
    <div className="w-full text-center">
      <div className="mx-auto w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-6">
        <Lucide.Mail size={32} className="text-sky-600" />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-4">Check your email</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
        We've sent a verification link to <strong>name@company.com</strong>.
        Please click the link to verify your account and continue setting up your profile.
      </p>

      <AntButton type="primary" size="large" className="w-full bg-sky-600 hover:bg-sky-700 mb-4">
        Open Email App
      </AntButton>

      <div className="text-sm text-slate-500 mb-8">
        Didn't receive the email? <button className="text-sky-600 font-semibold hover:underline">Click to resend</button>
      </div>

      <Link to="/login" className="flex items-center justify-center text-slate-500 hover:text-slate-900 font-medium">
        <Lucide.ArrowLeft size={16} className="mr-2" /> Back to log in
      </Link>
    </div>
  );
};

export default EmailVerification;
