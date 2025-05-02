
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/types";
import PostCard from "./PostCard";

const RecentPosts = () => {
  const { data: recentPosts, isLoading } = useQuery({
    queryKey: ["recent-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data as Post[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-10 bg-gray-50">
        <div className="container-blog">
          <h2 className="text-2xl font-serif font-bold mb-6">Recent Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recentPosts || recentPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-gray-50">
      <div className="container-blog">
        <h2 className="text-2xl font-serif font-bold mb-6">Recent Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recentPosts.map((post) => (
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
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentPosts;
