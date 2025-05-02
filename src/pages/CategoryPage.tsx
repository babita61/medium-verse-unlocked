
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category, Post } from '@/types';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostCard from '@/components/PostCard';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Category;
    },
    enabled: !!slug
  });

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ['category-posts', slug],
    queryFn: async () => {
      if (!category) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('category_id', category.id)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!category
  });

  if (loadingCategory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container-blog animate-pulse">
            <div className="h-10 w-1/3 bg-gray-200 rounded mb-8"></div>
            <div className="h-6 w-2/3 bg-gray-200 rounded mb-10"></div>
            <div className="grid gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded"></div>
              ))}
            </div>
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
        <div className="container-blog">
          <div className={`mb-10 p-6 rounded-lg bg-category-${slug}`}>
            <h1 className="text-3xl font-serif font-bold">{category?.name}</h1>
            {category?.description && (
              <p className="mt-2 text-lg opacity-90">{category.description}</p>
            )}
          </div>

          {loadingPosts ? (
            <div className="animate-pulse space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={{
                  ...post,
                  category: category,
                  authorName: post.author?.full_name || post.author?.username || 'Unknown',
                  authorAvatar: post.author?.avatar_url || undefined,
                  createdAt: new Date(post.created_at).toISOString(),
                  readTime: post.read_time,
                }} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-medium text-gray-600">No posts available in this category yet.</h3>
              <p className="mt-2 text-gray-500">Check back later for new content.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
