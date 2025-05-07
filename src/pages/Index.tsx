
import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedPosts from "@/components/FeaturedPosts";
import RecentPosts from "@/components/RecentPosts";
import CategoryList from "@/components/CategoryList";
import Footer from "@/components/Footer";
import { useTheme } from "@/context/ThemeContext";

const Index = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark-theme bg-background text-foreground' : 'light-theme bg-background text-foreground'}`}>
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedPosts />
        <CategoryList />
        <RecentPosts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
