// import { useState, useEffect } from 'react';
// import { Category, getCategories, addCategory, updateCategory, deleteCategory } from '../lib/category';

// const CategoryManager = () => {
//     const [categories, setCategories] = useState<Category[]>([]);
//     const [newCategory, setNewCategory] = useState({ name: '', description: '' });
//     const [editingCategory, setEditingCategory] = useState<Category | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         fetchCategories();
//     }, []);

//     const fetchCategories = async () => {
//         try {
//             const data = await getCategories();
//             setCategories(data);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'An error occurred');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleAddCategory = async (e: React.FormEvent) => {
//         e.preventDefault();
//         try {
//             await addCategory(newCategory.name, newCategory.description);
//             setNewCategory({ name: '', description: '' });
//             fetchCategories();
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to add category');
//         }
//     };       

//     const handleUpdateCategory = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!editingCategory) return;
//         try {
//             await updateCategory(editingCategory.id, editingCategory.name, editingCategory.description);
//             setEditingCategory(null);
//             fetchCategories();
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to update category');
//         }
//     };

//     const handleDeleteCategory = async (id: string) => {
//         if (!window.confirm('Are you sure you want to delete this category?')) return;
//         try {
//             await deleteCategory(id);
//             fetchCategories();
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to delete category');
//         }
//     };

//     if (loading) return <div className="text-center py-10">Loading...</div>;
//     if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;

//     return (
//         <div className="container mx-auto px-4 py-8">
//             <h2 className="text-2xl font-bold mb-6">Manage Categories</h2>

//             {/* Add Category Form */}
//             <form onSubmit={handleAddCategory} className="mb-8">
//                 <div className="flex gap-4">
//                     <input
//                         type="text"
//                         value={newCategory.name}
//                         onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
//                         placeholder="Category Name"
//                         className="flex-1 p-2 border rounded"
//                         required
//                     />
//                     <input
//                         type="text"
//                         value={newCategory.description}
//                         onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
//                         placeholder="Description (optional)"
//                         className="flex-1 p-2 border rounded"
//                     />
//                     <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
//                         Add Category
//                     </button>
//                 </div>
//             </form>

//             {/* Categories List */}
//             <div className="space-y-4">
//                 {categories.map((category) => (
//                     <div key={category.id} className="flex items-center justify-between p-4 border rounded">
//                         {editingCategory?.id === category.id ? (
//                             <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-4">
//                                 <input
//                                     type="text"
//                                     value={editingCategory.name}
//                                     onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
//                                     className="flex-1 p-2 border rounded"
//                                     required
//                                 />
//                                 <input
//                                     type="text"
//                                     value={editingCategory.description || ''}
//                                     onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
//                                     className="flex-1 p-2 border rounded"
//                                 />
//                                 <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
//                                     Save
//                                 </button>
//                                 <button
//                                     type="button"
//                                     onClick={() => setEditingCategory(null)}
//                                     className="bg-gray-500 text-white px-4 py-2 rounded"
//                                 >
//                                     Cancel
//                                 </button>
//                             </form>
//                         ) : (
//                             <>
//                                 <div>
//                                     <h3 className="font-bold">{category.name}</h3>
//                                     {category.description && <p className="text-gray-600">{category.description}</p>}
//                                 </div>
//                                 <div className="flex gap-2">
//                                     <button
//                                         onClick={() => setEditingCategory(category)}
//                                         className="bg-yellow-500 text-white px-3 py-1 rounded"
//                                     >
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => handleDeleteCategory(category.id)}
//                                         className="bg-red-500 text-white px-3 py-1 rounded"
//                                     >
//                                         Delete
//                                     </button>
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default CategoryManager; 