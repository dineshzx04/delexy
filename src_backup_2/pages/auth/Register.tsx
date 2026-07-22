import React from 'react';
import { Input as AntInput, Button as AntButton, Divider as AntDivider } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import FormItem from '../../components/common/FormItem';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { firstName: '', lastName: '', email: '', password: '' }
  });

  const onFinish = (values: any) => {
    console.log('Register values:', values);
    navigate('/verify-email');
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create an Account</h2>
        <p className="text-slate-500">Join Delexy to start streamlining your engineering procurement.</p>
      </div>

      <form onSubmit={handleSubmit(onFinish)} className="space-y-4">
        <div className="flex gap-4 w-full">
          <div className="flex-1">
            <FormItem 
              label="First Name" 
              required 
              error={errors.firstName?.message as string}
            >
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <AntInput {...field} size="large" status={errors.firstName ? 'error' : ''} placeholder="John" />
                )}
              />
            </FormItem>
          </div>
          <div className="flex-1">
            <FormItem 
              label="Last Name" 
              required 
              error={errors.lastName?.message as string}
            >
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Last name is required' }}
                render={({ field }) => (
                  <AntInput {...field} size="large" status={errors.lastName ? 'error' : ''} placeholder="Doe" />
                )}
              />
            </FormItem>
          </div>
        </div>

        <FormItem 
          label="Work Email Address" 
          required 
          error={errors.email?.message as string}
        >
          <Controller
            name="email"
            control={control}
            rules={{ 
              required: 'Please input your work email!', 
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } 
            }}
            render={({ field }) => (
              <AntInput {...field} size="large" status={errors.email ? 'error' : ''} placeholder="name@company.com" />
            )}
          />
        </FormItem>

        <FormItem 
          label="Password" 
          required 
          error={errors.password?.message as string}
        >
          <Controller
            name="password"
            control={control}
            rules={{ 
              required: 'Please create a password!',
              minLength: { value: 8, message: 'Must be at least 8 characters.' }
            }}
            render={({ field }) => (
              <AntInput.Password {...field} size="large" status={errors.password ? 'error' : ''} placeholder="Create a strong password" />
            )}
          />
        </FormItem>

        <div className="text-sm text-slate-500 mb-6">
          By signing up, you agree to our <a href="#" className="text-sky-600 hover:underline">Terms of Service</a> and <a href="#" className="text-sky-600 hover:underline">Privacy Policy</a>.
        </div>

        <div className="mt-4">
          <AntButton type="primary" htmlType="submit" className="w-full bg-sky-600 hover:bg-sky-700" size="large">
            Create Account
          </AntButton>
        </div>
      </form>

      <div className="text-center text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-sky-600 font-semibold hover:text-sky-700">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
