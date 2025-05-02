
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/types";
import PostCard from "./PostCard";

const FeaturedPosts = () => {
  const { data: featuredPosts, isLoading } = useQuery({
    queryKey: ["featured-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .eq("published", true)
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(2);

      if (error) throw error;
      
      if (data.length === 0) {
        // If no featured posts, get the most recent posts instead
        const { data: recentPosts, error: recentError } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles(*),
            category:categories(*)
          `)
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(2);
          
        if (recentError) throw recentError;
        return recentPosts as Post[];
      }
      
      return data as Post[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="container-blog">
          <h2 className="text-2xl font-serif font-bold mb-6">Featured Posts</h2>
          <div className="space-y-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!featuredPosts || featuredPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="container-blog">
        <h2 className="text-2xl font-serif font-bold mb-6">Featured Posts</h2>
        <div className="space-y-8">
          {featuredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={{
                id: post.id,
                title: post.title,
                excerpt: post.excerpt || post.content.substring(0, 150) + "...",
                coverImage: post.cover_image || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
                category: post.category?.name || "Uncategorized",
                authorName: post.author?.full_name || post.author?.username || "Unknown",
                authorAvatar: post.author?.avatar_url,
                readTime: post.read_time,
                createdAt: new Date(post.created_at).toISOString(),
                slug: post.slug,
              }} 
              featured={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPosts;
