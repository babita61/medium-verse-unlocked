
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post, Comment } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PostPage = () => {
  const { slug } = useParams<{ slug: string }>();

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

          <div className="prose max-w-none">
            {post.content.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-6">Comments</h3>
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
              <p className="text-gray-500">No comments yet.</p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PostPage;
