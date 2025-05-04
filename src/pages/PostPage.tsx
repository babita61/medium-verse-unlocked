import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post, Comment } from "@/types";
import DOMPurify from "dompurify"; // You'll need to install this: npm install dompurify
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageSquare, Bookmark, BookmarkCheck } from "lucide-react";

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [commentContent, setCommentContent] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [sanitizedContent, setSanitizedContent] = useState("");

  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (error) throw error;
      return data as Post;
    },
    enabled: !!slug,
  });

  // Sanitize content when post loads
  useEffect(() => {
    if (post?.content) {
      setSanitizedContent(DOMPurify.sanitize(post.content));
    }
  }, [post?.content]);

  // Check if the user has bookmarked this post
  useQuery({
    queryKey: ["post-bookmark", slug, user?.id],
    queryFn: async () => {
      if (!user || !post) return null;

      const { data, error } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
      setIsBookmarked(!!data);
      return data;
    },
    enabled: !!user && !!post,
  });

  // Check if the user has liked this post and get likes count
  useQuery({
    queryKey: ["post-reactions", slug, user?.id],
    queryFn: async () => {
      if (!post) return { userLiked: false, count: 0 };

      // Get total likes count
      const { count, error: countError } = await supabase
        .from("reactions")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("reaction_type", "like");

      if (countError) throw countError;
      
      setLikesCount(count || 0);

      // Check if user has liked the post
      if (user) {
        const { data, error } = await supabase
          .from("reactions")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .eq("reaction_type", "like")
          .single();

        if (error && error.code !== "PGRST116") throw error;
        setIsLiked(!!data);
        return { userLiked: !!data, count: count || 0 };
      }

      return { userLiked: false, count: count || 0 };
    },
    enabled: !!post,
  });

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ["post-comments", slug],
    queryFn: async () => {
      if (!post) return [];

      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          user:profiles(*)
        `)
        .eq("post_id", post.id)
        .is("parent_id", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!post,
  });

  // Mutation to add a comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("You must be logged in to comment");
      if (!post) throw new Error("Post not found");
      if (!content.trim()) throw new Error("Comment cannot be empty");

      const { error, data } = await supabase
        .from("comments")
        .insert([
          {
            post_id: post.id,
            user_id: user.id,
            content,
          },
        ])
        .select(`
          *,
          user:profiles(*)
        `);

      if (error) throw error;
      return data[0] as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", slug] });
      setCommentContent("");
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  // Mutation to toggle bookmark
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to bookmark posts");
      if (!post) throw new Error("Post not found");

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error removing bookmark:", error);
          throw error;
        }
        return false;
      } else {
        // Add bookmark
        const { error } = await supabase
          .from("bookmarks")
          .insert([
            {
              post_id: post.id,
              user_id: user.id,
            },
          ]);

        if (error) {
          console.error("Error adding bookmark:", error);
          throw error;
        }
        return true;
      }
    },
    onSuccess: (bookmarked) => {
      setIsBookmarked(bookmarked);
      queryClient.invalidateQueries({ queryKey: ["post-bookmark", slug, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-bookmarks", user?.id] });
      toast.success(bookmarked ? "Post bookmarked" : "Bookmark removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update bookmark");
    },
  });

  // Mutation to toggle like
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to like posts");
      if (!post) throw new Error("Post not found");

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .eq("reaction_type", "like");

        if (error) throw error;
        return false;
      } else {
        // Add like
        const { error } = await supabase
          .from("reactions")
          .insert([
            {
              post_id: post.id,
              user_id: user.id,
              reaction_type: "like",
            },
          ]);

        if (error) throw error;
        return true;
      }
    },
    onSuccess: (liked) => {
      setIsLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
      queryClient.invalidateQueries({ queryKey: ["post-reactions", slug, user?.id] });
      toast.success(liked ? "Post liked" : "Like removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update like");
    },
  });

  const handleAddComment = () => {
    if (commentContent.trim()) {
      addCommentMutation.mutate(commentContent);
    } else {
      toast.error("Comment cannot be empty");
    }
  };

  const handleToggleBookmark = () => {
    if (!user) {
      toast.error("Please sign in to bookmark posts");
      return;
    }
    toggleBookmarkMutation.mutate();
  };

  const handleToggleLike = () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    toggleLikeMutation.mutate();
  };

  const scrollToComments = () => {
    commentInputRef.current?.scrollIntoView({ behavior: "smooth" });
    commentInputRef.current?.focus();
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container-blog mx-auto max-w-4xl px-4 animate-pulse">
            <div className="h-8 w-2/3 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 bg-gray-100 rounded mb-8"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <p>The post you're looking for doesn't exist or has been removed.</p>
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
        <article className="container mx-auto max-w-4xl px-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
            <div className="flex items-center text-gray-600 text-sm mb-4">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>{post.read_time} min read</span>
              <span className="mx-2">•</span>
              <span>
                {post.category ? post.category.name : "Uncategorized"}
              </span>
            </div>

            {/* Engagement buttons */}
            <div className="flex items-center gap-5 mb-4">
              <button 
                onClick={handleToggleLike}
                className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500' : 'fill-none'}`} />
                <span>{likesCount}</span>
              </button>
              
              <button 
                onClick={scrollToComments}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
              >
                <MessageSquare className="h-5 w-5" />
                <span>{comments?.length || 0}</span>
              </button>
              
              <button 
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1 ${isBookmarked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </button>
            </div>

            {post.cover_image && (
              <div className="aspect-video w-full mb-6 rounded-lg overflow-hidden">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </header>

          <div 
            className="prose max-w-none" 
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex items-center mb-6">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt="Babita"
                  className="w-10 h-10 rounded-full mr-4"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-4"></div>
              )}
              <div>
                <p className="font-medium">Posted by Babita</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-6">Comments</h3>
            
            {user ? (
              <div className="mb-8">
                <Textarea
                  ref={commentInputRef}
                  placeholder="Add your comment..."
                  className="min-h-28 mb-2"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={addCommentMutation.isPending || !commentContent.trim()}
                >
                  {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md mb-8">
                <p className="text-gray-600">Please sign in to leave a comment.</p>
              </div>
            )}
            
            {loadingComments ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 w-1/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-10 bg-gray-100 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 pb-4">
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden mr-2">
                        {comment.user?.avatar_url && (
                          <img
                            src={comment.user.avatar_url}
                            alt={comment.user?.username}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">
                          {comment.user?.full_name || comment.user?.username}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PostPage;