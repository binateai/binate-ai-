import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, AlertTriangle } from "lucide-react";
import binateLogoPath from "@assets/Binate Ai.png";
// Import logo - we'll use a direct path for now

// Define a schema for the beta signup form
const betaSignupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type BetaSignupFormValues = z.infer<typeof betaSignupSchema>;

export default function LandingPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<BetaSignupFormValues>({
    resolver: zodResolver(betaSignupSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: BetaSignupFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle duplicate email case
        if (response.status === 409) {
          toast({
            title: "Already signed up",
            description: result.message || "You're already on our waitlist! We'll be in touch soon.",
            variant: "default",
          });
          setSubmitted(true);
          return;
        }

        // Handle other errors
        throw new Error(`Failed to sign up: ${result.message || "Unknown error"}`);
      }

      // Show success message
      toast({
        title: "Success!",
        description: "Thanks for signing up! We'll be in touch soon.",
        variant: "default",
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error signing up:", error);
      toast({
        title: "Error",
        description: "There was a problem signing up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 to-amber-700 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="animate-pulse">●</span>
          <p>BETA RELEASE: Experience our autonomous AI for free during the 3-week trial period</p>
        </div>
      </div>
      <header className="border-b border-gray-800 p-4 md:p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="h-12 w-auto relative">
            <img 
              src={binateLogoPath} 
              alt="Binate AI Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-['Poppins'] bg-gradient-to-r from-teal-400 to-purple-500 bg-clip-text text-transparent">
              Binate AI
            </h1>
            <div className="text-xs px-2 py-0.5 bg-red-900/70 text-amber-300 rounded-full font-semibold border border-amber-700/50 animate-pulse">
              BETA
            </div>
          </div>
        </div>
        <div className="flex space-x-4">
          <Link href="/qr">
            <Button variant="ghost" className="text-white hover:text-teal-300 hover:bg-gray-800">QR Code</Button>
          </Link>
          <Link href="/app/dashboard">
            <Button variant="ghost" className="text-white hover:text-purple-300 hover:bg-gray-800">Go to App</Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 grid md:grid-cols-2 gap-8 p-4 md:p-8 lg:p-12">
        {/* Left side - Hero Text */}
        <div className="flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-['Montserrat'] font-black mb-6 leading-tight tracking-tight">
            Your <span className="bg-gradient-to-r from-teal-400 to-purple-500 bg-clip-text text-transparent">Autonomous AI</span> 
            <br /> Executive Agent
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-300 font-light">
            Experience true AI autonomy with an intelligent agent that adapts to your behavior, remembers your preferences, and works independently on your behalf without requiring constant instructions.
          </p>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl mb-8 border border-gray-700 shadow-lg">
            <h3 className="font-['Poppins'] font-semibold text-xl mb-4 text-teal-300">Autonomous AI Features</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                <span className="text-gray-300">Your agent reads, categorizes & replies to emails without your constant input</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-300">Autonomous meeting scheduling & AI-generated preparation notes</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                <span className="text-gray-300">Self-initiated invoice creation & payment follow-ups without prompting</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-300">Your AI learns your behavior to automate task & lead management</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right side - Signup Form */}
        <div className="flex flex-col justify-center">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-md mx-auto w-full">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-['Poppins'] font-bold mb-2 text-white">Thanks for signing up!</h3>
                <p className="text-gray-300 mb-6">
                  We'll email you when your exclusive access is ready.
                </p>
                <Button
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-700 text-white"
                  onClick={() => setSubmitted(false)}
                >
                  Sign up another email
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-['Poppins'] font-bold mb-2 text-white">Get Early Access</h3>
                <p className="text-gray-300 mb-6">
                  Join our exclusive beta waitlist to be among the first to experience the future of autonomous AI assistants.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Email</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your.email@example.com" 
                              {...field} 
                              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-teal-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Join the Waitlist"
                      )}
                    </Button>
                    <div className="mt-4 text-sm flex items-start gap-2 p-4 rounded-md bg-amber-950/40 border border-amber-800/50">
                      <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-amber-200">
                        <p className="font-medium mb-1">Beta Program Benefits:</p>
                        <ul className="space-y-1 pl-1">
                          <li>• Free 3-week trial of all premium features</li>
                          <li>• Early bird pricing when we launch</li>
                          <li>• Priority support from our team</li>
                          <li>• In exchange for your regular feedback</li>
                        </ul>
                      </div>
                    </div>
                  </form>
                </Form>
              </>
            )}
          </div>
          <div className="mt-8 text-center text-sm text-gray-400">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-6 text-center text-gray-400 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
          <div className="bg-red-900/20 text-amber-300 border border-amber-700/30 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            BETA VERSION
          </div>
          <p>© {new Date().getFullYear()} Binate AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}