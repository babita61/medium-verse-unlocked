
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

  const handleView = (comment: CommentWithPost) => {
    alert(`Comment by ${comment.user?.username}:\n\n${comment.content}`);
  };
  
  const handleDelete = async (commentId: string) => {
    const confirm = window.confirm("Are you sure you want to delete this comment?");
    if (!confirm) return;
  
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
  
    if (error) {
      alert("Failed to delete comment: " + error.message);
    } else {
      queryClient.invalidateQueries(["admin-comments"]);
    }
  };
  


















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
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          user:profiles(*),
          post:posts(title, slug)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CommentWithPost[];
    },
    enabled: !!profile && profile.role === "admin",
  });

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
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-700"
            >
              Back to Dashboard
            </button>
          </div>

          {commentsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Content
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Post
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comments.map((comment) => (
                    <tr key={comment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {comment.user?.avatar_url && (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user?.username}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {comment.user?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/post/${comment.post?.slug || ''}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {comment.post?.title || 'Unknown post'}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.reported
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                            }`}
                        >
                          {comment.reported ? "Reported" : "Normal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(comment)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No comments found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminComments;
