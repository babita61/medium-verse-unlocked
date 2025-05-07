
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import DOMPurify from "dompurify";
import PodcastPlayer from "@/components/PodcastPlayer";
import StickyNotes from "@/components/StickyNotes";
import RelatedPosts from "@/components/RelatedPosts";
import SubscribeForm from "@/components/SubscribeForm";
import PostHeader from "@/components/post/PostHeader";
import AuthorSection from "@/components/post/AuthorSection";
import CommentSection from "@/components/post/CommentSection";
import { Post } from "@/types";

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [sanitizedContent, setSanitizedContent] = useState("");
  const [showPodcastPlayer, setShowPodcastPlayer] = useState(false);
  const [showSubscribeForm, setShowSubscribeForm] = useState(false);

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

  // Fetch categories for subscribe form
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
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

  const handleToggleBookmark = () => {
    toggleBookmarkMutation.mutate();
  };

  const handleToggleLike = () => {
    toggleLikeMutation.mutate();
  };

  const scrollToComments = () => {
    commentInputRef.current?.scrollIntoView({ behavior: "smooth" });
    commentInputRef.current?.focus();
  };

  const togglePodcastPlayer = () => {
    setShowPodcastPlayer(prev => !prev);
  };

  const toggleSubscribeForm = () => {
    setShowSubscribeForm(prev => !prev);
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container mx-auto max-w-4xl px-4 animate-pulse">
            <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded mb-8"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
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
          <PostHeader 
            post={post}
            isBookmarked={isBookmarked}
            isLiked={isLiked}
            likesCount={likesCount}
            commentsCount={0} // This will be updated from CommentSection
            onToggleBookmark={handleToggleBookmark}
            onToggleLike={handleToggleLike}
            onScrollToComments={scrollToComments}
            onTogglePodcastPlayer={togglePodcastPlayer}
            onToggleSubscribeForm={toggleSubscribeForm}
            showPodcastPlayer={showPodcastPlayer}
          />

          {/* Podcast player */}
          {showPodcastPlayer && (
            <div 
              id="podcast-player" 
              className="mb-8 animate-fade-in"
            >
              <PodcastPlayer 
                content={post?.content || ""} 
                title={post?.title || ""}
              />
            </div>
          )}

          <div 
            className="prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground max-w-none" 
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Subscribe form modal */}
          {showSubscribeForm && categories && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background max-w-md w-full mx-4 rounded-lg">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-medium">Subscribe to Updates</h3>
                  <button className="p-1" onClick={toggleSubscribeForm}>✕</button>
                </div>
                <div className="p-4">
                  <SubscribeForm categories={categories} />
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-muted">
            <AuthorSection author={post.author} />
            <CommentSection post={post} commentInputRef={commentInputRef} />
          </div>
        </article>
        
        {/* Related posts */}
        <div className="container mx-auto max-w-4xl px-4 mt-16">
          {post && (
            <RelatedPosts 
              currentPostId={post.id} 
              currentPostContent={post.content || ""}
            />
          )}
        </div>
        
        {/* Add sticky notes feature */}
        {post && <StickyNotes postId={post.id} />}
      </main>
      <Footer />
    </div>
  );
};

export default PostPage;
