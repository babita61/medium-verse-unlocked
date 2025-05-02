
import PostCard from "./PostCard";

// Mock data for featured posts
const featuredPosts = [
  {
    id: "1",
    title: "The Art of Creative Writing: Finding Your Voice in a Noisy World",
    excerpt: "Discover techniques to develop your unique writing style and stand out in today's content-saturated environment.",
    coverImage: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    category: "Story",
    authorName: "Emma Wilson",
    readTime: 8,
    createdAt: "2025-04-28",
    slug: "art-of-creative-writing",
  },
  {
    id: "2",
    title: "The Future of AI: How Machine Learning is Transforming Industries",
    excerpt: "An in-depth look at how artificial intelligence is revolutionizing various sectors and what this means for the future of work.",
    coverImage: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    category: "Technology",
    authorName: "Michael Chen",
    readTime: 12,
    createdAt: "2025-05-01",
    slug: "future-of-ai",
  },
];

const FeaturedPosts = () => {
  return (
    <section className="py-10">
      <div className="container-blog">
        <h2 className="text-2xl font-serif font-bold mb-6">Featured Posts</h2>
        <div className="space-y-8">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} featured={true} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPosts;
