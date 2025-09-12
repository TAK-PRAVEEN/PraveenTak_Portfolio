import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  Briefcase,
  MessageSquare,
  Github,
  Linkedin,
  Mail,
  Instagram,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navigation = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Sidebar animation
  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        staggerChildren: 0.15,
      },
    },
    exit: {
      x: "-100%",
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Animated Hamburger */}
          <div className="flex items-center space-x-4 md:space-x-8">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="relative md:hidden w-8 h-8 flex flex-col justify-center items-center"
            >
              {/* Top line */}
              <motion.span
                animate={
                  sidebarOpen
                    ? { rotate: 45, y: 0 }
                    : { rotate: 0, y: -6 }
                }
                className="absolute w-6 h-0.5 bg-primary rounded"
                transition={{ duration: 0.3 }}
              />
              {/* Middle line */}
              <motion.span
                animate={{ opacity: sidebarOpen ? 0 : 1 }}
                className="absolute w-6 h-0.5 bg-primary rounded"
                transition={{ duration: 0.3 }}
              />
              {/* Bottom line */}
              <motion.span
                animate={
                  sidebarOpen
                    ? { rotate: -45, y: 0 }
                    : { rotate: 0, y: 6 }
                }
                className="absolute w-6 h-0.5 bg-primary rounded"
                transition={{ duration: 0.3 }}
              />
            </button>

            {/* Logo */}
            <Link to="/" className="">
              <img
                src={`${import.meta.env.BASE_URL}Name.gif`}
                alt="Name Logo"
                className="w-25 h-14"
              />
            </Link>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/">
                <Button
                  variant={location.pathname === "/" ? "default" : "ghost"}
                  size="sm"
                  className="transition-smooth"
                >
                  <User className="w-4 h-4 mr-2" />
                  About
                </Button>
              </Link>
              <Link to="/experience">
                <Button
                  variant={
                    location.pathname === "/experience" ? "default" : "ghost"
                  }
                  size="sm"
                  className="transition-smooth"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Experience
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant={location.pathname === "/contact" ? "default" : "ghost"}
                  size="sm"
                  className="transition-smooth"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side: Social Icons (desktop only) */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://www.instagram.com/tak.praveen04/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Instagram className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://github.com/TAK-PRAVEEN"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Github className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://linkedin.com/in/praveentak/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Linkedin className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="mailto:praveentak715@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Mail className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Sidebar with Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Black overlay with blur */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={toggleSidebar}
            />

            {/* Sidebar */}
            <motion.div
              key="sidebar"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={sidebarVariants}
              className="fixed top-0 left-0 h-full w-64 bg-black/80 backdrop-blur-md shadow-lg z-50 p-6 flex flex-col justify-between"
            >
              {/* Links */}
              <div className="flex flex-col space-y-6 mt-10">
                <motion.div variants={itemVariants}>
                  <Link to="/" onClick={toggleSidebar}>
                    <Button
                      variant={location.pathname === "/" ? "default" : "ghost"}
                      size="lg"
                      className="w-full"
                    >
                      <User className="w-5 h-5 mr-2" />
                      Home
                    </Button>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/experience" onClick={toggleSidebar}>
                    <Button
                      variant={
                        location.pathname === "/experience"
                          ? "default"
                          : "ghost"
                      }
                      size="lg"
                      className="w-full"
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      Experience
                    </Button>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/contact" onClick={toggleSidebar}>
                    <Button
                      variant={
                        location.pathname === "/contact" ? "default" : "ghost"
                      }
                      size="lg"
                      className="w-full"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contact
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Social Icons */}
              <div className="flex justify-around mt-10">
                {[
                  { href: "https://www.instagram.com/tak.praveen04/", icon: Instagram },
                  { href: "https://github.com/TAK-PRAVEEN", icon: Github },
                  { href: "https://linkedin.com/in/praveentak/", icon: Linkedin },
                  { href: "mailto:praveentak715@gmail.com", icon: Mail },
                ].map(({ href, icon: Icon }, i) => (
                  <motion.a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={itemVariants}
                  >
                    <Icon className="w-6 h-6 text-primary hover:scale-110 transition-transform" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
