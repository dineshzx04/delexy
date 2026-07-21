import React from 'react';
import * as Lucide from 'lucide-react';
import { Tooltip } from 'antd';
import { cn } from '../../lib/utils';

interface FormItemProps {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const FormItem: React.FC<FormItemProps> = ({ label, required, error, tooltip, children, className, id }) => {
  return (
    <div className={cn('flex flex-col mb-4', className)}>
      {label && (
        <div className="flex items-center gap-1 mb-2">
          {required && <span className="text-red-500">*</span>}
          <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
          {tooltip && (
            <Tooltip title={tooltip}>
              <Lucide.Info size={14} className="text-gray-400 cursor-help" />
            </Tooltip>
          )}
        </div>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <div className="text-red-500 text-xs mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormItem;
