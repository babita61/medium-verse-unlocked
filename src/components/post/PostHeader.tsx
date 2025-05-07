
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Bookmark, BookmarkCheck, Headphones } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types";
import AISummary from "@/components/AISummary";
import MoodSelector from "@/components/MoodSelector";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PostHeaderProps {
  post: Post;
  isBookmarked: boolean;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  onToggleBookmark: () => void;
  onToggleLike: () => void;
  onScrollToComments: () => void;
  onTogglePodcastPlayer: () => void;
  onToggleSubscribeForm: () => void;
  showPodcastPlayer: boolean;
}

const PostHeader = ({
  post,
  isBookmarked,
  isLiked,
  likesCount,
  commentsCount,
  onToggleBookmark,
  onToggleLike,
  onScrollToComments,
  onTogglePodcastPlayer,
  onToggleSubscribeForm,
  showPodcastPlayer
}: PostHeaderProps) => {
  const { user } = useAuth();

  const handleToggleLike = () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    onToggleLike();
  };

  const handleToggleBookmark = () => {
    if (!user) {
      toast.error("Please sign in to bookmark posts");
      return;
    }
    onToggleBookmark();
  };

  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold mb-2 text-foreground">{post?.title}</h1>
      <div className="flex items-center text-muted-foreground text-sm mb-4">
        <span>{new Date(post?.created_at || "").toLocaleDateString()}</span>
        <span className="mx-2">•</span>
        <span>{post?.read_time} min read</span>
        <span className="mx-2">•</span>
        <span>
          {post?.category ? post.category.name : "Uncategorized"}
        </span>
      </div>
      
      {/* AI Summary Button */}
      {post?.content && <AISummary postContent={post.content} />}
      
      {/* Mood selector */}
      <div className="mb-4 border-t border-b py-3 border-border">
        <p className="text-center text-sm text-muted-foreground mb-2">Reading experience:</p>
        <MoodSelector postId={post?.id || ""} />
      </div>

      {/* Engagement buttons */}
      <div className="flex flex-wrap items-center gap-5 mb-4">
        <button 
          onClick={handleToggleLike}
          className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500' : 'fill-none'}`} />
          <span>{likesCount}</span>
        </button>
        
        <button 
          onClick={onScrollToComments}
          className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
        >
          <MessageSquare className="h-5 w-5" />
          <span>{commentsCount}</span>
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

        {/* Listen as podcast button */}
        <button
          onClick={onTogglePodcastPlayer}
          className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          aria-expanded={showPodcastPlayer}
          aria-controls="podcast-player"
        >
          <Headphones className="h-5 w-5" />
          <span className="sm:inline hidden">Listen as podcast</span>
        </button>

        {/* Subscribe button */}
        <Button
          variant="outline" 
          size="sm"
          onClick={onToggleSubscribeForm}
          className="ml-auto border-primary/30 hover:border-primary"
        >
          Subscribe to updates
        </Button>
      </div>

      {post?.cover_image && (
        <div className="aspect-video w-full mb-6 rounded-lg overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </header>
  );
};

export default PostHeader;
