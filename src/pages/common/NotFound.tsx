import React from 'react';
import { Button as AntButton, Result as AntResult } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Lucide from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface NotFoundProps {
  scope?: 'user' | 'business' | 'platform' | 'global';
}

const NotFound: React.FC<NotFoundProps> = ({ scope }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeWorkspace } = useWorkspace();

  const handleReturn = () => {
    if (scope === 'platform' || activeWorkspace?.type === 'PLATFORM') {
      navigate('/p/dashboard');
    } else if (scope === 'business' || activeWorkspace?.type === 'BUSINESS') {
      navigate('/b/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  const getScopeBadge = () => {
    if (scope === 'platform' || activeWorkspace?.type === 'PLATFORM') {
      return { text: 'Platform Workspace Context', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    if (scope === 'business' || activeWorkspace?.type === 'BUSINESS') {
      return { text: 'Business Workspace Context', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    return { text: 'Personal Workspace Context', color: 'bg-sky-100 text-sky-800 border-sky-200' };
  };

  const badge = getScopeBadge();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-200/80 my-4 shadow-2xs">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 mb-6 shadow-sm">
          <Lucide.FileQuestion size={40} />
        </div>

        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
            {badge.text}
          </span>
        </div>

        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
          404 - Page Not Found
        </h1>

        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          The requested page <code className="bg-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">{location.pathname}</code> does not exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <AntButton
            type="primary"
            size="large"
            icon={<Lucide.ArrowLeft size={16} />}
            onClick={handleReturn}
            className="font-medium bg-slate-900 hover:bg-slate-800 border-slate-900 flex items-center gap-2"
          >
            Back to Dashboard
          </AntButton>

          <AntButton
            size="large"
            icon={<Lucide.RotateCcw size={16} />}
            onClick={() => navigate(-1)}
            className="font-medium flex items-center gap-2"
          >
            Go Back
          </AntButton>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
