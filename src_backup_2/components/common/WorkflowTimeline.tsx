import React from 'react';
import { Steps } from 'antd';
import * as Lucide from 'lucide-react';

export type ProductStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Changes Requested' | 'Resubmitted' | 'Approved' | 'Published';

interface WorkflowTimelineProps {
  currentStatus: ProductStatus;
}

const getStepStatus = (stepIndex: number, currentStep: number, isRejected: boolean) => {
  if (isRejected && stepIndex === 3) return 'error'; // Error on the Review step
  if (stepIndex === currentStep) return 'process';
  if (stepIndex < currentStep) return 'finish';
  return 'wait';
};

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ currentStatus }) => {
  let currentStep = 0;
  let isRejected = false;
  
  switch (currentStatus) {
    case 'Draft': currentStep = 0; break;
    case 'Submitted': 
    case 'Resubmitted': currentStep = 1; break;
    case 'Under Review': currentStep = 2; break;
    case 'Changes Requested': currentStep = 3; isRejected = true; break;
    case 'Approved': currentStep = 3; break;
    case 'Published': currentStep = 4; break;
  }

  const items = [
    { title: 'Draft', icon: <Lucide.Edit3 size={20} /> },
    { title: 'Submitted', icon: <Lucide.Send size={20} /> },
    { title: 'Under Review', icon: <Lucide.Search size={20} /> },
    { 
      title: isRejected ? 'Changes Requested' : 'Approved', 
      icon: isRejected ? <Lucide.AlertCircle size={20} /> : <Lucide.CheckCircle size={20} /> 
    },
    { title: 'Published', icon: <Lucide.Globe size={20} /> },
  ];

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-200 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Lucide.GitCommit size={20} className="text-sky-600" />
        Product Review Timeline
      </h3>
      <Steps
        current={currentStep}
        items={items.map((item, index) => ({
          ...item,
          status: getStepStatus(index, currentStep, isRejected)
        }))}
      />
    </div>
  );
};

export default WorkflowTimeline;
