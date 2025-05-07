
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="font-serif text-xl font-bold text-foreground">Babita Writes</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Exploring life, literature, and everything in between through thoughtful prose and poetry.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:gap-16">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors">Categories</Link>
                </li>
                <li>
                  <Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors">Profile</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Email</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {currentYear} Babita Writes. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
