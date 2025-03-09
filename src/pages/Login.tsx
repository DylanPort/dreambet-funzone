
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import OrbitingParticles from '@/components/OrbitingParticles';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Invalid input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login successful",
        description: "Welcome back to DreamBet!",
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
              <h1 className="text-3xl font-display font-bold mb-2 text-gradient">Welcome Back</h1>
              <p className="text-dream-foreground/70">
                Log in to your DreamBet account
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-dream-foreground/80 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-dream w-full"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="mb-8">
                <label htmlFor="password" className="block text-dream-foreground/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input-dream w-full pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <div className="mt-2 text-right">
                  <Link to="/forgot-password" className="text-dream-accent2 text-sm hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-dream-accent1 to-dream-accent3 text-white font-medium py-3 rounded-lg hover:shadow-neon transition-all duration-300 flex justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                  "Login"
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-dream-foreground/70">
                Don't have an account?{" "}
                <Link to="/register" className="text-dream-accent1 hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
