import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, KeyRound, AlertCircle, Zap, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for access denied error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('error') === 'access_denied') {
      setError("Access denied. Only administrators are allowed to access this system.");
      // Clear the error from URL
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const onSubmit = async (data) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data.email, data.password);
      navigate("/admin");
    } catch (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-blue-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Zap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Lab System</h1>
            <p className="text-sm text-muted-foreground">IoT Management Portal</p>
          </div>

          {/* Content Area with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="rounded-xl border bg-card p-6 shadow-lg backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">Admin Access</h2>
                    <p className="text-sm text-muted-foreground">Enter your admin credentials</p>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          className="pl-10"
                          {...register("password")}
                        />
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      This portal is exclusively for admin users. Unauthorized access is prohibited.
                    </p>
                  </form>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <div className="flex justify-center items-center">
              <ShieldAlert size={16} className="mr-1 text-primary" />
              <span>Admin access only. Unauthorized access is prohibited.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 