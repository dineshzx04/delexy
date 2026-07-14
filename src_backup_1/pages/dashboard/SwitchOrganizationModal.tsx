import React from 'react';
import { Modal as AntModal, Avatar as AntAvatar, Button as AntButton, Tag as AntTag } from 'antd';
import * as Lucide from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SwitchOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SwitchOrganizationModal: React.FC<SwitchOrganizationModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Mock data for user's organizations
  const organizations = [
    {
      id: 'ind-1',
      name: 'John Doe',
      type: 'individual',
      role: 'Individual User',
      isActive: false,
    },
    {
      id: 'org-1',
      name: 'Acme Corp',
      type: 'tenant',
      role: 'Organization Owner',
      isActive: true,
    },
    {
      id: 'org-2',
      name: 'Globex Inc',
      type: 'tenant',
      role: 'Procurement Manager',
      isActive: false,
    },
  ];

  const handleCreateOrg = () => {
    onClose();
    navigate('/auth/create-organization');
  };

  return (
    <AntModal
      title={<div className="text-lg font-semibold">Switch Context</div>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      className="rounded-lg"
    >
      <div className="py-2">
        <p className="text-gray-500 mb-4 block">
          Select which workspace you want to operate in. You can also create a new organization.
        </p>
        
        <ul className="mb-4 border border-gray-200 rounded-md divide-y divide-gray-200">
          {organizations.map((item) => (
            <li 
              key={item.id}
              className={`cursor-pointer px-4 py-3 flex items-center hover:bg-sky-50 transition-colors ${item.isActive ? 'bg-sky-50/50' : ''}`}
              onClick={onClose} // In real app, trigger context switch here
            >
              <AntAvatar 
                className="shrink-0 mr-4"
                style={{ backgroundColor: item.type === 'tenant' ? '#f0f9ff' : '#f8fafc', color: item.type === 'tenant' ? '#0284c7' : '#475569' }}
                icon={item.type === 'tenant' ? <Lucide.Building2 size={16} /> : <Lucide.User size={16} />} 
              />
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-gray-900">{item.name}</span>
                  {item.isActive && <Lucide.CheckCircle2 size={16} className="text-sky-600" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <AntTag bordered={false} color={item.type === 'tenant' ? 'blue' : 'default'} className="m-0 text-[10px] leading-3 py-0.5">
                    {item.type.toUpperCase()}
                  </AntTag>
                  <span className="text-xs text-gray-500">{item.role}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <AntButton type="dashed" block icon={<Lucide.Building2 size={16} />} onClick={handleCreateOrg}>
          Create New Organization
        </AntButton>
      </div>
    </AntModal>
  );
};

export default SwitchOrganizationModal;
