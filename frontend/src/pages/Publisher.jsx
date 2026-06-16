import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  Upload, 
  Image as ImageIcon,
  Smile, 
  Calendar, 
  Send, 
  Globe,
  Hash,
  AtSign,
  Smartphone,
  Monitor,
  ThumbsUp,
  MessageSquare,
  Share,
  Sparkles,
  CheckCircle2,
  Trash2,
  Loader2,
  X,
  Heart,
  Scissors,
  RotateCw,
  SlidersHorizontal,
  Crop,
  FileEdit
} from 'lucide-react';
import { 
  InstagramIcon, 
  TikTokIcon, 
  LinkedinIcon, 
  XIcon,
  FacebookIcon
} from '../components/ui/BrandIcons';
import { 
  setContent, 
  togglePlatform, 
  setIsScheduling,
  resetPublisher 
} from '../store/publisherSlice';
import aiService from '../api/aiService';
import publisherService from '../api/publisherService';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Publisher = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { content, selectedPlatforms, isScheduling } = useSelector((state) => state.publisher);
  const { currentUser } = useSelector((state) => state.auth);
  
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [activePreviewTab, setActivePreviewTab] = useState('linkedin');
  const [rewriting, setRewriting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);

  const [drafts, setDrafts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  useEffect(() => {
    let intervalId;
    const fetchDrafts = async () => {
      try {
        setLoadingDrafts(true);
        const res = await publisherService.getPosts();
        if (Array.isArray(res)) {
          const draftPosts = res.filter(p => p.status === 'draft');
          const schedPosts = res.filter(p => p.status === 'scheduled');
          setDrafts(draftPosts);
          setScheduledPosts(schedPosts);
        }
      } catch (err) {
        console.error('Failed to load drafts:', err);
      } finally {
        setLoadingDrafts(false);
      }
    };
    
    fetchDrafts();
    intervalId = setInterval(fetchDrafts, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Image Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('free');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const openImageEditor = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRotation(0);
    setAspectRatio('free');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(false);
    setSepia(false);
    setFlipH(false);
    setFlipV(false);
    setIsEditorOpen(true);
  };

  const applyImageEdits = () => {
    const img = new Image();
    img.src = filePreview;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate crop dimensions
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (aspectRatio === '1:1') {
        const size = Math.min(img.width, img.height);
        sx = (img.width - size) / 2;
        sy = (img.height - size) / 2;
        sw = size;
        sh = size;
      } else if (aspectRatio === '16:9') {
        let tw = img.width;
        let th = (img.width * 9) / 16;
        if (th > img.height) {
          th = img.height;
          tw = (img.height * 16) / 9;
        }
        sx = (img.width - tw) / 2;
        sy = (img.height - th) / 2;
        sw = tw;
        sh = th;
      }

      // Draw onto offscreen canvas
      canvas.width = sw;
      canvas.height = sh;

      // Apply Canvas Filters
      let filters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      if (grayscale) filters += ' grayscale(100%)';
      if (sepia) filters += ' sepia(100%)';
      ctx.filter = filters;

      // Position canvas context for rotation and flips
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      // Draw rotated image centered
      ctx.drawImage(img, sx - img.width / 2, sy - img.height / 2, img.width, img.height);

      // Save blob back to selectedFile
      canvas.toBlob((blob) => {
        if (blob) {
          const editedFile = new File([blob], selectedFile?.name || 'edited_image.png', { type: 'image/png' });
          setSelectedFile(editedFile);
          setFilePreview(canvas.toDataURL());
          setIsEditorOpen(false);
        }
      }, 'image/png');
    };
  };
  
  const fileInputRef = useRef(null);

  const handleRewrite = async () => {
    if (!content) return;
    try {
      setRewriting(true);
      const rewritten = await aiService.rewriteCaption(content, 'professional');
      dispatch(setContent(rewritten));
    } catch (error) {
      console.error('Rewrite error:', error);
      const message = error.response?.data?.message || 'Failed to rewrite caption. Please try again.';
      showToast(message, 'error');
    } finally {
      setRewriting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublish = async () => {
    if (!content && !selectedFile) {
      showToast('Please add a caption or media.', 'error');
      return;
    }
    if (content && content.length > 2200) {
      showToast('Caption exceeds the 2200 character limit.', 'error');
      return;
    }
    if (selectedPlatforms.length === 0) {
      showToast('Please select at least one platform.', 'error');
      return;
    }
    if (isScheduling && !scheduledAt) {
      showToast('Please select a schedule date and time.', 'error');
      return;
    }

    try {
      setPublishing(true);
      const formData = new FormData();
      formData.append('caption', content);
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      if (isScheduling) {
        formData.append('scheduledAt', new Date(scheduledAt).toISOString());
        if (editingPostId) {
          await publisherService.updatePost(editingPostId, formData);
          showToast('Scheduled post updated successfully!', 'success');
        } else {
          await publisherService.schedulePost(formData);
          showToast('Post scheduled successfully!', 'success');
        }
        
        // Refresh lists
        const res = await publisherService.getPosts();
        if (Array.isArray(res)) {
          setScheduledPosts(res.filter(p => p.status === 'scheduled'));
          setDrafts(res.filter(p => p.status === 'draft'));
        }
      } else {
        const response = await publisherService.publishPost(formData);
        const results = response.results || [];
        const failed = results.filter(r => !r.success);
        
        if (failed.length === 0) {
          showToast('Post published successfully!', 'success');
        } else if (failed.length === results.length) {
          showToast(`Failed to publish: ${failed[0].error}`, 'error');
        } else {
          showToast(`Partial success. Failed on ${failed.map(f => f.platform).join(', ')}: ${failed[0].error}`, 'warning');
        }
      }
      
      dispatch(resetPublisher());
      setSelectedFile(null);
      setFilePreview(null);
      setScheduledAt('');
      setEditingPostId(null);
    } catch (error) {
      console.error('Publishing error:', error);
      showToast(error.response?.data?.message || 'Failed to process post.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon, color: 'text-[#0077b5]', bgColor: 'bg-[#0077b5]/10' },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon, color: 'text-[#1877f2]', bgColor: 'bg-[#1877f2]/10' },
    { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'text-error', bgColor: 'bg-error/10' },
    { id: 'twitter', name: 'X / Twitter', icon: XIcon, color: 'text-on-surface', bgColor: 'bg-surface-variant' },
  ];

  const handleContentChange = (e) => {
    dispatch(setContent(e.target.value));
  };

  const handleTogglePlatform = (id) => {
    dispatch(togglePlatform(id));
  };

  const charLimit = 2200;
  const charCount = content.length;

  const activePreviewPlatform = platforms.find(p => p.id === activePreviewTab) || platforms[0];
  const previewLabel = activePreviewPlatform.name.toUpperCase();

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-on-surface">Publisher</h1>
          <p className="text-on-surface-variant mt-1">Compose and distribute content across your connected platforms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Editor & Config */}
        <div className="lg:col-span-7 flex flex-col gap-8">

          {/* Active Scheduled Posts Section */}
          {scheduledPosts.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Active Scheduled Posts ({scheduledPosts.length})</span>
                </div>
              </div>
              <div className="flex gap-4 pb-3 custom-scroll-x">
                {scheduledPosts.map((post) => (
                  <div 
                    key={post._id || post.id} 
                    className="flex-shrink-0 w-72 p-4 rounded-2xl bg-surface-container border border-primary/20 hover:border-primary/50 transition-all flex flex-col justify-between gap-3 group relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dispatch(setContent(post.caption));
                              if (post.platforms && post.platforms.length > 0) {
                                post.platforms.forEach(p => {
                                  if (!selectedPlatforms.includes(p.name)) {
                                    dispatch(togglePlatform(p.name));
                                  }
                                });
                              }
                              setScheduledAt(post.scheduledAt ? new Date(new Date(post.scheduledAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
                              dispatch(setIsScheduling(true));
                              setEditingPostId(post._id || post.id);
                            }}
                            className="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                            title="Edit Schedule"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await publisherService.deletePost(post._id || post.id);
                                setScheduledPosts(prev => prev.filter(p => (p._id || p.id) !== (post._id || post.id)));
                                showToast('Scheduled post deleted', 'success');
                              } catch (err) {
                                console.error('Failed to delete scheduled post:', err);
                              }
                            }}
                            className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/15 transition-all cursor-pointer"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface line-clamp-2 leading-relaxed font-sans">{post.caption || '(No caption)'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggested & Saved Drafts Section */}
          {drafts.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">AI Suggested Drafts ({drafts.length})</span>
                </div>
              </div>
              <div className="flex gap-4 pb-3 custom-scroll-x">
                {drafts.map((draft) => (
                  <div 
                    key={draft._id || draft.id} 
                    className="flex-shrink-0 w-72 p-4 rounded-2xl bg-surface-container border border-ghost hover:border-primary/45 transition-all flex flex-col justify-between gap-3 group relative cursor-pointer"
                    onClick={() => {
                      dispatch(setContent(draft.caption));
                      if (draft.platforms && draft.platforms.length > 0) {
                        const plat = draft.platforms[0].name.toLowerCase();
                        if (!selectedPlatforms.includes(plat)) {
                          dispatch(togglePlatform(plat));
                        }
                      }
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {draft.platforms?.[0]?.name || 'Social'}
                        </span>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              await publisherService.deletePost(draft._id || draft.id);
                              setDrafts(prev => prev.filter(d => (d._id || d.id) !== (draft._id || draft.id)));
                            } catch (err) {
                              console.error('Failed to delete draft:', err);
                            }
                          }}
                          className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/15 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Discard Suggestion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-on-surface line-clamp-2 leading-relaxed font-sans">{draft.caption}</p>
                    </div>
                    <span className="text-[9px] text-primary/80 font-bold uppercase tracking-widest flex items-center gap-1 group-hover:text-primary transition-colors mt-1">
                      <Sparkles className="w-3 h-3" /> Use Suggestion &rarr;
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Caption Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Caption</span>
                </div>
                <span className={`text-[10px] font-bold ${charCount > charLimit ? 'text-error animate-pulse' : 'text-[#4CAF50]'}`}>
                    {charCount} / {charLimit}
                </span>
            </div>

            {charCount > charLimit && (
                <div className="bg-error/10 border border-error/20 p-3 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-1 rounded-full bg-error/20 text-error mt-0.5">
                        <X className="w-3 h-3" />
                    </div>
                    <div>
                        <h5 className="text-xs font-bold text-error uppercase tracking-wider mb-0.5">Character Limit Exceeded</h5>
                        <p className="text-[11px] text-error/80 leading-relaxed">
                            Your caption is currently {charCount - charLimit} characters over the {charLimit} limit. Please shorten it to enable publishing.
                        </p>
                    </div>
                </div>
            )}

            <Card level="lowest" className={`p-0 overflow-hidden transition-colors duration-300 ${charCount > charLimit ? 'bg-error/5 border-error/50 shadow-[0_0_15px_rgba(255,82,82,0.15)]' : 'bg-surface-container-low/30 border-ghost'}`}>
                <textarea 
                    value={content}
                    onChange={handleContentChange}
                    placeholder="What's the story today?"
                    className="w-full h-40 p-6 bg-transparent text-base text-on-surface placeholder:text-on-surface-variant/30 resize-none outline-none border-none custom-scroll-y"
                />
                <div className="px-6 py-4 flex items-center justify-between border-t border-ghost/30">
                    <div className="flex items-center gap-5 text-on-surface-variant/60">
                        <button 
                            onClick={() => dispatch(setContent(content + ' ✨'))}
                            className="hover:text-primary transition-colors"
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => dispatch(setContent(content + ' #'))}
                            className="hover:text-primary transition-colors"
                        >
                            <Hash className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => dispatch(setContent(content + ' @'))}
                            className="hover:text-primary transition-colors"
                        >
                            <AtSign className="w-5 h-5" />
                        </button>
                    </div>
                    <button 
                        onClick={handleRewrite}
                        disabled={rewriting || !content}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {rewriting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        {rewriting ? 'Rewriting...' : 'AI Rewrite'}
                    </button>
                </div>
            </Card>
          </div>

          {/* Media Upload Section */}
          <div className="flex flex-col gap-3">
             <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Media</h4>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*"
             />
             
             {filePreview ? (
                <Card level="high" className="p-0 overflow-hidden relative group">
                    {selectedFile?.type.startsWith('video') ? (
                        <video src={filePreview} className="w-full max-h-[480px] object-contain bg-black/20" controls />
                    ) : (
                        <img src={filePreview} className="w-full max-h-[480px] object-contain bg-black/20 font-sans" alt="Preview" />
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {!selectedFile?.type.startsWith('video') && (
                            <button 
                                onClick={openImageEditor}
                                className="p-1.5 rounded-full bg-primary text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer"
                                title="Edit Image"
                            >
                                <FileEdit className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button 
                            onClick={removeFile}
                            className="p-1.5 rounded-full bg-error text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center cursor-pointer"
                            title="Remove File"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-surface-container/80 backdrop-blur-sm border-t border-ghost flex items-center justify-between">
                        <span className="text-[10px] font-bold text-on-surface truncate max-w-[200px]">{selectedFile?.name}</span>
                        <span className="text-[9px] text-on-surface-variant">{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                </Card>
             ) : (
                <Card 
                    level="high" 
                    className="p-0 overflow-hidden border-ghost border-dashed border-2 bg-surface-container-low/20 cursor-pointer hover:bg-surface-container-high/40 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center justify-center py-10 px-6">
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-6 text-primary" />
                        </div>
                        <h3 className="text-sm font-bold mb-1 uppercase tracking-wider">Upload Media</h3>
                        <p className="text-[11px] text-on-surface-variant text-center opacity-70">
                            Drag and drop images or videos, or click to<br/>
                            browse files (Up to 100MB)
                        </p>
                    </div>
                </Card>
             )}
          </div>

          {/* Target Platforms Section */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Target Platforms</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {platforms.map((platform) => {
                const isActive = selectedPlatforms.includes(platform.id);
                const Icon = platform.icon;
                return (
                  <button 
                    key={platform.id}
                    onClick={() => handleTogglePlatform(platform.id)}
                    className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border transition-all duration-300 relative group ${
                      isActive 
                        ? 'bg-primary/10 border-primary shadow-ambient' 
                        : 'bg-surface-container-low border-ghost hover:border-outline-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${platform.bgColor} ${platform.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider group-hover:text-on-surface transition-colors">{platform.name}</span>
                    
                    {isActive && (
                        <div className="absolute bottom-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
            
            {/* Preview Window Frame */}
            <Card level="high" className="p-0 overflow-hidden shadow-2xl border-ghost flex flex-col min-h-[520px]">
                {/* Browser-style bar */}
                <div className="p-4 flex items-center justify-between border-b border-ghost bg-surface-container-low">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5 mr-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-primary/40"></div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant ml-2">
                            {previewLabel} PREVIEW
                        </span>
                    </div>
                    {/* Platform Tab Switcher */}
                    <div className="flex bg-surface-container-highest/30 p-1 rounded-xl border border-ghost">
                        {platforms.map(p => {
                            const Icon = p.icon;
                            const isActive = p.id === activePreviewTab;
                            return (
                                <button 
                                    key={p.id}
                                    onClick={() => setActivePreviewTab(p.id)}
                                    className={`p-2 rounded-lg transition-all ${isActive ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Preview Content Area */}
                <div className="flex-1 p-6 bg-surface-container-lowest flex justify-center items-start overflow-hidden">
                    <div className={`flex flex-col gap-4 transition-all duration-500 ease-in-out ${
                        previewDevice === 'mobile' 
                        ? 'w-[320px] min-h-[580px] max-h-[580px] border-[12px] border-surface-container rounded-[48px] p-5 shadow-2xl overflow-y-auto scrollbar-hide bg-surface' 
                        : 'w-full max-w-md h-full'
                     }`}>
                        <div className="flex items-start gap-3 flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden border border-ghost flex-shrink-0">
                                <img src={currentUser?.avatarUrl ? (currentUser.avatarUrl.startsWith('http') ? currentUser.avatarUrl : `${API_BASE}${currentUser.avatarUrl}`) : "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold">
                                        {(currentUser?.firstName || currentUser?.lastName) 
                                            ? `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() 
                                            : 'SocioSync User'}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant">• 1st</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant leading-tight">{currentUser?.plan || 'Free'} Strategist at SocioSync</span>
                                <div className="flex items-center gap-1 text-[9px] text-on-surface-variant mt-0.5">
                                    <span>Just now</span>
                                    <span>•</span>
                                    <Globe className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-on-surface leading-relaxed min-h-[60px] whitespace-pre-wrap flex-shrink-0">
                            {content ? (
                                <>
                                    {isExpandedPreview || content.length <= 150 
                                        ? content 
                                        : `${content.substring(0, 150)}... `}
                                    {content.length > 150 && (
                                        <button 
                                            onClick={() => setIsExpandedPreview(!isExpandedPreview)}
                                            className="text-primary hover:text-primary-dim font-medium ml-1 transition-colors"
                                        >
                                            {isExpandedPreview ? 'show less' : 'show more'}
                                        </button>
                                    )}
                                </>
                            ) : <span className="opacity-20 italic">What's the story today?</span>}
                        </div>

                        {filePreview ? (
                            <div className="w-full rounded-xl bg-surface-container overflow-hidden border border-ghost max-h-[480px] flex items-center justify-center flex-shrink-0">
                                {selectedFile?.type.startsWith('video') ? (
                                    <video src={filePreview} className="w-full max-h-[480px] object-contain" />
                                ) : (
                                    <img src={filePreview} className="w-full max-h-[480px] object-contain" alt="Media" />
                                )}
                            </div>
                        ) : (
                            <div className="aspect-video w-full rounded-xl bg-surface-container border border-ghost flex flex-col items-center justify-center opacity-40 flex-shrink-0">
                                 <ImageIcon className="w-10 h-10 mb-2" />
                                 <span className="text-xs font-medium">Media Preview Area</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-ghost/30 text-on-surface-variant flex-shrink-0">
                            <div className="flex items-center gap-1 hover:text-on-surface cursor-pointer">
                                {activePreviewTab === 'instagram' || activePreviewTab === 'facebook' ? (
                                    <Heart className="w-3.5 h-3.5" />
                                ) : (
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                )}
                                <span className="text-[10px] font-bold uppercase">{activePreviewTab === 'instagram' ? 'Like' : (activePreviewTab === 'facebook' ? 'Like' : 'Like')}</span>
                            </div>
                            <div className="flex items-center gap-1 hover:text-on-surface cursor-pointer">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase">{activePreviewTab === 'instagram' ? 'Comment' : 'Comment'}</span>
                            </div>
                            {activePreviewTab !== 'instagram' && (
                                <div className="flex items-center gap-1 hover:text-on-surface cursor-pointer">
                                    <Share className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase">Share</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 hover:text-on-surface cursor-pointer">
                                <Send className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase">{activePreviewTab === 'twitter' ? 'Post' : 'Send'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Device Switcher */}
                <div className="p-6 flex justify-center gap-4 bg-surface-container-low/30 border-t border-ghost">
                    <button 
                        onClick={() => setPreviewDevice('desktop')}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${previewDevice === 'desktop' ? 'bg-primary text-on-primary shadow-ambient' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
                    >
                        <Monitor className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setPreviewDevice('mobile')}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${previewDevice === 'mobile' ? 'bg-primary text-on-primary shadow-ambient' : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'}`}
                    >
                        <Smartphone className="w-5 h-5" />
                    </button>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
                {isScheduling && (
                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-container border border-primary/20 animate-in slide-in-from-bottom-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Schedule Publication</span>
                        <input 
                            type="datetime-local" 
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="bg-transparent text-sm outline-none text-on-surface w-full"
                        />
                    </div>
                )}
                <div className="flex gap-4">
                    <button 
                        onClick={() => dispatch(setIsScheduling(!isScheduling))}
                        className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${isScheduling ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-ghost text-on-surface-variant hover:border-outline-variant'}`}
                    >
                        <Calendar className="w-4 h-4" />
                        {isScheduling ? 'Cancel' : 'Schedule'}
                    </button>
                    <button 
                        onClick={handlePublish}
                        disabled={publishing || charCount > charLimit}
                        className="flex-[2] h-12 rounded-2xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
                    >
                        {publishing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {publishing ? 'Processing...' : (isScheduling ? (editingPostId ? 'Update Schedule' : 'Confirm Schedule') : 'Publish Now')}
                    </button>
                </div>
                <button 
                    onClick={() => {
                        dispatch(resetPublisher());
                        setSelectedFile(null);
                        setFilePreview(null);
                        setEditingPostId(null);
                    }}
                    className="text-xs font-bold text-on-surface-variant hover:text-error text-center transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard & Clear
                </button>
            </div>
        </div>
      </div>

      {/* Premium In-App Image Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-ghost w-full max-w-4xl rounded-[2.5rem] p-6 md:p-8 shadow-ambient flex flex-col gap-6 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ghost pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-on-surface">Creative Media Studio</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Adjust, crop & refine your post assets</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (2 Columns on MD+) */}
            <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row gap-6 min-h-0">
              
              {/* Left Column: Visual Sandbox Preview */}
              <div className="flex-1 bg-black/40 border border-ghost rounded-[2rem] p-4 flex items-center justify-center relative min-h-[300px] md:min-h-0 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div 
                    className={`relative overflow-hidden transition-all duration-300 shadow-2xl flex items-center justify-center ${
                      aspectRatio === '1:1' ? 'aspect-square max-w-[280px] w-full border-2 border-primary/50' : 
                      aspectRatio === '16:9' ? 'aspect-video max-w-[380px] w-full border-2 border-primary/50' : 
                      'max-h-[320px] max-w-full'
                    }`}
                  >
                    <img 
                      src={filePreview} 
                      alt="Editor Sandbox"
                      className={`max-w-full max-h-full transition-all duration-200 ${
                        aspectRatio !== 'free' ? 'w-full h-full object-cover' : 'object-contain'
                      }`}
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale ? 100 : 0}%) sepia(${sepia ? 100 : 0}%)`,
                        transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`
                      }}
                    />
                  </div>
                </div>
                
                {/* Visual Ratio Guide Tag */}
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white/80 uppercase tracking-widest">
                  Ratio: {aspectRatio === 'free' ? 'Freeform' : aspectRatio}
                </div>
              </div>

              {/* Right Column: Editing Controls Panel */}
              <div className="w-full md:w-80 flex flex-col gap-6 overflow-y-auto pr-1 md:max-h-full">
                
                {/* 1. Crop / Aspect Ratio presets */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                    <Crop className="w-3.5 h-3.5 text-primary" />
                    Crop Preset
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['free', '1:1', '16:9'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                          aspectRatio === ratio 
                            ? 'bg-primary text-on-primary border-primary shadow-sm' 
                            : 'bg-surface-container border-ghost text-on-surface-variant hover:border-outline-variant'
                        }`}
                      >
                        {ratio === 'free' ? 'Free' : ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Rotations & Flips */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-primary" />
                    Transform Controls
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="flex-1 py-2.5 rounded-xl bg-surface-container border border-ghost hover:border-outline-variant transition-all text-[10px] font-bold text-on-surface uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate 90°
                    </button>
                    <button
                      onClick={() => setFlipH(prev => !prev)}
                      className={`flex-1 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        flipH ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-ghost text-on-surface hover:border-outline-variant'
                      }`}
                    >
                      Flip H
                    </button>
                    <button
                      onClick={() => setFlipV(prev => !prev)}
                      className={`flex-1 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        flipV ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-ghost text-on-surface hover:border-outline-variant'
                      }`}
                    >
                      Flip V
                    </button>
                  </div>
                </div>

                {/* 3. Filters & Sliders */}
                <div className="flex flex-col gap-4 border-t border-ghost pt-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                    Fine-Tuning Filters
                  </span>

                  {/* Brightness */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                      <span>Brightness</span>
                      <span>{brightness}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="w-full accent-primary bg-surface-container rounded-lg appearance-none h-1"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                      <span>Contrast</span>
                      <span>{contrast}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="150" 
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                      className="w-full accent-primary bg-surface-container rounded-lg appearance-none h-1"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                      <span>Saturation</span>
                      <span>{saturation}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={saturation}
                      onChange={(e) => setSaturation(e.target.value)}
                      className="w-full accent-primary bg-surface-container rounded-lg appearance-none h-1"
                    />
                  </div>

                  {/* Quick Filters Toggles */}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setGrayscale(p => !p)}
                      className={`flex-1 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                        grayscale ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container border-ghost text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >
                      B & W
                    </button>
                    <button
                      onClick={() => setSepia(p => !p)}
                      className={`flex-1 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${
                        sepia ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container border-ghost text-on-surface-variant hover:border-outline-variant'
                      }`}
                    >
                      Sepia Vintage
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-3 border-t border-ghost pt-4">
              <Button 
                onClick={() => setIsEditorOpen(false)}
                variant="secondary"
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                Cancel Edits
              </Button>
              <Button 
                onClick={applyImageEdits}
                variant="primary"
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-primary/20"
              >
                Apply Changes
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Publisher;

