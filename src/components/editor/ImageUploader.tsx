
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploaderProps {
  onImageInsert: (imageUrl: string) => void;
}

const ImageUploader = ({ onImageInsert }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const file = files[0];
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
      
      // Pass the image URL to parent component
      onImageInsert(urlData.publicUrl);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="flex items-center gap-1"
      >
        {isUploading ? (
          <>
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1"></div>
            Uploading...
          </>
        ) : (
          <>
            <ImageIcon size={16} />
            Insert Image
          </>
        )}
      </Button>
    </div>
  );
};

export default ImageUploader;
