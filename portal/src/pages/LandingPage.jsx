import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, Phone, MapPin, Shield, Users, Clock, ArrowRight, ChevronRight, DropletIcon, SparklesIcon, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    if (isAuthenticated) {
      navigate("/admin");
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: SparklesIcon,
      title: "Premium Quality",
      description: "We use high-quality products and advanced techniques for a spotless finish every time.",
    },
    {
      icon: Clock,
      title: "Quick Service",
      description: "Efficient and fast service that respects your time while delivering excellent results.",
    },
    {
      icon: CheckCircle,
      title: "Satisfaction Guaranteed",
      description: "We're not happy until you're completely satisfied with the results of our service.",
    },
    {
      icon: Shield,
      title: "Vehicle Protection",
      description: "Our methods are gentle on your car's paint and finish, ensuring no damage during cleaning.",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Happy Customers" },
    { value: "15+", label: "Service Options" },
    { value: "24/7", label: "Online Booking" },
    { value: "100%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Professional Car Wash</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Services</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
          </nav>
          <ThemeToggle/>
          <div className="flex items-center gap-3">
            <Button size="sm" className="flex items-center gap-1" onClick={handleLoginRedirect}>
              {isAuthenticated ? "Dashboard" : "Admin Login"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-blue-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 bg-primary/10 text-primary">
                Professional Car Wash Services
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Get Your Car <span className="text-primary">Sparkling Clean</span>
              </h1>
              <p className="text-lg">
                Our premium car wash services provide exceptional care for your vehicle, leaving it looking brand new with our professional cleaning techniques.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="group" onClick={() => navigate("/login")}>Book Now <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button>
                <Button size="lg" variant="outline" onClick={() => window.open("tel:+252612995362")}>Call Us</Button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute inset-0 rounded-2xl transform rotate-3 bg-primary/20"></div>
              <img src="/logo.png" alt="Car being washed" className="relative z-10 rounded-2xl shadow-lg object-cover w-full h-[400px]" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">
              Services that <span className="text-primary">Shine</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto">
              We offer a range of professional car wash services to keep your vehicle looking its best, inside and out.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="p-3 rounded-lg inline-block mb-4 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready for a Spotless Shine?</h2>
            <p className="mb-8">Book your car wash appointment today and experience the difference of professional cleaning service.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>Book an Appointment</Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={() => window.open("tel:+252612995362")}>Call Us Now</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Car className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">Professional Car Wash</h2>
              </div>
              <p>We provide premium car wash and detailing services to keep your vehicle looking its best all year round.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary">Basic Wash</a></li>
                <li><a href="#" className="hover:text-primary">Deluxe Wash</a></li>
                <li><a href="#" className="hover:text-primary">Premium Detail</a></li>
                <li><a href="#" className="hover:text-primary">Interior Cleaning</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary">Booking Help</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +252 612 995 362</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 123 Car Wash St, Mogadishu</li>
                <li>info@carwash.com</li>
                <li>Mon-Sun: 8AM - 8PM</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Professional Car Wash Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
