import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  innerRef?: React.Ref<HTMLInputElement>;
  id: string;
  label?: string;
  isInvalid?: boolean;
  value?: string;
}


const PasswordInput: React.FC<PasswordInputProps> = ({ innerRef, id, label, isInvalid, value = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        ref={innerRef}
        value={value}
        autoComplete="off"
        className={`h-12 w-full border rounded-lg px-4 ${value ? 'pr-12' : 'pr-4'} text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
          isInvalid ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-contacts-auto-fill-button,
        input[type="password"]::-webkit-credentials-auto-fill-button {
          visibility: hidden;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
    </div>
  );
};

export default PasswordInput;
