import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';

export default function Success() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  let title = "Success!";
  let message = "Operation completed successfully.";

  if (type === 'reset') {
    title = "Password Updated Successfully!";
    message = "Your new password has been saved. You can now continue securely.";
  } else if (type === 'signup') {
    title = "Account Created Successfully!";
    message = "Your account is successfully! You can sign in now.";
  } else if (type === 'login') {
    title = "Login Successful!";
    message = "Welcome back to Ekko Loop.";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="mb-8">
          <Logo />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          {message}
        </p>

        <Link to="/" className="block w-full">
          <Button>Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
