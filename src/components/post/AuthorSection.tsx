
import React from "react";
import { Profile } from "@/types";

interface AuthorSectionProps {
  author: Profile | undefined;
}

const AuthorSection = ({ author }: AuthorSectionProps) => {
  return (
    <div className="flex items-center mb-6">
      {author?.avatar_url ? (
        <img
          src={author.avatar_url}
          alt={author.full_name || author.username}
          className="w-10 h-10 rounded-full mr-4"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 mr-4"></div>
      )}
      <div>
        <p className="font-medium">
          {author?.full_name || author?.username || "Unknown Author"}
        </p>
      </div>
    </div>
  );
};

export default AuthorSection;
