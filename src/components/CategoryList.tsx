
  import { Link } from "react-router-dom";

  const categories = [
    { name: "Poem", slug: "poem" },
    { name: "Story", slug: "story" },
    { name: "Technology", slug: "technology" },
    { name: "Economics", slug: "economics" },
    { name: "Travel", slug: "travel" },
    { name: "Lifestyle", slug: "lifestyle" },
    { name: "Fashion", slug: "fashion" },
    { name: "Genz", slug: "Genz" },
    { name: "History", slug: "history" },
    { name: "Movie-critics", slug: "movie " }
  ];

  const CategoryList = () => {
    return (
      <section className="py-10">
        <div className="container-blog">
          <h2 className="text-2xl font-serif font-bold mb-6">Explore Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/category/${category.slug}`}
                className={`category-badge bg-category-${category.slug.toLowerCase()} flex items-center justify-center py-3 rounded-md transform transition hover:scale-105 hover:shadow-md`}
              >
                <span className="text-center font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  };

  export default CategoryList;