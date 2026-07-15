import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from 'antd';
import { Building2, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PATHS } from '../../routes/paths';

const Onboarding = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'individual' | 'organization' | null>(null);

  const handleContinue = () => {
    if (selectedOption === 'individual') {
      navigate(PATHS.DASHBOARD);
    } else if (selectedOption === 'organization') {
      navigate('/create-organization');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">How will you use EngMarket?</h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          We'll customize your experience based on your selection. You can always change this later or join multiple workspaces.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Individual Option */}
        <div
          onClick={() => setSelectedOption('individual')}
          className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-start gap-4 ${selectedOption === 'individual'
              ? 'border-primary-500 bg-primary-50/50'
              : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
            }`}
        >
          <div className={`p-3 rounded-lg flex-shrink-0 ${selectedOption === 'individual' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <User size={24} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-1 ${selectedOption === 'individual' ? 'text-primary-900' : 'text-gray-900'}`}>
              Individual Account
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              I'm here to browse products, request quotes, and make personal purchases.
            </p>
          </div>
          {selectedOption === 'individual' && (
            <div className="absolute top-5 right-5 text-primary-500">
              <CheckCircle2 size={20} className="fill-current text-white" />
            </div>
          )}
        </div>

        {/* Organization Option */}
        <div
          onClick={() => setSelectedOption('organization')}
          className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-start gap-4 ${selectedOption === 'organization'
              ? 'border-primary-500 bg-primary-50/50'
              : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
            }`}
        >
          <div className={`p-3 rounded-lg flex-shrink-0 ${selectedOption === 'organization' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Building2 size={24} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-1 ${selectedOption === 'organization' ? 'text-primary-900' : 'text-gray-900'}`}>
              Organization Workspace
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              I want to create a business profile to sell products, manage a team, or handle enterprise procurement.
            </p>
          </div>
          {selectedOption === 'organization' && (
            <div className="absolute top-5 right-5 text-primary-500">
              <CheckCircle2 size={20} className="fill-current text-white" />
            </div>
          )}
        </div>
      </div>

      <Button
        type="primary"
        size="large"
        className="w-full h-12 text-base font-medium rounded-md flex items-center justify-center gap-2"
        disabled={!selectedOption}
        onClick={handleContinue}
      >
        Continue <ArrowRight size={18} />
      </Button>

      <div className="mt-6 text-center">
        <button className="text-gray-500 hover:text-gray-800 text-sm font-medium underline underline-offset-4">
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
