
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

interface MultipleImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

const MultipleImageUploader = ({ images, onImagesChange }: MultipleImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const newImages = [...images];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('post_images')
          .upload(filePath, file);
        
        if (error) throw error;
        
        const { data: urlData } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);
        
        newImages.push(urlData.publicUrl);
      }
      
      onImagesChange(newImages);
      
    } catch (error: any) {
      toast.error(error.message || 'Error uploading images');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <Button
            type="button" 
            variant="outline" 
            size="sm"
            disabled={isUploading}
            asChild
          >
            <div>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
              <span className="ml-2">Add Images</span>
            </div>
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {images.length} image{images.length !== 1 && 's'} selected
        </div>
      </div>
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img 
                src={img} 
                alt={`Uploaded image ${index + 1}`}
                className="h-24 w-full object-cover rounded-md" 
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUploader;
