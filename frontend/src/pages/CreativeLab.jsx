import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Type, 
  Video, 
  Layout, 
  History, 
  MoreHorizontal,
  Download,
  Copy,
  Plus,
  FileEdit,
  Wand2,
  Hand,
  Briefcase,
  Trophy,
  Share2,
  RefreshCw,
  Grid,
  Settings2,
  Loader2,
  Check,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import aiService from '../api/aiService';
import { useToast } from '../context/ToastContext';

// Rotating messages for Pollinations AI
const POLLINATIONS_LOADING_MESSAGES = [
  'Crafting your image with Pollinations AI...',
  'Generating fast, high-quality results...',
  'Almost ready ✨',
];

const CreativeLab = () => {
  const { showToast } = useToast();
  const [textPrompt, setTextPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('A futuristic storefront for a green sustainable brand, highly detailed, cinematic lighting');
  const [selectedTone, setSelectedTone] = useState('Humanized');
  const [textOutput, setTextOutput] = useState('');
  const [currentTextCreationId, setCurrentTextCreationId] = useState(null);
  const [imageOutputs, setImageOutputs] = useState([]);
  const [currentImageCreationId, setCurrentImageCreationId] = useState(null);
  const [recentCreations, setRecentCreations] = useState([]);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  
  const [generatingText, setGeneratingText] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const tones = [
    { name: 'Humanized', id: 'humanized', icon: Hand },
    { name: 'Professional', id: 'professional', icon: Briefcase },
    { name: 'Casual', id: 'casual', icon: Trophy },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  // Rotate loading messages while Pollinations is generating
  useEffect(() => {
    if (!generatingImages) return;
    setLoadingMessageIdx(0);
    const interval = setInterval(() => {
      setLoadingMessageIdx(prev => (prev + 1) % POLLINATIONS_LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [generatingImages]);

  const fetchHistory = async () => {
    try {
      const history = await aiService.getRecentCreations();
      setRecentCreations(history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleGenerateCopy = async () => {
    if (!textPrompt) return;
    try {
      setGeneratingText(true);
      const toneId = tones.find(t => t.name === selectedTone)?.id || 'humanized';
      const result = await aiService.generateCopy(textPrompt, toneId);
      setTextOutput(result.generatedText);
      setCurrentTextCreationId(result.creationId);
      fetchHistory();
    } catch (err) {
      console.error('Generate Copy Error:', err);
      const msg = err.response?.data?.message || 'Failed to generate copy. Please try again.';
      showToast(msg, 'error');
    } finally {
      setGeneratingText(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!imagePrompt) return;
    try {
      setGeneratingImages(true);

      // Step 1: Get the Gemini-enhanced prompt from our backend
      let enhancedPrompt = imagePrompt;
      try {
        const config = await aiService.generateImages(imagePrompt);
        if (config && config.enhancedPrompt) {
          enhancedPrompt = config.enhancedPrompt;
        }
      } catch (enhanceErr) {
        console.warn('[Image Gen] Prompt enhancement failed, using original prompt:', enhanceErr.message);
      }

      // Step 2: Fetch image directly from Pollinations.ai
      console.log('[Image Gen] Fetching from Pollinations.ai:', enhancedPrompt);
      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
      
      const imageRes = await fetch(pollinationsUrl);
      if (!imageRes.ok) {
        throw new Error(`Pollinations API failed (HTTP ${imageRes.status})`);
      }

      const blob = await imageRes.blob();
      if (blob.size < 1000) {
        throw new Error('Received response too small to be a valid image.');
      }

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        setImageOutputs([base64data]);
        setImageLoaded(false);

        // Save to history
        try {
          const saved = await aiService.saveImageCreation(imagePrompt, [base64data]);
          setCurrentImageCreationId(saved.creationId);
          fetchHistory();
        } catch (saveErr) {
          console.error('Failed to save image to history:', saveErr);
        }
      };

      showToast('Image generated successfully! ✨', 'success');

    } catch (err) {
      console.error('Generate Images Error:', err);
      const msg = err.message || 'Failed to generate image. Please try again.';
      showToast(`❌ Image generation failed: ${msg}`, 'error');
    } finally {
      setGeneratingImages(false);
    }
  };

  const handleCopy = () => {
    if (!textOutput) return;
    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportText = async (format) => {
    if (!currentTextCreationId) return;
    try {
      const result = await aiService.exportCreation(currentTextCreationId, format);
      // For text/md, the backend sends the content directly
      // In this setup, we'll just handle it as a download if needed or alert
      showToast(`Text exported as ${format.toUpperCase()} successfully.`, 'success');
    } catch (err) {
      showToast('Export failed.', 'error');
    }
  };

  const handleViewAll = async () => {
    try {
      const history = await aiService.getRecentCreations(10);
      setRecentCreations(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch full history:', err);
    }
  };

  const handleSelectCreation = (item) => {
    if (item.type === 'text') {
      setTextPrompt(item.prompt || '');
      setTextOutput(item.output || '');
      setSelectedTone(tones.find(t => t.id === item.tone)?.name || 'Humanized');
      setCurrentTextCreationId(item.id);
      // Scroll to text generator
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setImagePrompt(item.prompt || '');
      setImageOutputs(item.imageUrls || []);
      setCurrentImageCreationId(item.id);
      setImageLoaded(false); // Reset loaded state when selecting history
      // Scroll to image generator
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface tracking-tight">AI Creative Lab</h1>
          <p className="text-on-surface-variant text-sm md:text-base">
            Harness the power of SocioSync AI to craft high-conversion content in seconds.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-highest/50 px-3 py-1.5 rounded-full border-ghost w-fit">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Image: Pollinations AI</span>
        </div>
      </div>

      {/* Main Generators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Text Generator */}
        <div className="glass p-6 md:p-8 rounded-[2rem] border-ghost flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileEdit className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-on-surface">Text Generator</h3>
            </div>
            <span className="text-[10px] font-bold bg-secondary/20 text-secondary px-2 py-0.5 rounded-md uppercase tracking-widest">Active</span>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Content Prompt</label>
            <textarea 
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="e.g., Write a catchy Instagram caption for a new sustainable fashion line launch..."
              className="w-full h-32 bg-surface-container-low border-ghost rounded-2xl p-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none font-body"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Select Tone</label>
            <div className="grid grid-cols-3 gap-3">
              {tones.map((tone) => (
                <button
                  key={tone.name}
                  onClick={() => setSelectedTone(tone.name)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    selectedTone === tone.name 
                      ? 'bg-primary/10 border-primary/40 text-primary shadow-sm' 
                      : 'bg-surface-container-low border-ghost text-on-surface-variant hover:border-outline-variant'
                  }`}
                >
                  <tone.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tone.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Button 
            variant="primary" 
            onClick={handleGenerateCopy}
            disabled={generatingText || !textPrompt}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-ambient font-bold uppercase tracking-widest text-xs"
          >
            {generatingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {generatingText ? 'Generating...' : 'Generate Copy'}
          </Button>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Generated Output</label>
            <div className="glass p-5 rounded-2xl border-ghost flex flex-col gap-4 min-h-[120px]">
              {textOutput ? (
                <>
                  <p className="text-sm text-on-surface leading-relaxed font-body whitespace-pre-wrap">
                    {textOutput}
                  </p>
                  <div className="flex items-center gap-4 text-on-surface-variant pt-2">
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-[10px] font-bold hover:text-on-surface transition-colors uppercase tracking-wider"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button 
                      onClick={() => handleExportText('txt')}
                      className="flex items-center gap-1.5 text-[10px] font-bold hover:text-on-surface transition-colors uppercase tracking-wider"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic text-sm">
                  Your generated copy will appear here...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Generator */}
        <div className="glass p-6 md:p-8 rounded-[2rem] border-ghost flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-display font-bold text-on-surface">Image Generator</h3>
            </div>
            <span className="text-[10px] font-bold bg-secondary/20 text-secondary px-2 py-0.5 rounded-md uppercase tracking-widest">Active</span>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-low border-ghost rounded-2xl p-1.5 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <input 
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Visual prompt: A futuristic storefront..."
              className="flex-1 bg-transparent border-none py-2.5 pl-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-body min-w-0"
            />
            <button 
              onClick={handleGenerateImages}
              disabled={generatingImages || !imagePrompt}
              className="bg-primary text-on-primary-fixed text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl hover:brightness-110 transition-all whitespace-nowrap shadow-sm flex items-center gap-2"
            >
              {generatingImages && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Generate
            </button>
          </div>

          <div className="flex flex-col items-center">
            {generatingImages ? (
              /* FLUX.1-dev generation in progress — rich loading UI */
              <div className="w-full max-w-lg aspect-square rounded-2xl bg-surface-container-low border-ghost border flex flex-col items-center justify-center gap-5 relative overflow-hidden">
                {/* Animated shimmer background */}
                <div className="absolute inset-0 opacity-10"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, transparent 60%)' }}/>
                <div className="relative flex flex-col items-center gap-5 px-6 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -inset-1 rounded-2xl border border-primary/20 animate-ping" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-on-surface transition-all duration-500">
                      {POLLINATIONS_LOADING_MESSAGES[loadingMessageIdx]}
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">Pollinations AI</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-48 h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <p className="text-[10px] text-on-surface-variant/60">This usually takes less than 15 seconds</p>
                </div>
              </div>
            ) : imageOutputs && imageOutputs.length > 0 ? (
              <div className="w-full max-w-lg aspect-square rounded-2xl overflow-hidden border-ghost shadow-xl group relative bg-surface-container-low mx-auto flex items-center justify-center">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-container-low z-10">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-on-surface-variant animate-pulse font-medium">Loading image...</p>
                  </div>
                )}
                <img 
                  key={imageOutputs[0]}
                  src={imageOutputs[0]} 
                  alt="AI Masterpiece" 
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                {imageLoaded && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                    <a 
                      href={imageOutputs[0]} 
                      download="SocioSync_Masterpiece.png"
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
                    >
                        <Download className="w-6 h-6" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-lg aspect-square rounded-3xl bg-surface-container-low border-2 border-ghost border-dashed flex flex-col items-center justify-center gap-4 text-on-surface-variant/30">
                 <div className="p-6 rounded-full bg-surface-container">
                    <ImageIcon className="w-12 h-12" />
                 </div>
                 <p className="text-sm font-medium">Your masterpiece will appear here</p>
                 <p className="text-[10px] uppercase tracking-widest">Powered by Pollinations AI</p>
              </div>
            )}
          </div>

          <button 
            onClick={handleGenerateImages}
            disabled={generatingImages || !imagePrompt}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-surface-container-low border-ghost text-[10px] font-bold text-on-surface hover:bg-surface-container-high transition-all uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generatingImages ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>

      </div>

      {/* Recent Creations Section */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-bold text-on-surface uppercase tracking-widest text-xs cursor-pointer hover:text-primary transition-colors" onClick={handleViewAll}>Recent Creations</h3>
          <button 
            onClick={handleViewAll}
            className="text-[10px] font-bold text-on-surface-variant hover:text-on-surface uppercase tracking-widest"
          >
            View All
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {recentCreations.slice(0, 6).map((item) => (
            <div 
              key={item.id}
              onClick={() => handleSelectCreation(item)}
              className="flex-shrink-0 w-64 p-4 rounded-[1.5rem] bg-surface-container-low border-ghost flex items-center gap-4 group hover:bg-surface-container-highest transition-all cursor-pointer shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container-high border-ghost flex items-center justify-center group-hover:bg-primary/20 transition-colors overflow-hidden">
                {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                ) : (
                    <Type className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="text-xs font-bold text-on-surface truncate">{item.title}</span>
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-medium">
                  <span className="capitalize">{item.type}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => { setTextPrompt(''); setImagePrompt(''); setTextOutput(''); setImageOutputs([]); }}
            className="flex-shrink-0 w-48 p-4 rounded-[1.5rem] bg-surface-container-low border-ghost border-dashed flex items-center justify-center gap-3 text-[10px] font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-low border-ghost w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-ghost flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-bold text-on-surface">Recent Creations History</h2>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCreations.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectCreation(item)}
                    className="p-4 rounded-2xl bg-surface-container-high border-ghost hover:bg-surface-container-highest transition-all cursor-pointer group flex flex-col gap-3"
                  >
                    <div className="aspect-video w-full rounded-xl bg-surface-container-low border-ghost overflow-hidden flex items-center justify-center relative">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Type className="w-8 h-8 text-on-surface-variant/30" />
                      )}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[8px] font-bold text-white uppercase tracking-widest">
                        {item.type}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-on-surface line-clamp-2">{item.title}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              {recentCreations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
                  No creations found yet.
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-ghost bg-surface-container-low flex justify-end">
              <Button variant="secondary" onClick={() => setIsHistoryModalOpen(false)} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreativeLab;
