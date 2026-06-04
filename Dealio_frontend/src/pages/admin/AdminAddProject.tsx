import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { adminApi, builderApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, MapPin, IndianRupee, Layers, Sparkles,
  Loader2, CheckCircle2, Search, Shield, Calendar as CalendarIcon,
  Video, Percent, ChevronDown, User,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────── */
interface Builder {
  id: number;
  companyName: string | null;
  user: { id: number; fullName: string | null; phone: string | null; email: string | null };
}

/* ── Constants ───────────────────────────────────────────────────── */
const PROJECT_TYPES   = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Mixed Use'];
const BHK_OPTIONS     = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Penthouse'];
const STATUS_OPTIONS  = [
  { value: 'ACTIVE',             label: 'Active / Selling'       },
  { value: 'PRE_LAUNCH',         label: 'Pre-Launch'             },
  { value: 'NEW_LAUNCH',         label: 'New Launch'             },
  { value: 'LAUNCHED',           label: 'Launched'               },
  { value: 'UNDER_CONSTRUCTION', label: 'Under Construction'     },
  { value: 'READY_TO_MOVE',      label: 'Ready to Move'          },
  { value: 'CLOSING_SOON',       label: 'Closing Soon'           },
];
const CITY_OPTIONS    = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai', 'Kolkata', 'Ahmedabad'];
const AMENITY_OPTIONS = [
  'Swimming Pool', 'Gym', 'Clubhouse', "Children's Play Area", 'Jogging Track',
  'Tennis Court', 'Basketball Court', 'Indoor Games', 'Party Hall', 'Co-working Space',
  'EV Charging', 'Solar Power', 'Rainwater Harvesting', '24hr Security', 'CCTV',
  'Power Backup', 'Intercom', 'Vastu Compliant', 'Gated Community', 'Visitor Parking',
  'Landscaped Gardens', 'Senior Citizen Area',
];
const NEARBY_OPTIONS  = ['Metro Station', 'Airport', 'IT Park', 'Hospital', 'School', 'Mall', 'Highway'];

/* ── Helpers ─────────────────────────────────────────────────────── */
const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';
const lbl = 'text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] block mb-1.5';

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-card rounded-2xl border border-border p-6 space-y-5">{children}</div>;
}
function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-1">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
        <Icon size={15} className="text-white" />
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-foreground">{title}</h3>
        {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={lbl}>{label}</label>{children}</div>;
}

/* ── Toggle chip ─────────────────────────────────────────────────── */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
        active ? 'text-white border-transparent shadow-sm' : 'bg-card border-border text-muted-foreground hover:border-ring hover:text-foreground'
      }`}
      style={active ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' } : undefined}>
      {label}
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
const AdminAddProject = () => {
  const navigate = useNavigate();
  const [builders, setBuilders]         = useState<Builder[]>([]);
  const [builderSearch, setBuilderSearch] = useState('');
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [showBuilderDrop, setShowBuilderDrop] = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // Form fields
  const [name, setName]                 = useState('');
  const [projectType, setProjectType]   = useState('Apartment');
  const [description, setDescription]   = useState('');
  const [status, setStatus]             = useState('ACTIVE');
  const [city, setCity]                 = useState('');
  const [locality, setLocality]         = useState('');
  const [address, setAddress]           = useState('');
  const [pincode, setPincode]           = useState('');
  const [landmark, setLandmark]         = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [priceMin, setPriceMin]         = useState('');
  const [priceMax, setPriceMax]         = useState('');
  const [pricePerSqftMin, setPricePerSqftMin] = useState('');
  const [pricePerSqftMax, setPricePerSqftMax] = useState('');
  const [commissionValue, setCommissionValue] = useState('');
  const [commissionStructure, setCommissionStructure] = useState('');
  const [cpIncentive, setCpIncentive]   = useState('');
  const [totalUnits, setTotalUnits]     = useState('');
  const [availableUnits, setAvailableUnits] = useState('');
  const [towers, setTowers]             = useState('');
  const [floorsPerTower, setFloorsPerTower] = useState('');
  const [configurations, setConfigurations] = useState<string[]>([]);
  const [amenities, setAmenities]       = useState<string[]>([]);
  const [nearbyHighlights, setNearbyHighlights] = useState<string[]>([]);
  const [reraNumber, setReraNumber]     = useState('');
  const [reraExpiry, setReraExpiry]     = useState('');
  const [possessionDate, setPossessionDate] = useState('');
  const [videoUrl, setVideoUrl]         = useState('');
  const [featured, setFeatured]         = useState(false);
  const [closingSoon, setClosingSoon]   = useState(false);
  const [published, setPublished]       = useState(true);
  const [landArea, setLandArea]         = useState('');
  const [maintenanceCharges, setMaintenanceCharges] = useState('');
  // Builder profile fields
  const [builderContactPhone, setBuilderContactPhone] = useState('');
  const [builderContactEmail, setBuilderContactEmail] = useState('');

  useEffect(() => {
    adminApi.getBuilders()
      .then(d => setBuilders((d as Builder[]) || []))
      .catch(() => {});
  }, []);

  const filteredBuilders = builders.filter(b => {
    const name = (b.companyName ?? b.user.fullName ?? '').toLowerCase();
    return name.includes(builderSearch.toLowerCase()) || b.user.phone?.includes(builderSearch);
  });

  const toggleArray = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuilder) { toast.error('Please select a builder'); return; }
    if (!name.trim())     { toast.error('Project name is required'); return; }
    if (!city)            { toast.error('City is required'); return; }

    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        name:               name.trim(),
        projectType,
        description:        description.trim() || null,
        status,
        city,
        locality:           locality.trim() || null,
        address:            address.trim() || null,
        pincode:            pincode.trim() || null,
        landmark:           landmark.trim() || null,
        googleMapsLink:     googleMapsLink.trim() || null,
        priceMin:           priceMin ? Number(priceMin) : null,
        priceMax:           priceMax ? Number(priceMax) : null,
        pricePerSqftMin:    pricePerSqftMin ? Number(pricePerSqftMin) : null,
        pricePerSqftMax:    pricePerSqftMax ? Number(pricePerSqftMax) : null,
        commissionValue:    commissionValue ? Number(commissionValue) : null,
        commissionStructure: commissionStructure.trim() || null,
        cpIncentive:        cpIncentive.trim() || null,
        totalUnits:         totalUnits ? Number(totalUnits) : null,
        availableUnits:     availableUnits ? Number(availableUnits) : (totalUnits ? Number(totalUnits) : null),
        towers:             towers ? Number(towers) : null,
        floorsPerTower:     floorsPerTower ? Number(floorsPerTower) : null,
        configurations:     configurations.length ? configurations : null,
        amenities:          amenities.length ? amenities : null,
        nearbyHighlights:   nearbyHighlights.length ? nearbyHighlights : null,
        reraNumber:         reraNumber.trim() || null,
        reraExpiry:         reraExpiry || null,
        possessionDate:     possessionDate || null,
        videoUrl:           videoUrl.trim() || null,
        featured,
        closingSoon,
        published,
        landArea:           landArea.trim() || null,
        maintenanceCharges: maintenanceCharges ? Number(maintenanceCharges) : null,
        builderContactPhone: builderContactPhone.trim() || null,
        builderContactEmail: builderContactEmail.trim() || null,
      };

      await builderApi.createProject(selectedBuilder.id, data);
      toast.success(`"${name}" created successfully under ${selectedBuilder.companyName ?? selectedBuilder.user.fullName}`);
      navigate('/admin/projects');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/projects')}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-[17px] font-bold text-foreground">Add Project on Behalf of Builder</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Select a builder, then fill in all project details</p>
          </div>
        </div>

        {/* ── 1. Builder Selection ── */}
        <Card>
          <SectionTitle icon={User} title="Select Builder" sub="Choose which builder this project belongs to" />
          <div className="relative">
            <button type="button" onClick={() => setShowBuilderDrop(v => !v)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedBuilder ? 'border-teal-400 bg-teal-50/40' : 'border-border bg-card hover:border-ring'
              }`}>
              {selectedBuilder ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                    {(selectedBuilder.companyName ?? selectedBuilder.user.fullName ?? 'B')[0].toUpperCase()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {selectedBuilder.companyName ?? selectedBuilder.user.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{selectedBuilder.user.phone ?? selectedBuilder.user.email ?? ''}</p>
                  </div>
                </div>
              ) : (
                <span className="text-[13px] text-muted-foreground flex items-center gap-2">
                  <Building2 size={14} /> Select a builder…
                </span>
              )}
              <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform ${showBuilderDrop ? 'rotate-180' : ''}`} />
            </button>

            {showBuilderDrop && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowBuilderDrop(false)} />
                <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={builderSearch} onChange={e => setBuilderSearch(e.target.value)}
                        placeholder="Search by name or phone…"
                        autoFocus
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredBuilders.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground text-center py-6">No builders found</p>
                    ) : filteredBuilders.map(b => (
                      <button key={b.id} type="button"
                        onClick={() => { setSelectedBuilder(b); setShowBuilderDrop(false); setBuilderSearch(''); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                          {(b.companyName ?? b.user.fullName ?? 'B')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{b.companyName ?? b.user.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">{b.user.phone ?? b.user.email ?? `ID: ${b.id}`}</p>
                        </div>
                        {selectedBuilder?.id === b.id && <CheckCircle2 size={14} className="text-teal-600 ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* ── 2. Project Identity ── */}
        <Card>
          <SectionTitle icon={Building2} title="Project Identity" sub="Basic information about the project" />
          <Field label="Project Name *">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Prestige Skyline" className={inp} required />
          </Field>
          <Row>
            <Field label="Project Type">
              <select value={projectType} onChange={e => setProjectType(e.target.value)} className={inp}>
                {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} className={inp}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </Row>
          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Describe the project — location advantages, USPs, target buyers…"
              className={inp + ' resize-none'} />
          </Field>
          <Row cols={3}>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setFeatured(v => !v)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${featured ? 'bg-amber-500 border-amber-500' : 'border-border'}`}>
                {featured && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-[12px] font-medium text-foreground">Featured</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setClosingSoon(v => !v)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${closingSoon ? 'bg-red-500 border-red-500' : 'border-border'}`}>
                {closingSoon && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-[12px] font-medium text-foreground">Closing Soon</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setPublished(v => !v)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${published ? 'bg-teal-600 border-teal-600' : 'border-border'}`}>
                {published && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-[12px] font-medium text-foreground">Published</span>
            </div>
          </Row>
        </Card>

        {/* ── 3. Location ── */}
        <Card>
          <SectionTitle icon={MapPin} title="Location" sub="Where is the project located?" />
          <Row>
            <Field label="City *">
              <select value={city} onChange={e => setCity(e.target.value)} className={inp} required>
                <option value="">Select city…</option>
                {CITY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Locality / Area">
              <input value={locality} onChange={e => setLocality(e.target.value)} placeholder="e.g. Gachibowli" className={inp} />
            </Field>
          </Row>
          <Field label="Full Address">
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Plot no., street, area…" className={inp} />
          </Field>
          <Row>
            <Field label="Pincode">
              <input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="500032" className={inp} maxLength={6} />
            </Field>
            <Field label="Landmark">
              <input value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Near HITEC City metro" className={inp} />
            </Field>
          </Row>
          <Field label="Google Maps Link">
            <input value={googleMapsLink} onChange={e => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/…" className={inp} />
          </Field>
          <div>
            <label className={lbl}>Nearby Highlights</label>
            <div className="flex flex-wrap gap-2">
              {NEARBY_OPTIONS.map(n => (
                <Chip key={n} label={n} active={nearbyHighlights.includes(n)} onClick={() => toggleArray(nearbyHighlights, setNearbyHighlights, n)} />
              ))}
            </div>
          </div>
        </Card>

        {/* ── 4. Pricing ── */}
        <Card>
          <SectionTitle icon={IndianRupee} title="Pricing & Commission" sub="Set pricing range and CP commission details" />
          <Row>
            <Field label="Starting Price (₹)">
              <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="e.g. 6500000" className={inp} />
            </Field>
            <Field label="Max Price (₹)">
              <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="e.g. 12000000" className={inp} />
            </Field>
          </Row>
          <Row>
            <Field label="Price/sqft From (₹)">
              <input type="number" value={pricePerSqftMin} onChange={e => setPricePerSqftMin(e.target.value)} placeholder="e.g. 5200" className={inp} />
            </Field>
            <Field label="Price/sqft To (₹)">
              <input type="number" value={pricePerSqftMax} onChange={e => setPricePerSqftMax(e.target.value)} placeholder="e.g. 7800" className={inp} />
            </Field>
          </Row>
          <Row>
            <Field label="Maintenance (₹/sqft/month)">
              <input type="number" value={maintenanceCharges} onChange={e => setMaintenanceCharges(e.target.value)} placeholder="e.g. 3.5" className={inp} />
            </Field>
            <Field label="CP Commission (%)">
              <div className="relative">
                <input type="number" step="0.5" value={commissionValue} onChange={e => setCommissionValue(e.target.value)} placeholder="e.g. 2.5" className={inp + ' pr-9'} />
                <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
          </Row>
          <Row>
            <Field label="Commission Structure">
              <input value={commissionStructure} onChange={e => setCommissionStructure(e.target.value)} placeholder="e.g. 1% on booking, 1.5% on registration" className={inp} />
            </Field>
            <Field label="CP Incentive">
              <input value={cpIncentive} onChange={e => setCpIncentive(e.target.value)} placeholder="e.g. Bonus ₹50K for top performer" className={inp} />
            </Field>
          </Row>
        </Card>

        {/* ── 5. Units ── */}
        <Card>
          <SectionTitle icon={Layers} title="Unit Configuration" sub="Total inventory and BHK types available" />
          <Row cols={3}>
            <Field label="Total Units">
              <input type="number" value={totalUnits} onChange={e => setTotalUnits(e.target.value)} placeholder="e.g. 240" className={inp} />
            </Field>
            <Field label="Available Units">
              <input type="number" value={availableUnits} onChange={e => setAvailableUnits(e.target.value)} placeholder="e.g. 180" className={inp} />
            </Field>
            <Field label="Land Area">
              <input value={landArea} onChange={e => setLandArea(e.target.value)} placeholder="e.g. 4.5 acres" className={inp} />
            </Field>
          </Row>
          <Row>
            <Field label="Number of Towers">
              <input type="number" value={towers} onChange={e => setTowers(e.target.value)} placeholder="e.g. 3" className={inp} />
            </Field>
            <Field label="Floors per Tower">
              <input type="number" value={floorsPerTower} onChange={e => setFloorsPerTower(e.target.value)} placeholder="e.g. 20" className={inp} />
            </Field>
          </Row>
          <div>
            <label className={lbl}>BHK Configurations</label>
            <div className="flex flex-wrap gap-2">
              {BHK_OPTIONS.map(b => (
                <Chip key={b} label={b} active={configurations.includes(b)} onClick={() => toggleArray(configurations, setConfigurations, b)} />
              ))}
            </div>
          </div>
        </Card>

        {/* ── 6. Amenities ── */}
        <Card>
          <SectionTitle icon={Sparkles} title="Amenities" sub="Select all available amenities" />
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(a => (
              <Chip key={a} label={a} active={amenities.includes(a)} onClick={() => toggleArray(amenities, setAmenities, a)} />
            ))}
          </div>
          {amenities.length > 0 && (
            <p className="text-[11px] text-teal-600 font-medium">{amenities.length} amenit{amenities.length === 1 ? 'y' : 'ies'} selected</p>
          )}
        </Card>

        {/* ── 7. Compliance & Dates ── */}
        <Card>
          <SectionTitle icon={Shield} title="RERA & Dates" sub="Compliance information and possession timeline" />
          <Row>
            <Field label="RERA Number">
              <input value={reraNumber} onChange={e => setReraNumber(e.target.value)} placeholder="e.g. P02400003456" className={inp} />
            </Field>
            <Field label="RERA Expiry Date">
              <input type="date" value={reraExpiry} onChange={e => setReraExpiry(e.target.value)} className={inp} />
            </Field>
          </Row>
          <Row>
            <Field label="Possession Date">
              <input type="date" value={possessionDate} onChange={e => setPossessionDate(e.target.value)} className={inp} />
            </Field>
            <Field label="Virtual Tour / Video URL">
              <div className="relative">
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/…" className={inp + ' pr-9'} />
                <Video size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>
          </Row>
        </Card>

        {/* ── 8. Builder Contact ── */}
        <Card>
          <SectionTitle icon={User} title="Builder Contact (Optional)" sub="Update builder's contact details visible to customers" />
          <Row>
            <Field label="Contact Phone">
              <input value={builderContactPhone} onChange={e => setBuilderContactPhone(e.target.value)} placeholder="+91 98765 43210" className={inp} />
            </Field>
            <Field label="Contact Email">
              <input type="email" value={builderContactEmail} onChange={e => setBuilderContactEmail(e.target.value)} placeholder="sales@builder.com" className={inp} />
            </Field>
          </Row>
        </Card>

        {/* ── Submit ── */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={submitting || !selectedBuilder}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-[14px] font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Creating Project…</>
              : <><Building2 size={16} /> Create Project</>}
          </button>
          <button type="button" onClick={() => navigate('/admin/projects')}
            className="px-6 py-3 rounded-xl text-[13px] font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          {!selectedBuilder && (
            <span className="text-[12px] text-amber-600 font-medium">← Select a builder first</span>
          )}
        </div>
      </form>
    </DashboardLayout>
  );
};

export default AdminAddProject;
