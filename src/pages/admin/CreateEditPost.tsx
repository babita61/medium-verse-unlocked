
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Loader2, Bold, Italic, Underline, Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import MultipleImageUploader from '@/components/editor/MultipleImageUploader';
import ImageUploader from '@/components/editor/ImageUploader';

// TinyMCE type definitions
declare global {
  interface Window { 
    tinymce: any; 
  }
}

interface EditorRef {
  editor?: any;
  hasEditor?: boolean;
  current: any;
}

const CreateEditPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { postId } = useParams<{ postId: string }>();
  const editorRef = useRef<any>(null);
  
  const isEditing = !!postId;
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editorView, setEditorView] = useState('visual'); // 'visual' or 'html'
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

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
      setEditorContent(postData.content);
      setExcerpt(postData.excerpt || '');
      setCoverImage(postData.cover_image || '');
      setCategoryId(postData.category_id || '');
      setReadTime(postData.read_time);
      setPublished(postData.published);
      setFeatured(postData.featured);
      
      // Set gallery images if they exist in the post data
      if (postData.gallery_images && Array.isArray(postData.gallery_images)) {
        setGalleryImages(postData.gallery_images);
      }
      
      if (postData.cover_image) {
        setImagePreview(postData.cover_image);
      }
    }
  }, [postData]);

  useEffect(() => {
    // Load TinyMCE editor script
    if (!document.querySelector('#tinymce-script')) {
      const script = document.createElement('script');
      script.id = 'tinymce-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.0/tinymce.min.js';
      script.onload = initEditor;
      document.body.appendChild(script);
    } else {
      initEditor();
    }

    return () => {
      // Clean up TinyMCE when component unmounts
      if (window.tinymce) {
        window.tinymce.remove('#rich-text-editor');
      }
    };
  }, []);

  // Initialize TinyMCE editor
  const initEditor = () => {
    if (window.tinymce && editorRef.current && !editorRef.current.hasEditor) {
      window.tinymce.init({
        selector: '#rich-text-editor',
        height: 500,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic underline | ' +
          'alignleft aligncenter alignright alignjustify | ' +
          'bullist numlist outdent indent | link image | removeformat | help',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif; font-size: 16px; line-height: 1.5; }',
        setup: (editor: any) => {
          // Store editor reference
          editorRef.current.editor = editor;
          
          // Set initial content
          if (content) {
            editor.on('init', () => {
              editor.setContent(content);
            });
          }
          
          // Update content state when editor changes
          editor.on('change', () => {
            setEditorContent(editor.getContent());
            setContent(editor.getContent());
          });
          
          // Add custom button for image insertion
          editor.ui.registry.addButton('customimage', {
            icon: 'image',
            tooltip: 'Insert image',
            onAction: function() {
              // Open custom image uploader dialog
              // The dialog would allow uploading to Supabase storage
              // and inserting the image into the editor
              document.getElementById('editor-image-upload')?.click();
            }
          });
        }
      });
      
      editorRef.current.hasEditor = true;
    }
  };

  // Handle inserting image into the editor
  const handleInsertImage = (imageUrl: string) => {
    if (editorRef.current?.editor) {
      const editor = editorRef.current.editor;
      editor.insertContent(`<img src="${imageUrl}" alt="Inserted image" />`);
    }
  };

  // Simple formatting functions for custom toolbar (if not using TinyMCE)
  const formatText = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return coverImage;
    
    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(filePath, imageFile);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('post_images')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Create or update post mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let finalCoverImage = coverImage;
      
      // Upload image if a new one was selected
      if (imageFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          finalCoverImage = uploadedImageUrl;
        }
      }
      
      // Make sure we get the latest content from the editor
      let finalContent = content;
      if (editorRef.current?.editor) {
        finalContent = editorRef.current.editor.getContent();
      }
      
      const postData = {
        title,
        slug: slug || title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-'),
        content: finalContent,
        excerpt,
        cover_image: finalCoverImage,
        gallery_images: galleryImages,
        category_id: categoryId || null,
        read_time: readTime,
        published,
        featured,
        author_id: user.id
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
    onError: (error: Error) => {
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
    // Calculate from rich text content by removing HTML tags first
    const textContent = editorContent.replace(/<[^>]*>?/gm, '');
    const wordsPerMinute = 200;
    const words = textContent.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    setReadTime(minutes > 0 ? minutes : 1);
  };

  const toggleEditorView = (view: string) => {
    setEditorView(view);
    
    if (editorRef.current?.editor) {
      if (view === 'visual') {
        // When switching to visual mode, make sure the editor has the latest content
        const editor = editorRef.current.editor;
        editor.setContent(content);
      }
    }
  };

  // Custom Toolbar component - can be used as an alternative to TinyMCE
  const CustomToolbar = () => (
    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-t-md border border-gray-200 dark:border-gray-600 flex flex-wrap gap-2">
      <ToggleGroup type="multiple" className="flex gap-1">
        <ToggleGroupItem value="bold" aria-label="Bold" onClick={() => formatText('bold')}>
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic" onClick={() => formatText('italic')}>
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline" onClick={() => formatText('underline')}>
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      <Separator orientation="vertical" className="h-6" />
      
      <ToggleGroup type="single" className="flex gap-1">
        <ToggleGroupItem value="h1" aria-label="Heading 1" onClick={() => formatText('formatBlock', '<h1>')}>
          <Heading1 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="h2" aria-label="Heading 2" onClick={() => formatText('formatBlock', '<h2>')}>
          <Heading2 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="h3" aria-label="Heading 3" onClick={() => formatText('formatBlock', '<h3>')}>
          <Heading3 className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      <Separator orientation="vertical" className="h-6" />
      
      <ToggleGroup type="single" defaultValue="left" className="flex gap-1">
        <ToggleGroupItem value="left" aria-label="Align Left" onClick={() => formatText('justifyLeft')}>
          <AlignLeft className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align Center" onClick={() => formatText('justifyCenter')}>
          <AlignCenter className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align Right" onClick={() => formatText('justifyRight')}>
          <AlignRight className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button variant="ghost" size="icon" onClick={() => formatText('insertUnorderedList')}>
        <List className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => formatText('insertOrderedList')}>
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Insert Link</h4>
            <div className="space-y-2">
              <Label htmlFor="link-text">Text</Label>
              <Input id="link-text" placeholder="Link text" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input id="link-url" placeholder="https://example.com" />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => {
                const textElement = document.getElementById('link-text') as HTMLInputElement;
                const urlElement = document.getElementById('link-url') as HTMLInputElement;
                
                const text = textElement?.value || '';
                const url = urlElement?.value || '';
                
                if (url) {
                  formatText('createLink', url);
                }
              }}>
                Insert Link
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Add image uploader */}
      <input
        type="file"
        id="editor-image-upload"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Handle image upload and insertion
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            
            setUploadingImage(true);
            
            supabase.storage
              .from('post_images')
              .upload(fileName, file)
              .then(({ data, error }) => {
                if (error) throw error;
                
                return supabase.storage
                  .from('post_images')
                  .getPublicUrl(fileName);
              })
              .then(({ data }) => {
                if (editorRef.current?.editor) {
                  editorRef.current.editor.insertContent(`<img src="${data.publicUrl}" alt="Uploaded image" />`);
                }
                // Reset the input
                e.target.value = '';
              })
              .catch((error) => {
                console.error('Error uploading image:', error);
                toast({
                  title: "Upload failed",
                  description: error.message || "Failed to upload image",
                  variant: "destructive",
                });
              })
              .finally(() => {
                setUploadingImage(false);
              });
          }
        }}
      />
      <ImageUploader onImageInsert={handleInsertImage} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white">{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
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
                <Label htmlFor="title" className="dark:text-white">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  required
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="slug" className="dark:text-white">Slug</Label>
                  <button
                    type="button"
                    onClick={generateSlug}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Generate from title
                  </button>
                </div>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category" className="dark:text-white">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-700">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800">
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="content" className="dark:text-white">Content</Label>
                  <Tabs value={editorView} onValueChange={toggleEditorView} className="w-auto">
                    <TabsList className="dark:bg-gray-700">
                      <TabsTrigger value="visual">Visual</TabsTrigger>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <CustomToolbar />
                
                {/* Rich text editor */}
                <div className="min-h-[300px] border rounded-md dark:border-gray-700">
                  {editorView === 'visual' ? (
                    <div ref={editorRef}>
                      <textarea
                        id="rich-text-editor"
                        style={{ visibility: 'hidden' }}
                        defaultValue={content}
                      />
                    </div>
                  ) : (
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      spellCheck="false"
                    />
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={calculateReadTime}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline justify-self-end"
                >
                  Calculate read time
                </button>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="excerpt" className="dark:text-white">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post"
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
              
              <div className="grid gap-4">
                <Label className="dark:text-white">Cover Image</Label>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="flex-1">
                    <Card className="border-dashed cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:bg-gray-800 dark:border-gray-700">
                      <CardContent className="p-6 flex justify-center items-center">
                        <label className="cursor-pointer flex flex-col items-center">
                          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                            <Image className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Click to {imageFile || coverImage ? "change" : "upload"} image</span>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </CardContent>
                    </Card>
                    {!imageFile && (
                      <div className="mt-2">
                        <Label htmlFor="coverImageUrl" className="dark:text-white">Or enter image URL</Label>
                        <Input
                          id="coverImageUrl"
                          value={coverImage}
                          onChange={(e) => setCoverImage(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Preview */}
                  {(imagePreview || coverImage) && (
                    <div className="w-full md:w-1/3 aspect-video bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden relative">
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}
                      <img
                        src={imagePreview || coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Gallery Images */}
              <div className="grid gap-2">
                <Label className="dark:text-white">Gallery Images</Label>
                <MultipleImageUploader 
                  images={galleryImages}
                  onImagesChange={setGalleryImages}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="readTime" className="dark:text-white">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  min="1"
                  value={readTime}
                  onChange={(e) => setReadTime(parseInt(e.target.value) || 1)}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="published"
                    checked={published}
                    onCheckedChange={setPublished}
                  />
                  <Label htmlFor="published" className="dark:text-white">Published</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={featured}
                    onCheckedChange={setFeatured}
                  />
                  <Label htmlFor="featured" className="dark:text-white">Featured</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={mutation.isPending || uploadingImage}
                className="dark:bg-primary-500"
              >
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
