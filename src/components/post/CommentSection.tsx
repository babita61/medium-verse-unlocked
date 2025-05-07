
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Comment, Post } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CommentSectionProps {
  post: Post;
  commentInputRef?: React.RefObject<HTMLTextAreaElement>;
}

const CommentSection = ({ post, commentInputRef: externalRef }: CommentSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const internalCommentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentInputRef = externalRef || internalCommentInputRef;
  const [commentContent, setCommentContent] = useState("");

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ["post-comments", post.slug],
    queryFn: async () => {
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
  });

  // Mutation to add a comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("You must be logged in to comment");
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
      queryClient.invalidateQueries({ queryKey: ["post-comments", post.slug] });
      setCommentContent("");
      toast.success("Comment added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const handleAddComment = () => {
    if (commentContent.trim()) {
      addCommentMutation.mutate(commentContent);
    } else {
      toast.error("Comment cannot be empty");
    }
  };

  return (
    <div>
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
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-8">
          <p className="text-gray-600 dark:text-gray-400">Please sign in to leave a comment.</p>
        </div>
      )}
      
      {loadingComments ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2">
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
};

export default CommentSection;
