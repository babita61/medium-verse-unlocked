
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/sonner";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    coverImage: string;
    category: string;
    authorName: string;
    authorAvatar?: string;
    readTime: number;
    createdAt: string;
    slug: string;
  };
  featured?: boolean;
  className?: string;
}

const PostCard = ({ post, featured = false, className }: PostCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if post is bookmarked by current user
    const checkBookmark = async () => {
      if (!user || !post.id) return;
      
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking bookmark status:", error);
      } else {
        setIsBookmarked(!!data);
      }
    };

    checkBookmark();
  }, [user, post.id]);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to bookmark posts");
      return;
    }
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("bookmarks")
          .insert([{ post_id: post.id, user_id: user.id }]);
        
        if (error) throw error;
        setIsBookmarked(true);
        toast.success("Post bookmarked");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update bookmark");
      console.error("Bookmark error:", error);
    }
  };

  // Function to get category color
  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    return `bg-category-${lowerCategory}`;
  };

  return (
    <div className={cn(
      "post-card-hover group",
      featured ? "featured-post border-primary" : "",
      className
    )}>
      <Link to={`/post/${post.slug}`} className="block h-full">
        <div className={`h-full flex ${featured ? 'flex-col md:flex-row' : 'flex-col'} gap-4`}>
          {/* Image */}
          <div className={cn(
            "overflow-hidden rounded-md relative",
            featured ? "md:w-1/2 h-56" : "h-48"
          )}>
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 left-3">
              <span className={`category-badge ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className={cn(
            "flex flex-col justify-between",
            featured ? "md:w-1/2" : ""
          )}>
            <div>
              <h3 className={cn(
                "font-serif font-bold tracking-tight mb-2",
                featured ? "text-2xl" : "text-xl"
              )}>
                {post.title}
              </h3>
              <p className="text-gray-600 line-clamp-2 mb-3">{post.excerpt}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {post.authorAvatar ? (
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                  )}
                  <span className="text-sm text-gray-600">{post.authorName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{post.readTime} min</span>
                </div>
              </div>

              <button 
                onClick={handleBookmarkClick}
                className="text-gray-400 hover:text-primary"
                aria-label="Bookmark post"
              >
                <Bookmark 
                  className="h-5 w-5" 
                  fill={isBookmarked ? "currentColor" : "none"} 
                />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PostCard;
