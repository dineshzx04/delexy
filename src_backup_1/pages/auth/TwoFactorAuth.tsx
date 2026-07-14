import React, { useRef } from 'react';
import { Form as AntForm, Input as AntInput, Button as AntButton } from 'antd';
import * as Lucide from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const TwoFactorAuth: React.FC = () => {
  const navigate = useNavigate();
  // We use AntInput here if we want to stick to the exact Ant component type,
  // but practically it is any HTML input-like element.
  const inputRefs = useRef<(any | null)[]>([]);

  const onFinish = (values: any) => {
    console.log('2FA values:', values);
    // Proceed to app
    navigate('/');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.value.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Two-Factor Authentication</h2>
        <p className="text-slate-500">We've sent a 6-digit code to your authentication app or email. Enter it below to verify your identity.</p>
      </div>

      <AntForm
        name="2fa"
        onFinish={onFinish}
        size="large"
      >
        <div className="flex justify-between gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <AntForm.Item
              key={index}
              name={`digit${index}`}
              className="mb-0"
              rules={[{ required: true, message: '' }]}
            >
              <AntInput
                ref={(el) => (inputRefs.current[index] = el)}
                className="w-12 h-14 text-center text-2xl font-semibold bg-slate-50"
                maxLength={1}
                onChange={(e) => handleInput(e as any, index)}
                onKeyDown={(e) => handleKeyDown(e as any, index)}
              />
            </AntForm.Item>
          ))}
        </div>

        <AntForm.Item>
          <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
            Verify & Proceed
          </AntButton>
        </AntForm.Item>
      </AntForm>

      <div className="text-center text-sm text-slate-500 mb-6">
        Didn't receive the code? <button className="text-sky-600 font-semibold hover:underline">Resend</button>
      </div>

      <Link to="/auth/login" className="flex items-center justify-center text-slate-500 hover:text-slate-900 font-medium">
        <Lucide.ArrowLeft size={16} className="mr-2" /> Back to log in
      </Link>
    </div>
  );
};

export default TwoFactorAuth;
