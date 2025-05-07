
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/types";
import { Loader2 } from "lucide-react";
import PostCard from "./PostCard";
import { toast } from "@/components/ui/sonner";

interface RelatedPostsProps {
  currentPostId: string;
  currentPostContent: string;
}

const RelatedPosts = ({ currentPostId, currentPostContent }: RelatedPostsProps) => {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        setIsLoading(true);

        // First fetch all posts excluding current post
        const { data: allPosts, error } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles(*),
            category:categories(*)
          `)
          .eq("published", true)
          .neq("id", currentPostId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!allPosts || allPosts.length === 0) {
          setRelatedPosts([]);
          setIsLoading(false);
          return;
        }

        // Extract data needed for the AI to analyze
        const allPostTitles = allPosts.map(post => post.title);
        const allPostContents = allPosts.map(post => post.content || "");
        const allPostSlugs = allPosts.map(post => post.slug);

        // Call Supabase Edge Function for related posts
        const response = await supabase.functions.invoke("ai-helper", {
          body: {
            action: "related",
            content: currentPostContent,
            additionalData: {
              allPostTitles,
              allPostContents,
              allPostSlugs
            }
          }
        });

        if (response.error) throw new Error(response.error.message);

        const relatedIndices = response.data.result || [];
        
        // Map the indices to actual posts
        const relatedPostsData = relatedIndices
          .map((index: number) => allPosts[index])
          .filter(Boolean)
          .slice(0, 3);

        setRelatedPosts(relatedPostsData);
      } catch (error: any) {
        console.error("Error fetching related posts:", error);
        // Fallback to most recent posts if AI fails
        const { data } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles(*),
            category:categories(*)
          `)
          .eq("published", true)
          .neq("id", currentPostId)
          .order("created_at", { ascending: false })
          .limit(3);

        setRelatedPosts(data || []);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentPostId && currentPostContent) {
      fetchRelatedPosts();
    }
  }, [currentPostId, currentPostContent]);

  if (!currentPostId || !currentPostContent) {
    return null;
  }

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold mb-4">Related Posts</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : relatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                title: post.title,
                excerpt: post.excerpt || "",
                coverImage: post.cover_image || "",
                category: post.category?.name || "Uncategorized",
                authorName: post.author?.full_name || post.author?.username || "Unknown",
                authorAvatar: post.author?.avatar_url,
                readTime: post.read_time || 5,
                createdAt: post.created_at,
                slug: post.slug
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-6">
          No related posts found.
        </p>
      )}
    </div>
  );
};

export default RelatedPosts;
