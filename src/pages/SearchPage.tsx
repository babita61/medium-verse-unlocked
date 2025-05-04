
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';

const SearchPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';

  const { data: posts, isLoading } = useQuery({
    queryKey: ['search-posts', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .rpc('search_posts', { search_term: searchQuery })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!searchQuery.trim(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow py-8">
        <div className="container-blog">
          <h1 className="text-3xl font-serif font-bold mb-8 dark:text-white">
            Search Results for "{searchQuery}"
          </h1>

          {isLoading ? (
            <div className="space-y-6">
              {Array(3).fill(null).map((_, idx) => (
                <div key={idx} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-48 rounded-lg" />
              ))}
            </div>
          ) : !posts?.length ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No articles found for "{searchQuery}"
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Try adjusting your search terms or browse our categories.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    title: post.title,
                    excerpt: post.excerpt || post.content?.substring(0, 150) + "..." || "",
                    coverImage: post.cover_image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
                    category: post.category?.name || 'Uncategorized',
                    authorName: "Babita",
                    authorAvatar: post.author?.avatar_url,
                    createdAt: new Date(post.created_at).toISOString(),
                    readTime: post.read_time,
                    slug: post.slug,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
