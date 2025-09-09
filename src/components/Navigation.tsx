import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Briefcase, MessageSquare, Github, Linkedin, Mail, Instagram } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="">
              <img src="public/Name.gif" alt="" className="w-25 h-14"/>
            </Link>
            
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



          <div className="flex items-center space-x-4">
            <a href="https://www.instagram.com/tak.praveen04/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="hover-scale">
                <Instagram className="w-4 h-4" />
              </Button>
            </a>

            <a href="https://github.com/TAK-PRAVEEN" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="hover-scale">
                <Github className="w-4 h-4" />
              </Button>
            </a>

            <a href="https://linkedin.com/in/praveentak/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="hover-scale">
                <Linkedin className="w-4 h-4" />
              </Button>
            </a>

            <a href="mailto:praveentak715@gmail.com" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="hover-scale">
                <Mail className="w-4 h-4" />
              </Button>
            </a>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;