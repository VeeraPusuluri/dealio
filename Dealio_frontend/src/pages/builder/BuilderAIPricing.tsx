import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { priceRecommendations, aiDescriptionTemplates } from '@/data/aiEngine';
import { projects } from '@/data/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, FileText, Sparkles, Copy, Languages } from 'lucide-react';
import { toast } from 'sonner';

const BuilderAIPricing = () => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [generatedDescs, setGeneratedDescs] = useState<{ lang: string; text: string }[]>([]);

  const rec = priceRecommendations.find(r => r.projectId === selectedProject);

  const handleGenerateDesc = () => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;
    const en = `Discover exceptional living at ${project.name} by ${project.builder}, located in ${project.location}, ${project.city}. Choose from spacious ${project.bhkTypes.join(' & ')} apartments starting at ₹${(project.priceRange[0] / 100000).toFixed(0)}L. Enjoy world-class amenities including ${project.amenities.slice(0, 3).join(', ')}. RERA registered (${project.rera}). Possession by ${project.possessionDate}. ${project.available} premium units available — book your site visit today.`;
    const hi = `${project.location}, ${project.city} में स्थित ${project.name} में असाधारण जीवन का अनुभव करें। ${project.bhkTypes.join(' और ')} अपार्टमेंट ₹${(project.priceRange[0] / 100000).toFixed(0)}L से शुरू। ${project.amenities.slice(0, 3).join(', ')} जैसी विश्वस्तरीय सुविधाएं। RERA पंजीकृत। कब्ज़ा: ${project.possessionDate}।`;
    setGeneratedDescs([{ lang: 'English', text: en }, { lang: 'Hindi', text: hi }]);
    toast.success('AI descriptions generated!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">AI Intelligence</h2>
            <p className="text-sm text-slate-400">Price recommendations & SEO listing descriptions</p>
          </div>
        </div>

        <Tabs defaultValue="pricing">
          <TabsList className="bg-white border border-slate-200 shadow-sm rounded-xl p-1">
            <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm">Price Recommendation</TabsTrigger>
            <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm">AI Description Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="mt-4 space-y-4">
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full max-w-md px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {rec ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="la-card p-5 space-y-4">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2"><TrendingUp size={16} className="text-teal-500" /> Price Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-400">Current Price</p>
                      <p className="text-lg font-bold text-slate-800">₹{rec.currentPriceSqft.toLocaleString('en-IN')}/sqft</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50">
                      <p className="text-xs text-emerald-600">Recommended</p>
                      <p className="text-lg font-bold text-emerald-700">₹{rec.recommendedPriceSqft.toLocaleString('en-IN')}/sqft</p>
                      <p className="text-[10px] text-emerald-600">+{(((rec.recommendedPriceSqft - rec.currentPriceSqft) / rec.currentPriceSqft) * 100).toFixed(1)}% increase</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{rec.reasoning}</p>
                </div>
                <div className="la-card p-5">
                  <h3 className="font-semibold text-slate-700 mb-3">Comparable Projects</h3>
                  <div className="space-y-2">
                    {rec.comparables.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.location} • {c.distance}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">₹{c.priceSqft.toLocaleString('en-IN')}/sqft</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center">
                <Brain size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No price recommendation available for this project yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="description" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="flex-1 max-w-md px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={handleGenerateDesc} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
                <Sparkles size={14} /> Generate SEO Descriptions
              </button>
            </div>

            {generatedDescs.length > 0 && (
              <div className="space-y-4">
                {generatedDescs.map((d, i) => (
                  <div key={i} className="la-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-teal-600 flex items-center gap-1"><Languages size={12} /> {d.lang}</span>
                      <button onClick={() => { navigator.clipboard.writeText(d.text); toast.success('Copied!'); }} className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"><Copy size={12} /> Copy</button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{d.text}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BuilderAIPricing;