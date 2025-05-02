
import PostCard from "./PostCard";

// Mock data for recent posts
const recentPosts = [
  {
    id: "3",
    title: "10 Essential Tips for Sustainable Travel",
    excerpt: "Learn how to minimize your environmental impact while exploring the world's most beautiful destinations.",
    coverImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    category: "Travel",
    authorName: "Sarah Johnson",
    readTime: 6,
    createdAt: "2025-04-25",
    slug: "sustainable-travel-tips",
  },
  {
    id: "4",
    title: "Understanding Modern Economic Theory",
    excerpt: "An accessible introduction to contemporary economic principles and how they shape our daily lives.",
    coverImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    category: "Economics",
    authorName: "David Park",
    readTime: 10,
    createdAt: "2025-04-22",
    slug: "modern-economic-theory",
  },
  {
    id: "5",
    title: "The Renaissance of Poetry in Digital Media",
    excerpt: "How social platforms have revitalized poetry and created new opportunities for emerging poets.",
    coverImage: "https://images.unsplash.com/photo-1721322800607-8c38375eef04",
    category: "Poem",
    authorName: "Maya Rodriguez",
    readTime: 5,
    createdAt: "2025-04-20",
    slug: "poetry-renaissance-digital-media",
  },
  {
    id: "6",
    title: "Fashion Sustainability: Beyond the Buzzword",
    excerpt: "Examining how the fashion industry is adapting to environmental concerns and what consumers should know.",
    coverImage: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
    category: "Fashion",
    authorName: "Alex Thompson",
    readTime: 7,
    createdAt: "2025-04-18",
    slug: "fashion-sustainability",
  }
];

const RecentPosts = () => {
  return (
    <section className="py-10 bg-gray-50">
      <div className="container-blog">
        <h2 className="text-2xl font-serif font-bold mb-6">Recent Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentPosts;
