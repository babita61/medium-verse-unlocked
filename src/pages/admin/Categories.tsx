
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AdminCategories = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "" });
  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };
  const createMutation = useMutation({
    mutationFn: async (category: typeof newCategory) => {
      const { error } = await supabase.from("categories").insert([category]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setNewCategory({ name: "", slug: "", description: "" });
    },
  });
  const handleCreateCategory = () => {
    if (newCategory.name && newCategory.slug) {
      createMutation.mutate(newCategory);
    }
  };
    

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

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

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select()
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!profile && profile.role === "admin",
  });

  const updateMutation = useMutation({
    mutationFn: async (updated: Category) => {
      const { error } = await supabase
        .from("categories")
        .update(updated)
        .eq("id", updated.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
  });

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
    });
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    if (editingCategory) {
      updateMutation.mutate({
        ...editingCategory,
        ...form,
      });
    }
  };

  useEffect(() => {
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Manage Categories</h1>
            <button
              onClick={() => navigate("/admin")}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200 shadow"
            >
              Back to Dashboard
            </button>
          </div>
  
          {/* Add New Category */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-10 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Add New Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={newCategory.name}
                onChange={handleNewCategoryChange}
                className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-green-300"
              />
              <input
                type="text"
                name="slug"
                placeholder="Slug"
                value={newCategory.slug}
                onChange={handleNewCategoryChange}
                className="px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-green-300"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={newCategory.description}
                onChange={handleNewCategoryChange}
                className="col-span-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-green-300"
              />
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={handleCreateCategory}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow"
              >
                Add Category
              </button>
            </div>
          </div>
  
          {/* Categories Table */}
          {categoriesLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {categories.map((category, index) => (
                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{category.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{category.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {category.description || <span className="italic text-gray-400 dark:text-gray-500">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          onClick={() => handleEditClick(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this category?")) {
                              deleteMutation.mutate(category.id);
                            }
                          }}
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
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              No categories found. Create your first category!
            </div>
          )}
  
          {/* Edit Modal */}
          {editingCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-300 dark:border-gray-600">
                <h2 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200">Edit Category</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    type="text"
                    name="slug"
                    placeholder="Slug"
                    value={form.slug}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-blue-300"
                  />
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCategories;
