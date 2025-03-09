
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { toast } from '@/hooks/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };
  
  const validatePassword = () => {
    const { password } = formData;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  };
  
  const passwordRequirements = validatePassword();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { username, email, password, confirmPassword } = formData;
    
    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: "Invalid input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are the same",
        variant: "destructive",
      });
      return;
    }
    
    if (!Object.values(passwordRequirements).every(Boolean)) {
      toast({
        title: "Password requirements not met",
        description: "Please ensure your password meets all requirements",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Registration successful",
        description: "Welcome to DreamBet!",
      });
      navigate('/dashboard');
    }, 1500);
  };
  
  return (
    <>
      <OrbitingParticles />
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center text-dream-foreground/70 hover:text-dream-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back to Home</span>
          </Link>
          
          <div className="glass-panel p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2 text-gradient">Create Account</h1>
              <p className="text-dream-foreground/70">
                Join DreamBet and start predicting
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="username" className="block text-dream-foreground/80 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="input-dream w-full"
                  placeholder="dreampredictor"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="mb-5">
                <label htmlFor="email" className="block text-dream-foreground/80 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-dream w-full"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="mb-5">
                <label htmlFor="password" className="block text-dream-foreground/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input-dream w-full pr-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dream-foreground/60 hover:text-dream-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="mt-3 glass-panel p-3">
                  <p className="text-sm mb-2 text-dream-foreground/80">Password requirements:</p>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 rounded-full ${
                        passwordRequirements.length ? 'bg-green-500/20 text-green-500' : 'bg-dream-foreground/10 text-dream-foreground/30'
                      }`}>
                        {passwordRequirements.length && <Check className="w-3 h-3" />}
                      </span>
                      <span className={passwordRequirements.length ? 'text-dream-foreground/80' : 'text-dream-foreground/40'}>
                        At least 8 characters
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 rounded-full ${
                        passwordRequirements.uppercase ? 'bg-green-500/20 text-green-500' : 'bg-dream-foreground/10 text-dream-foreground/30'
                      }`}>
                        {passwordRequirements.uppercase && <Check className="w-3 h-3" />}
                      </span>
                      <span className={passwordRequirements.uppercase ? 'text-dream-foreground/80' : 'text-dream-foreground/40'}>
                        At least 1 uppercase letter
                      </span>
                    </li>
                    <li className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 rounded-full ${
                        passwordRequirements.number ? 'bg-green-500/20 text-green-500' : 'bg-dream-foreground/10 text-dream-foreground/30'
                      }`}>
                        {passwordRequirements.number && <Check className="w-3 h-3" />}
                      </span>
                      <span className={passwordRequirements.number ? 'text-dream-foreground/80' : 'text-dream-foreground/40'}>
                        At least 1 number
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mb-8">
                <label htmlFor="confirmPassword" className="block text-dream-foreground/80 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="input-dream w-full"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-red-400 text-sm">Passwords don't match</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white font-medium py-3 rounded-lg hover:shadow-neon transition-all duration-300 flex justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-dream-foreground/70">
                Already have an account?{" "}
                <Link to="/login" className="text-dream-accent1 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
