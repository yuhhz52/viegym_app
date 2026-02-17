import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import UploadMedia from './UploadMedia';

interface Props {
  initialData?: {
    title?: string;
    content?: string;
    mediaUrls?: string[];
  };
  onSubmit: (data: { title: string; content: string; mediaUrls: string[] }) => void;
  onCancel?: () => void;
}

export default function CommunityPostForm({ initialData, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialData?.mediaUrls || []);
  const [errors, setErrors] = useState({ title: '', content: '' });

  // Reset form khi initialData thay đổi (cho edit)
  useEffect(() => {
    setTitle(initialData?.title || '');
    setContent(initialData?.content || '');
    setMediaUrls(initialData?.mediaUrls || []);
    setErrors({ title: '', content: '' });
  }, [initialData]);

  const validateForm = () => {
    const newErrors = { title: '', content: '' };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
      isValid = false;
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
      isValid = false;
    } else if (content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({ title: title.trim(), content: content.trim(), mediaUrls });
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Title Input */}
      <div className="space-y-2">
        <label htmlFor="post-title" className="block text-sm font-bold text-slate-900">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="post-title"
          type="text"
          placeholder="Enter post title..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
          }}
          onKeyPress={handleKeyPress}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-slate-500/50 focus:border-slate-400 transition-all outline-none font-medium ${
            errors.title 
              ? 'border-red-300 bg-red-50' 
              : 'border-slate-300 hover:border-slate-400'
          }`}
          maxLength={100}
        />
        {errors.title && (
          <p className="text-sm text-red-600 flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.title}
          </p>
        )}
        <p className="text-xs text-slate-500 font-medium">{title.length}/100 characters</p>
      </div>

      {/* Content Textarea */}
      <div className="space-y-2">
        <label htmlFor="post-content" className="block text-sm font-bold text-slate-900">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="post-content"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
          }}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-slate-500/50 focus:border-slate-400 transition-all outline-none resize-none font-medium ${
            errors.content 
              ? 'border-red-300 bg-red-50' 
              : 'border-slate-300 hover:border-slate-400'
          }`}
          rows={6}
          maxLength={2000}
        />
        {errors.content && (
          <p className="text-sm text-red-600 flex items-center gap-1.5 font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.content}
          </p>
        )}
        <p className="text-xs text-slate-500 font-medium">{content.length}/2000 characters</p>
      </div>

      {/* Media Upload */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Media (Optional)
        </label>
        <UploadMedia onUpload={(url) => setMediaUrls(prev => [...prev, url])} />
        
        {/* Media Preview Grid */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {mediaUrls.map((url, idx) => (
              <div 
                key={idx} 
                className="relative group rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-md hover:shadow-xl bg-white"
              >
                <img 
                  src={url} 
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-40 object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="transform scale-75 group-hover:scale-100 transition-transform duration-300 bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl shadow-red-500/50"
                    aria-label="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Image number badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t-2 border-slate-200/60">
        <Button 
          onClick={handleSubmit}
          className="flex-1 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white font-bold shadow-lg py-6 rounded-xl transition-all duration-300"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {initialData ? "Update Post" : "Create Post"}
        </Button>
        
        {onCancel && (
          <Button 
            onClick={onCancel}
            variant="outline"
            className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-semibold px-6 py-6 rounded-xl transition-all duration-300"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      <p className="text-xs text-slate-500 text-center font-medium">
        Press <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold shadow-sm">Cmd/Ctrl</kbd> + <kbd className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold shadow-sm">Enter</kbd> to submit
      </p>
    </div>
  );
}