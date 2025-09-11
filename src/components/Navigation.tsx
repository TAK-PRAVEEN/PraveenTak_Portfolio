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
  Menu,
  X,
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle mobile menu open/close
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
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
                  variant={location.pathname === "/experience" ? "default" : "ghost"}
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

          {/* Mobile menu toggle button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-primary" />
              )}
            </button>
          </div>

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

      {/* Mobile menu panel */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex flex-col items-center space-y-4 py-6">
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="lg"
              className="text-glow"
            >
              <User className="w-5 h-5 mr-2" />
              Home
            </Button>
          </Link>
          <Link to="/experience" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant={location.pathname === "/experience" ? "default" : "ghost"}
              size="lg"
              className="text-glow"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              Experience
            </Button>
          </Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
            <Button
              variant={location.pathname === "/contact" ? "default" : "ghost"}
              size="lg"
              className="text-glow"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Contact
            </Button>
          </Link>
        </div>
      </div>

      <style>
        {`
          /* Glow text effect */
          .text-glow {
            color: #0ea5e9; /* Tailwind sky-500 */
            text-shadow:
              0 0 5px #0ea5e9,
              0 0 10px #0ea5e9,
              0 0 20px #0ea5e9,
              0 0 40px #0ea5e9;
          }
        `}
      </style>
    </nav>
  );
};

export default Navigation;
