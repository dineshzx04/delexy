import React from 'react';
import { Button as AntButton, Avatar as AntAvatar, Divider as AntDivider } from 'antd';
import * as Lucide from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JoinOrganization: React.FC = () => {
  const navigate = useNavigate();

  const handleAccept = () => {
    console.log('Accepted invitation');
    navigate('/');
  };

  const handleDecline = () => {
    console.log('Declined invitation');
    navigate('/');
  };

  return (
    <div className="w-full text-center">
      <div className="mx-auto w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 border border-sky-100 shadow-sm">
        <Lucide.Building2 size={36} className="text-sky-600" />
      </div>

      <h2 className="text-3xl font-bold text-slate-900 mb-2">You've been invited!</h2>
      <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
        <strong>Jane Smith</strong> has invited you to join <strong className="text-slate-800">Acme Corp</strong> on Delexy.
      </p>

      <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-200">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Organization Details</h4>
        <div className="flex items-center gap-4">
          <AntAvatar size={48} shape="square" style={{ backgroundColor: '#0284c7' }}>AC</AntAvatar>
          <div>
            <div className="font-bold text-slate-900 text-lg">Acme Corp</div>
            <div className="text-slate-500 text-sm">Manufacturing • 201-500 employees</div>
          </div>
        </div>
        <AntDivider className="my-4" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Your assigned role:</span>
          <span className="font-semibold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">Procurement Manager</span>
        </div>
      </div>

      <div className="flex gap-4">
        <AntButton size="large" className="flex-1 h-12" onClick={handleDecline} icon={<Lucide.X size={16} />}>
          Decline
        </AntButton>
        <AntButton type="primary" size="large" className="flex-1 h-12 bg-sky-600 hover:bg-sky-700" onClick={handleAccept} icon={<Lucide.Check size={16} />}>
          Accept Invitation
        </AntButton>
      </div>
    </div>
  );
};

export default JoinOrganization;
