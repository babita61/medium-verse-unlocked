
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AdminDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [postsResult, categoriesResult, commentsResult] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact" }),
        supabase.from("categories").select("id", { count: "exact" }),
        supabase.from("comments").select("id", { count: "exact" }),
      ]);

      return {
        posts: postsResult.count || 0,
        categories: categoriesResult.count || 0,
        comments: commentsResult.count || 0,
      };
    },
    enabled: !!profile && profile.role === "admin",
  });

  React.useEffect(() => {
    // Redirect if not admin
    if (!authLoading && (!user || (profile && profile.role !== "admin"))) {
      navigate("/");
    }
  }, [authLoading, user, profile, navigate]);

  if (authLoading || !profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container mx-auto px-4">
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Posts</h3>
              <p className="text-3xl font-bold">
                {statsLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats?.posts
                )}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/admin/posts")}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Manage posts →
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Categories</h3>
              <p className="text-3xl font-bold">
                {statsLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats?.categories
                )}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/admin/categories")}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Manage categories →
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Comments</h3>
              <p className="text-3xl font-bold">
                {statsLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats?.comments
                )}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/admin/comments")}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Manage comments →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/admin/posts")}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded"
              >
                Create New Post
              </button>
              <button
                onClick={() => navigate("/admin/categories")}
                className="bg-green-100 hover:bg-green-200 text-green-800 py-3 px-4 rounded"
              >
                Add Category
              </button>
              <button
                onClick={() => navigate("/admin/comments")}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 py-3 px-4 rounded"
              >
                Review Comments
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
