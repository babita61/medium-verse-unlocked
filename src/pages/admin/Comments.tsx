
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Check, Flag } from "lucide-react";
import { toast } from "@/components/ui/sonner";
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

interface CommentWithPost extends Comment {
  post?: {
    title: string;
    slug: string;
  };
}

const AdminComments = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [viewingComment, setViewingComment] = useState<CommentWithPost | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["admin-comments", activeTab],
    queryFn: async () => {
      const query = supabase
        .from("comments")
        .select(`
          *,
          user:profiles(*),
          post:posts(title, slug)
        `)
        .order("created_at", { ascending: false });

      if (activeTab === "reported") {
        query.eq("reported", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CommentWithPost[];
    },
    enabled: !!profile && profile.role === "admin",
  });

  const handleView = (comment: CommentWithPost) => {
    setViewingComment(comment);
  };
  
  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;
    
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentToDelete);
    
      if (error) {
        throw new Error(error.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment deleted successfully");
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    } catch (error: any) {
      toast.error(`Failed to delete comment: ${error.message}`);
    }
  };

  const handleClearReport = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .update({ reported: false })
        .eq("id", commentId);
    
      if (error) {
        throw new Error(error.message);
      }
      
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment marked as reviewed");
    } catch (error: any) {
      toast.error(`Failed to update comment: ${error.message}`);
    }
  };

  React.useEffect(() => {
    // Redirect if not admin
    if (!authLoading && (!user || (profile && profile.role !== "admin"))) {
      navigate("/");
    }
  }, [authLoading, user, profile, navigate]);

  if (authLoading || !profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-10">
          <div className="container mx-auto px-4">
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
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
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Manage Comments</h1>
            <button
              onClick={() => navigate("/admin")}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Back to Dashboard
            </button>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Comments</TabsTrigger>
              <TabsTrigger value="reported" className="flex items-center gap-1">
                <Flag className="h-4 w-4" /> Reported
                {comments?.filter(c => c.reported).length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {comments?.filter(c => c.reported).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {commentsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Content
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Post
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {comments.map((comment) => (
                    <tr key={comment.id} className={comment.reported ? "bg-red-50 dark:bg-red-900/10" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            {comment.user?.avatar_url && (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user?.username}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {comment.user?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/post/${comment.post?.slug || ''}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {comment.post?.title || 'Unknown post'}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comment.reported ? (
                          <span
                            className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Reported
                          </span>
                        ) : (
                          <span
                            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(comment)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setCommentToDelete(comment.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mr-3"
                        >
                          Delete
                        </button>
                        {comment.reported && (
                          <button
                            onClick={() => handleClearReport(comment.id)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            <Check className="h-4 w-4 inline mr-1" />
                            Clear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === "reported" 
                  ? "No reported comments found." 
                  : "No comments found."
                }
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Comment Dialog */}
      <AlertDialog open={!!viewingComment} onOpenChange={() => setViewingComment(null)}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Comment Details</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4 max-h-[70vh] overflow-auto">
            {viewingComment && (
              <>
                <div className="flex gap-3 mb-4 items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {viewingComment.user?.avatar_url && (
                      <img
                        src={viewingComment.user.avatar_url}
                        alt={viewingComment.user?.username}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{viewingComment.user?.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Posted on: {new Date(viewingComment.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Post: <a href={`/post/${viewingComment.post?.slug}`} className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">{viewingComment.post?.title}</a>
                    </p>
                    
                    {viewingComment.parent_id && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        This is a reply to another comment
                      </p>
                    )}
                    
                    {viewingComment.reported && (
                      <div className="mt-2 flex items-center text-red-600 dark:text-red-400">
                        <Flag className="h-4 w-4 mr-1" />
                        This comment has been reported
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-2 whitespace-pre-wrap">
                  {viewingComment.content}
                </div>
                
                <div className="mt-4 space-y-2">
                  {viewingComment.reported && (
                    <button
                      onClick={() => {
                        handleClearReport(viewingComment.id);
                        setViewingComment(null);
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark as reviewed
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setCommentToDelete(viewingComment.id);
                      setViewingComment(null);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                  >
                    Delete Comment
                  </button>
                </div>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminComments;
