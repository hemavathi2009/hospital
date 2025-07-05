import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search } from "lucide-react";
import Navigation from "../components/organisms/Navigation";
import Footer from "../components/organisms/Footer";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      {/* Modern Hero Section with Consistent Design */}
      <section className="relative flex-grow flex items-center justify-center overflow-hidden">
        {/* Layered background elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
          
          {/* Background patterns */}
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.svg')] opacity-5"></div>
          
          {/* Animated blobs */}
          <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-primary/5 mix-blend-overlay animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-secondary/5 mix-blend-overlay animate-blob"></div>
        </div>
        
        <div className="container-hospital relative z-10">
          <div className="max-w-xl mx-auto text-center py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-8">
                <span className="text-5xl font-bold text-primary">404</span>
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold mb-4 text-foreground"
            >
              Page Not Found
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl text-muted-foreground mb-8"
            >
              The page you're looking for doesn't exist or has been moved.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/" className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
                <Home className="w-5 h-5 mr-2" />
                Return Home
              </Link>
              
              <button onClick={() => window.history.back()} className="inline-flex items-center px-6 py-3 rounded-lg bg-secondary/10 text-foreground hover:bg-secondary/20 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </button>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default NotFound;
