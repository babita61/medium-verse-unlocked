
import React, { useState, useEffect } from 'react';
import { X, StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/context/ThemeContext';
import { toast } from '@/components/ui/sonner';

interface StickyNote {
  id: string;
  content: string;
  position: number;
  color: string;
}

interface StickyNotesProps {
  postId: string;
}

// Available colors for sticky notes
const noteColors = [
  'bg-yellow-100 dark:bg-yellow-900/40',
  'bg-blue-100 dark:bg-blue-900/40',
  'bg-pink-100 dark:bg-pink-900/40',
  'bg-green-100 dark:bg-green-900/40',
  'bg-purple-100 dark:bg-purple-900/40',
];

export function StickyNotes({ postId }: StickyNotesProps) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [showNotes, setShowNotes] = useState(true);
  const { isDark } = useTheme();

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`sticky-notes-${postId}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse notes from localStorage', e);
      }
    }
  }, [postId]);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`sticky-notes-${postId}`, JSON.stringify(notes));
  }, [notes, postId]);

  const addNote = () => {
    const newNote: StickyNote = {
      id: Date.now().toString(),
      content: '',
      position: Math.floor(window.scrollY + 100),
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
    };
    
    setNotes(prev => [...prev, newNote]);
    toast.success("Note added! Scroll to your current position to find it.");
  };

  const updateNote = (id: string, content: string) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === id ? { ...note, content } : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    toast.success("Note deleted");
  };

  const toggleNotesVisibility = () => {
    setShowNotes(prev => !prev);
    toast.success(showNotes ? "Notes hidden" : "Notes visible");
  };

  return (
    <div className="sticky-notes-container">
      {/* Floating action button to toggle notes visibility */}
      <div className="fixed bottom-4 left-4 z-10 flex gap-2">
        <Button
          size="icon"
          variant="outline"
          className={`rounded-full shadow-md ${showNotes ? 'bg-primary text-white' : ''}`}
          onClick={toggleNotesVisibility}
          title={showNotes ? "Hide notes" : "Show notes"}
        >
          <StickyNote className="h-5 w-5" />
        </Button>
        
        {showNotes && (
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-md"
            onClick={addNote}
            title="Add new note"
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Render sticky notes */}
      {showNotes && notes.map(note => (
        <div 
          key={note.id}
          className={`sticky-note fixed right-4 w-64 p-3 rounded-md shadow-md z-20 ${note.color}`}
          style={{ top: `${note.position}px` }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Sticky Note</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:bg-transparent"
              onClick={() => deleteNote(note.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={note.content}
            onChange={(e) => updateNote(note.id, e.target.value)}
            placeholder="Write your note here..."
            className="min-h-[100px] bg-transparent border-gray-300 dark:border-gray-600"
          />
        </div>
      ))}
    </div>
  );
}

export default StickyNotes;
