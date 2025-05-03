import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CommentFormProps {
  postId: string;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { mutate: submitComment, isLoading } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to comment.");

      const { error } = await supabase.from("comments").insert([
        {
          content,
          user_id: user.id,
          post_id: postId,
          reported: false, // default status
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries(["post-comments", postId]);
    },
    onError: (err: any) => {
      setError(err.message || "Something went wrong");
    },
  });

  if (!user) {
    return (
      <p className="text-gray-500">
        Please <a href="/login" className="text-blue-600 underline">login</a> to leave a comment.
      </p>
    );
  }

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2">Leave a Comment</h3>
      <textarea
        className="w-full border border-gray-300 rounded p-2 mb-2"
        rows={4}
        placeholder="Write your comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={() => submitComment()}
        disabled={isLoading || !content.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Posting..." : "Post Comment"}
      </button>
    </div>
  );
};

export default CommentForm;
