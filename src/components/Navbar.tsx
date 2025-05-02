
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Mock authentication state (will be replaced with actual auth later)
  const isAuthenticated = false;
  const isAdmin = false;

  return (
    <nav className="border-b py-4 bg-white sticky top-0 z-10">
      <div className="container-blog flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-serif font-bold">
            Verse
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-black">
            Home
          </Link>
          <div className="relative group">
            <Link to="/categories" className="text-gray-600 hover:text-black">
              Categories
            </Link>
          </div>
          <div className="flex items-center">
            <Search className="h-5 w-5 text-gray-500 cursor-pointer hover:text-black" />
          </div>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b animate-fade-in">
          <div className="container-blog py-4 flex flex-col space-y-4">
            <Link 
              to="/" 
              className="block py-2 text-gray-600 hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/categories" 
              className="block py-2 text-gray-600 hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              Categories
            </Link>
            <div className="pt-2 border-t">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="default" className="w-full" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
