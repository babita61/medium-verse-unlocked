
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Edit, Trash2 } from "lucide-react";

const AdminPosts = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const { data: posts, isLoading: postsLoading, refetch } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          category:categories(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!profile && profile.role === "admin",
  });

  React.useEffect(() => {
    // Redirect if not admin
    if (!authLoading && (!user || (profile && profile.role !== "admin"))) {
      navigate("/");
    }
  }, [authLoading, user, profile, navigate]);

  const handleCreatePost = () => {
    navigate("/admin/posts/create");
  };

  const handleEditPost = (postId: string) => {
    navigate(`/admin/posts/${postId}/edit`);
  };

  const handleDeletePost = async (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        const { error } = await supabase
          .from("posts")
          .delete()
          .eq("id", postId);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
        
        refetch();
        
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

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
            <h1 className="text-3xl font-bold">Manage Posts</h1>
            <button
              onClick={() => navigate("/admin")}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-700"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={handleCreatePost}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Create New Post
            </button>
          </div>

          {postsLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {post.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {post.category?.name || "Uncategorized"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            post.published
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {post.published ? "Published" : "Draft"}
                        </span>
                        {post.featured && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditPost(post.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No posts found. Create your first post!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPosts;
