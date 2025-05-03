import React, { useState } from "react";
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

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  React.useEffect(() => {
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
            <h1 className="text-3xl font-bold">Manage Categories</h1>
            <button
              onClick={() => navigate("/admin")}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-700"
            >
              Back to Dashboard
            </button>
          </div>

          {categoriesLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{category.description || "—"}</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => handleEditClick(category)}
                        >
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No categories found. Create your first category!</p>
            </div>
          )}

          {/* Edit Form Modal-ish */}
          {editingCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Category</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded"
                  />
                  <input
                    type="text"
                    name="slug"
                    placeholder="Slug"
                    value={form.slug}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded"
                  />
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
