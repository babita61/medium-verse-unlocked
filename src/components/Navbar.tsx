
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="border-b py-4 bg-white sticky top-0 z-10">
      <div className="container-blog flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-serif font-bold">
            Babita Writes
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
          {user ? (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative w-8 h-8 rounded-full p-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {profile?.full_name || profile?.username || user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/register">
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
              {user ? (
                <div className="flex flex-col space-y-2">
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full" size="sm">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full" size="sm">
                      Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
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
