
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateEditPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { postId } = useParams<{ postId: string }>();
  
  const isEditing = !!postId;
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // If editing, fetch post data
  const { data: postData } = useQuery({
    queryKey: ['edit-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });
  
  // Use useEffect to set form data when postData is available
  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setSlug(postData.slug);
      setContent(postData.content);
      setExcerpt(postData.excerpt || '');
      setCoverImage(postData.cover_image || '');
      setCategoryId(postData.category_id || '');
      setReadTime(postData.read_time);
      setPublished(postData.published);
      setFeatured(postData.featured);
    }
  }, [postData]);

  // Create or update post mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const postData = {
        title,
        slug: slug || title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-'),
        content,
        excerpt,
        cover_image: coverImage,
        category_id: categoryId || null,
        read_time: readTime,
        published,
        featured,
        author_id: user?.id
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId);
        
        if (error) throw error;
        return 'Post updated successfully';
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([postData]);
        
        if (error) throw error;
        return 'Post created successfully';
      }
    },
    onSuccess: (message) => {
      toast({
        title: "Success",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['featured-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
      navigate('/admin/posts');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate();
  };

  const generateSlug = () => {
    setSlug(title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-'));
  };

  const calculateReadTime = () => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    setReadTime(minutes > 0 ? minutes : 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/posts')}
            >
              Cancel
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="slug">Slug</Label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Generate from title
                  </button>
                </div>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  className="min-h-[300px]"
                  required
                />
                <button
                  type="button"
                  onClick={calculateReadTime}
                  className="text-sm text-blue-600 hover:underline justify-self-end"
                >
                  Calculate read time
                </button>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  min="1"
                  value={readTime}
                  onChange={(e) => setReadTime(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={featured}
                    onCheckedChange={setFeatured}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEditPost;
