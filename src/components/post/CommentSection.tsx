
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Comment, Post } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flag, MessageSquare, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ["post-comments", post.slug],
    queryFn: async () => {
      // First get all top-level comments (no parent_id)
      const { data: topLevelComments, error: topLevelError } = await supabase
        .from("comments")
        .select(`
          *,
          user:profiles(*)
        `)
        .eq("post_id", post.id)
        .is("parent_id", null)
        .order("created_at", { ascending: true });

      if (topLevelError) throw topLevelError;
      
      // For each comment, get its replies
      const commentsWithReplies = await Promise.all(
        (topLevelComments as Comment[]).map(async (comment) => {
          const { data: replies, error: repliesError } = await supabase
            .from("comments")
            .select(`
              *,
              user:profiles(*)
            `)
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });

          if (repliesError) throw repliesError;
          
          return {
            ...comment,
            replies: replies as Comment[]
          };
        })
      );

      return commentsWithReplies as Comment[];
    },
  });

  // Mutation to add a comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user) throw new Error("You must be logged in to comment");
      if (!content.trim()) throw new Error("Comment cannot be empty");

      const { error, data } = await supabase
        .from("comments")
        .insert([
          {
            post_id: post.id,
            user_id: user.id,
            content,
            parent_id: parentId || null,
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
      setReplyingTo(null);
      toast.success(replyingTo ? "Reply added successfully" : "Comment added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  // Mutation to report a comment
  const reportCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error("You must be logged in to report a comment");
      
      const { error } = await supabase
        .from("comments")
        .update({ reported: true })
        .eq("id", commentId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", post.slug] });
      setReportingComment(null);
      setReportDialogOpen(false);
      setReportReason("");
      toast.success("Comment reported successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to report comment");
    },
  });

  const handleAddComment = () => {
    if (commentContent.trim()) {
      addCommentMutation.mutate({ 
        content: commentContent,
        parentId: replyingTo?.id
      });
    } else {
      toast.error("Comment cannot be empty");
    }
  };

  const handleReportComment = () => {
    if (reportingComment) {
      reportCommentMutation.mutate(reportingComment.id);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    return (
      <div 
        key={comment.id} 
        className={`${isReply ? 'ml-8 mt-3' : 'border-b border-gray-100 dark:border-gray-800 pb-4 mb-4'}`}
      >
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
          <div className="flex-1">
            <span className="font-medium">
              {comment.user?.full_name || comment.user?.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          {user && comment.user_id !== user.id && (
            <button 
              onClick={() => {
                setReportingComment(comment);
                setReportDialogOpen(true);
              }}
              className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Report comment"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
        
        {user && !isReply && (
          <button
            onClick={() => setReplyingTo(comment)}
            className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
          >
            <MessageSquare className="h-3 w-3" />
            Reply
          </button>
        )}

        {comment.reported && (
          <div className="mt-1 text-xs flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-3 w-3" />
            This comment has been reported
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">Comments</h3>
      
      {user ? (
        <div className="mb-8">
          <Textarea
            ref={commentInputRef}
            placeholder={replyingTo 
              ? `Reply to ${replyingTo.user?.username || 'comment'}...` 
              : "Add your comment..."
            }
            className="min-h-28 mb-2"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleAddComment} 
              disabled={addCommentMutation.isPending || !commentContent.trim()}
            >
              {addCommentMutation.isPending 
                ? "Posting..." 
                : replyingTo 
                  ? "Post Reply" 
                  : "Post Comment"
              }
            </Button>
            {replyingTo && (
              <Button 
                variant="outline" 
                onClick={() => setReplyingTo(null)}
              >
                Cancel Reply
              </Button>
            )}
          </div>
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
            <div key={comment.id}>
              {renderComment(comment)}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                  {comment.replies.map((reply) => renderComment(reply, true))}
                </div>
              )}
              {replyingTo?.id === comment.id && (
                <div className="ml-8 mt-3 border-l-2 border-primary pl-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Replying to {replyingTo.user?.username || 'comment'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
      )}

      {/* Report Comment Dialog */}
      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Why are you reporting this comment? (Optional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-20 mb-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setReportDialogOpen(false);
              setReportingComment(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReportComment}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommentSection;
