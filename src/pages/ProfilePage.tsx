
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Post } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostCard from "@/components/PostCard";

const ProfilePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
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

  const { data: bookmarks, isLoading: bookmarksLoading } = useQuery({
    queryKey: ["user-bookmarks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          *,
          post:posts(
            *,
            author:profiles(*),
            category:categories(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container mx-auto max-w-4xl px-4 animate-pulse">
            <div className="flex items-center mb-8">
              <div className="h-20 w-20 rounded-full bg-gray-200 mr-4"></div>
              <div>
                <div className="h-6 w-40 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-100 rounded mb-8"></div>
            <div className="grid gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !profile) {
    return null; // This will be caught by the useEffect redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden mr-4">
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-gray-600">@{profile.username}</p>
                <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs text-gray-800 mt-1">
                  {profile.role}
                </span>
              </div>
            </div>

            {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {profile.website}
              </a>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-4">Your Bookmarks</h2>
          {bookmarksLoading ? (
            <div className="animate-pulse space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : bookmarks && bookmarks.length > 0 ? (
            <div className="space-y-6">
              {bookmarks.map((bookmark) => (
                <PostCard
                  key={bookmark.id}
                  post={{
                    ...bookmark.post,
                    category: bookmark.post.category?.name || '',
                    authorName:
                      bookmark.post.author?.full_name ||
                      bookmark.post.author?.username ||
                      "Unknown",
                    authorAvatar: bookmark.post.author?.avatar_url,
                    createdAt: new Date(bookmark.post.created_at).toISOString(),
                    readTime: bookmark.post.read_time,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You haven't bookmarked any posts yet.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
