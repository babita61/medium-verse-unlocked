
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CategoriesPage = () => {
  const [categoriesWithPosts, setCategoriesWithPosts] = useState<Array<Category & { postCount: number }>>([]);

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    }
  });

  useEffect(() => {
    const fetchCategoriesWithPostCounts = async () => {
      if (!categories) return;
      
      const categoriesData = await Promise.all(
        categories.map(async (category) => {
          const { count, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('published', true);
          
          return {
            ...category,
            postCount: count || 0
          };
        })
      );
      
      setCategoriesWithPosts(categoriesData);
    };

    fetchCategoriesWithPostCounts();
  }, [categories]);

  // Function to get category color
  const getCategoryColor = (slug: string) => {
    return `bg-category-${slug.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="container-blog">
          <h1 className="text-3xl font-serif font-bold mb-6">Explore by Category</h1>
          
          {loadingCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categoriesWithPosts.map((category) => (
                <Link 
                  to={`/category/${category.slug}`} 
                  key={category.id}
                  className="group"
                >
                  <div className={`${getCategoryColor(category.slug)} h-full rounded-lg p-6 transform transition hover:scale-105 hover:shadow-md`}>
                    <h2 className="font-serif text-xl font-semibold">{category.name}</h2>
                    <p className="text-sm mt-1 opacity-75 line-clamp-2">{category.description || `Explore our ${category.name.toLowerCase()} articles`}</p>
                    <div className="mt-auto pt-4 text-sm font-medium">
                      {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoriesPage;
