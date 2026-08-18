import React, { useState } from 'react';
import { X, FileText, Image as ImageIcon, Video, Tag, Hash, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['Warlands', 'Gaming', 'Esports', 'Highlights', 'Tutorial', 'Live Stream', 'Community'];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { createPost, uploadFile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video'>('text');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [useUpload, setUseUpload] = useState(true);
  const [hashtagInput, setHashtagInput] = useState('');
  const [category, setCategory] = useState('Warlands');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!caption.trim() && !file && !videoUrl) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let media_url = videoUrl;
      if (file) {
        media_url = await uploadFile(file);
      }

      // Extract hashtags from caption or custom input
      const captionTags: string[] = caption.match(/#[a-zA-Z0-9_]+/g) || [];
      const extraTags: string[] = hashtagInput ? hashtagInput.split(',').map((h) => (h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`)).filter((h) => h.length > 1) : [];
      const extractedHashtags = captionTags.concat(extraTags);

      const postType = activeTab === 'video' ? 'video' : activeTab;

      createPost({
        caption,
        type: postType,
        media_url: media_url || undefined,
        hashtags: Array.from(new Set(extractedHashtags)),
        category,
        tags: [category],
      });

      onClose();
      setCaption('');
      setVideoUrl('');
      setFile(null);
      setHashtagInput('');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to create post:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-lg">Create New Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Post Type Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'text'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'image'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Images</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === 'video'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Videos</span>
            </button>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Caption & Hashtags
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What is happening in your gaming world? Add #hashtags freely..."
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              required
            />
          </div>

          {/* Media Input for Image / Video */}
          {activeTab !== 'text' && (
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                  <button type='button' onClick={() => setUseUpload(true)} className={`text-xs px-3 py-1 rounded-full ${useUpload ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>Upload</button>
                  <button type='button' onClick={() => setUseUpload(false)} className={`text-xs px-3 py-1 rounded-full ${!useUpload ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>Stream URL</button>
              </div>
              
              {useUpload ? (
                <input
                    type="file"
                    accept={activeTab === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              ) : (
                <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={activeTab === 'video' ? 'https://example.com/stream.m3u8' : ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              )}
            </div>
          )}

          {/* Video Category Tags Selector */}
          {activeTab === 'video' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Video Category Tag</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hashtag helper input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Hash className="w-3.5 h-3.5" />
              <span>Additional Hashtags (Comma separated)</span>
            </label>
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              placeholder="e.g. Warlands, Esports, Playxcade"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition"
            >
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
