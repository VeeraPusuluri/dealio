import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { contentLibrary, socialPosts } from '@/data/socialMedia';
import { projects } from '@/data/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Send, Clock, CheckCircle, AlertCircle, Instagram, Linkedin, MessageSquare, Facebook, Sparkles, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const platformIcons: Record<string, React.ElementType> = { instagram: Instagram, facebook: Facebook, linkedin: Linkedin, whatsapp: MessageSquare };
const platformColors: Record<string, string> = { instagram: '#E4405F', facebook: '#1877F2', linkedin: '#0A66C2', whatsapp: '#25D366' };
const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  Draft: { icon: Clock, color: 'text-muted-foreground' },
  Scheduled: { icon: Clock, color: 'text-amber-600' },
  Published: { icon: CheckCircle, color: 'text-green-600' },
  Failed: { icon: AlertCircle, color: 'text-destructive' },
};

const CPContentStudio = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');

  const handleGenerate = () => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) { toast.error('Select a project first'); return; }
    const caption = `🏠 ${project.name} by ${project.builder}\n📍 ${project.location}, ${project.city}\n💰 Starting ₹${(project.priceRange[0] / 100000).toFixed(0)}L\n🏗️ ${project.available} units available | Possession: ${project.possessionDate}\n\n${project.amenities.slice(0, 4).map(a => `✅ ${a}`).join('\n')}\n\n#${project.name.replace(/\s/g, '')} #${project.city}RealEstate #DreamHome #PropertyInvestment`;
    setGeneratedCaption(caption);
    toast.success('AI caption generated!');
  };

  const handlePublish = () => {
    if (!generatedCaption || selectedPlatforms.length === 0) { toast.error('Select platforms and generate caption'); return; }
    toast.success(`Post ${scheduleDate ? 'scheduled' : 'published'} to ${selectedPlatforms.join(', ')}!`);
    setGeneratedCaption(''); setSelectedPlatforms([]); setScheduleDate('');
  };

  const togglePlatform = (p: string) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs defaultValue="create">
          <TabsList>
            <TabsTrigger value="create">Create Post</TabsTrigger>
            <TabsTrigger value="library">Content Library</TabsTrigger>
            <TabsTrigger value="history">Post History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg p-5 border border-border space-y-4">
                <h3 className="font-semibold text-card-foreground">1-Click Post Generator</h3>
                <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
                </select>
                <button onClick={handleGenerate} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90">
                  <Sparkles size={16} /> Generate AI Caption + Hashtags
                </button>
                {generatedCaption && (
                  <div className="space-y-3">
                    <textarea value={generatedCaption} onChange={e => setGeneratedCaption(e.target.value)} rows={8} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none text-foreground" />
                    <button onClick={() => { navigator.clipboard.writeText(generatedCaption); toast.success('Copied!'); }} className="text-xs text-primary flex items-center gap-1"><Copy size={12} /> Copy</button>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg p-5 border border-border space-y-4">
                <h3 className="font-semibold text-card-foreground">Publish Settings</h3>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Select platforms</p>
                  <div className="flex gap-2">
                    {(['instagram', 'facebook', 'linkedin', 'whatsapp'] as const).map(p => {
                      const Icon = platformIcons[p];
                      const active = selectedPlatforms.includes(p);
                      return (
                        <button key={p} onClick={() => togglePlatform(p)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted'}`}>
                          <Icon size={16} style={active ? { color: platformColors[p] } : {}} /> {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Image format (auto-resized)</p>
                  <div className="flex gap-2">
                    {['1:1 Feed', '9:16 Story', '16:9 Cover'].map(f => (
                      <span key={f} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Schedule (optional)</p>
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground" />
                  <p className="text-[10px] text-muted-foreground mt-1">💡 Best time to post: Tue & Thu, 6–8 PM IST</p>
                </div>
                <button onClick={handlePublish} className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90">
                  <Send size={16} /> {scheduleDate ? 'Schedule Post' : 'Publish Now'}
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">Builder-approved content only. CPs can share from this library — no unauthorized edits.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentLibrary.map(item => (
                <div key={item.id} className="bg-card rounded-lg border border-border overflow-hidden">
                  <img src={item.imageUrl} alt={item.projectName} className="w-full h-40 object-cover" />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{item.type}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium">✅ Approved</span>
                    </div>
                    <p className="text-sm font-semibold text-card-foreground">{item.projectName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
                    <div className="flex flex-wrap gap-1">{item.hashtags.map(h => <span key={h} className="text-[10px] text-primary">{h}</span>)}</div>
                    <button onClick={() => { setGeneratedCaption(item.caption + '\n\n' + item.hashtags.join(' ')); setSelectedProject(item.projectId); toast.success('Loaded into editor'); }} className="w-full py-1.5 rounded bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">
                      Use This Content
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="bg-card rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-4 py-3 font-medium">Project</th><th className="px-4 py-3 font-medium">Platforms</th>
                  <th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Reach</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th><th className="px-4 py-3 font-medium text-right">Engagement</th>
                </tr></thead>
                <tbody>
                  {socialPosts.map(post => {
                    const cfg = statusConfig[post.status];
                    return (
                      <tr key={post.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-card-foreground font-medium">{post.projectName}</td>
                        <td className="px-4 py-3"><div className="flex gap-1">{post.platforms.map(p => { const I = platformIcons[p]; return <I key={p} size={14} style={{ color: platformColors[p] }} />; })}</div></td>
                        <td className="px-4 py-3"><span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}><cfg.icon size={12} /> {post.status}</span></td>
                        <td className="px-4 py-3 text-right text-card-foreground">{post.reach?.toLocaleString('en-IN') || '—'}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{post.leads ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-card-foreground">{post.engagement?.toLocaleString('en-IN') || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CPContentStudio;
