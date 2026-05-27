import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Home, MapPin, Landmark, Trees,
  Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  ImageIcon, X, CheckCircle2, FileText, Layers, Video,
  IndianRupee, Percent, Sparkles, Shield,
} from 'lucide-react';
import GoogleMapsLocationField from '@/components/shared/GoogleMapsLocationField';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Constants ──────────────────────────────────────────────────────────────────
const projectTypes = [
  { value: 'Apartment',  icon: Building2, label: 'Apartment' },
  { value: 'Villa',      icon: Home,      label: 'Villa'     },
  { value: 'Plot',       icon: MapPin,    label: 'Plot'      },
  { value: 'Commercial', icon: Landmark,  label: 'Commercial'},
  { value: 'Mixed Use',  icon: Trees,     label: 'Mixed Use' },
];
const bhkOptions     = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Penthouse'];
const statusOptions  = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move'];
const cityOptions    = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
const nearbyOptions  = ['Metro Station', 'Airport', 'IT Park', 'Hospital', 'School', 'Mall', 'Highway'];
const amenityOptions = [
  'Swimming Pool', 'Gym', 'Clubhouse', "Children's Play Area", 'Jogging Track', 'Tennis Court',
  'Basketball Court', 'Indoor Games', 'Party Hall', 'Co-working Space', 'EV Charging', 'Solar Power',
  'Rainwater Harvesting', '24hr Security', 'CCTV', 'Power Backup', 'Intercom', 'Vastu Compliant',
  'Gated Community', 'Visitor Parking', 'Landscaped Gardens', 'Senior Citizen Area',
];

const GALLERY_SLOTS = [
  { key: 'hero',      label: 'Hero render · drop image', large: true,  dbCategory: 'Hero Render'      },
  { key: 'tower',     label: 'Tower elevation',          large: false, dbCategory: 'Tower Elevation'  },
  { key: 'lobby',     label: 'Lobby / arrival',          large: false, dbCategory: 'Lobby Arrival'    },
  { key: 'clubhouse', label: 'Clubhouse',                large: false, dbCategory: 'Clubhouse'        },
  { key: 'pool',      label: 'Pool deck',                large: false, dbCategory: 'Pool Deck'        },
] as const;
type SlotKey = typeof GALLERY_SLOTS[number]['key'];

interface UnitConfig {
  bhkType: string; carpetArea: number; superBuiltUp: number;
  floors: string; count: number; basePrice: number; status: string;
}
type Errors = Record<string, string>;

const SECTIONS = [
  { n: 1, id: 'section-1', label: 'Identity',   icon: Building2    },
  { n: 2, id: 'section-2', label: 'Location',   icon: MapPin       },
  { n: 3, id: 'section-3', label: 'Pricing',    icon: IndianRupee  },
  { n: 4, id: 'section-4', label: 'Units',      icon: Layers       },
  { n: 5, id: 'section-5', label: 'Amenities',  icon: Sparkles     },
  { n: 6, id: 'section-6', label: 'Gallery',    icon: ImageIcon    },
];

// ── Shared style helpers ───────────────────────────────────────────────────────
const inp = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[13px] transition-all outline-none bg-background text-foreground placeholder:text-muted-foreground
   ${err ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border focus:ring-2 focus:ring-ring/20 focus:border-ring'}`;

const ta = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[13px] resize-none outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground
   ${err ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border focus:ring-2 focus:ring-ring/20 focus:border-ring'}`;

const ti = `px-2.5 py-1.5 rounded-lg border border-border bg-background text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 focus:border-ring transition-all`;

const lbl = 'text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5 block';

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[11px] text-destructive mt-1">{msg}</p> : null;

// ── Section heading ────────────────────────────────────────────────────────────
const SectionHeading = ({
  n, title, desc, icon: Icon,
}: {
  n: number; title: string; desc?: string; icon: React.ElementType;
}) => (
  <div className="mb-6">
    <div className="flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
           style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
                style={{ color: '#0A7E8C' }}>Step {n}</span>
        </div>
        <h3 className="text-[15px] font-bold text-foreground mt-0.5">{title}</h3>
        {desc && <p className="text-[12px] text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
    <div className="border-b border-border mt-4" />
  </div>
);

const card = 'bg-card rounded-2xl border border-border p-6 space-y-5';

// ── Date picker ────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEK   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DatePickerField({
  label, value, onChange, error, required, placeholder = 'Select date', fromYear, toYear,
}: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; required?: boolean; placeholder?: string;
  fromYear?: number; toYear?: number;
}) {
  const now = new Date();
  const fy  = fromYear ?? now.getFullYear();
  const ty  = toYear   ?? now.getFullYear() + 15;
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(() => value ? +value.slice(0, 4) : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? +value.slice(5, 7) - 1 : now.getMonth());
  const years = Array.from({ length: ty - fy + 1 }, (_, i) => fy + i);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isoOf      = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isSelected = (d: number) => value === isoOf(d);
  const isToday    = (d: number) => now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d;
  const displayValue = value ? `${value.slice(8)} ${MONTHS[+value.slice(5, 7) - 1]} ${value.slice(0, 4)}` : null;

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-destructive"> *</span>}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" data-error={!!error}
            className={`${inp(error)} flex items-center justify-between gap-2 text-left`}>
            <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
              {displayValue ?? placeholder}
            </span>
            <CalendarIcon size={13} className="text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-56 rounded-xl shadow-lg border border-border bg-card">
          <div className="flex items-center gap-1 px-2 pt-2.5 pb-1.5">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={13} />
            </button>
            <div className="flex-1 flex items-center justify-center gap-1">
              <select value={viewMonth} onChange={e => setViewMonth(+e.target.value)}
                className="text-[12px] font-semibold text-foreground bg-transparent outline-none cursor-pointer">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(+e.target.value)}
                className="text-[12px] font-semibold text-foreground bg-transparent outline-none cursor-pointer">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-7 px-2 mb-0.5">
            {WEEK.map(d => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-2 pb-2.5 gap-y-0.5">
            {cells.map((day, i) =>
              day === null ? <div key={i} /> : (
                <button key={i} type="button" onClick={() => { onChange(isoOf(day)); setOpen(false); }}
                  className={`h-7 w-full text-[12px] rounded-lg font-medium transition-colors
                    ${isSelected(day) ? 'text-white' : isToday(day) ? 'text-foreground font-bold' : 'text-foreground hover:bg-muted'}`}
                  style={isSelected(day) ? { background: '#0A7E8C' } : isToday(day) ? { backgroundColor: '#0A7E8C18' } : undefined}>
                  {day}
                </button>
              )
            )}
          </div>
        </PopoverContent>
      </Popover>
      <FieldError msg={error} />
    </div>
  );
}

// ── Gallery slot ───────────────────────────────────────────────────────────────
function GallerySlot({ slotKey, label, large, file, onFile }: {
  slotKey: SlotKey; label: string; large: boolean;
  file: File | null; onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview,  setPreview]  = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer select-none
        ${dragging ? 'border-primary bg-primary/5' : preview ? 'border-transparent' : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50'}
        ${large ? 'min-h-[360px]' : 'min-h-[172px]'}`}
      onClick={() => !preview && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) onFile(f); }}
    >
      {preview ? (
        <>
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onFile(null); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
          >
            <X size={13} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 p-4 text-center pointer-events-none">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ImageIcon size={15} className="text-muted-foreground" />
          </div>
          <span className="text-[11px] text-muted-foreground font-medium leading-snug">{label}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" key={slotKey}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Toggle chip ────────────────────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold border transition-all select-none ${
        active
          ? 'text-white border-transparent'
          : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground'
      }`}
      style={active ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)', borderColor: 'transparent' } : undefined}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const AddProjectWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Section 1 — Identity
  const [projectName,    setProjectName]    = useState('');
  const [builderName,    setBuilderName]    = useState('');
  const [projectType,    setProjectType]    = useState('Apartment');
  const [configurations, setConfigurations] = useState<string[]>(['3BHK']);
  const [totalUnits,     setTotalUnits]     = useState<number>(0);
  const [towers,         setTowers]         = useState<number>(0);
  const [floorsPerTower, setFloorsPerTower] = useState<number>(0);
  const [projectStatus,  setProjectStatus]  = useState('Under Construction');
  const [reraNumber,     setReraNumber]     = useState('');
  const [reraExpiry,     setReraExpiry]     = useState('');
  const [description,    setDescription]   = useState('');

  // Section 2 — Location
  const [address,          setAddress]          = useState('');
  const [city,             setCity]             = useState('Hyderabad');
  const [locality,         setLocality]         = useState('');
  const [pincode,          setPincode]          = useState('');
  const [landmark,         setLandmark]         = useState('');
  const [mapsLink,         setMapsLink]         = useState('');
  const [nearbyHighlights, setNearbyHighlights] = useState<string[]>([]);

  // Section 3 — Pricing
  const [priceFrom,        setPriceFrom]        = useState<number>(0);
  const [priceTo,          setPriceTo]          = useState<number>(0);
  const [pricePerSqftFrom, setPricePerSqftFrom] = useState<number>(0);
  const [pricePerSqftTo,   setPricePerSqftTo]   = useState<number>(0);
  const [maintenance,      setMaintenance]      = useState<number>(0);
  const [floorRise,        setFloorRise]        = useState<number>(0);
  const [commissionType,   setCommissionType]   = useState<'flat' | 'slab'>('flat');
  const [flatPercent,      setFlatPercent]      = useState<number>(2.5);
  const [slabRows,         setSlabRows]         = useState([
    { minUnits: 1,  maxUnits: 10,  percent: 2   },
    { minUnits: 11, maxUnits: 30,  percent: 2.5 },
    { minUnits: 31, maxUnits: 100, percent: 3   },
  ]);
  const [cpIncentive,    setCpIncentive]    = useState('');
  const [possessionDate, setPossessionDate] = useState('');
  const [closingSoon,    setClosingSoon]    = useState(false);
  const [featured,       setFeatured]       = useState(false);

  // Section 4 — Units
  const [unitConfigs, setUnitConfigs] = useState<UnitConfig[]>([
    { bhkType: '3BHK', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' },
  ]);

  // Section 1 extras — identity details
  const [landArea,             setLandArea]             = useState('');
  const [buildingPermitNumber, setBuildingPermitNumber] = useState('');
  const [reraState,            setReraState]            = useState('');
  // Builder profile
  const [builderAbout,             setBuilderAbout]             = useState('');
  const [builderYearEstablished,   setBuilderYearEstablished]   = useState<number | ''>('');
  const [builderDeliveredProjects, setBuilderDeliveredProjects] = useState<number | ''>('');
  const [builderWebsite,           setBuilderWebsite]           = useState('');

  // Section 2 extras — structured location advantages
  interface LocAdv { category: string; name: string; distanceKm: string; driveMinutes: string; }
  const [locationAdvantages, setLocationAdvantages] = useState<LocAdv[]>([
    { category: 'Corporate', name: '', distanceKm: '', driveMinutes: '' },
  ]);

  // Section 3 extras — payment plans
  interface PayPlan { name: string; description: string; }
  const [paymentPlans, setPaymentPlans] = useState<PayPlan[]>([
    { name: '20:80', description: '20% on booking, 80% on possession' },
  ]);

  // Section 5 extras — construction specs + clubhouse
  interface Specs { structure: string; flooring: string; doors: string; windows: string;
                    electrical: string; plumbing: string; kitchen: string; bathrooms: string; painting: string; }
  const [specifications, setSpecifications] = useState<Specs>({
    structure: '', flooring: '', doors: '', windows: '', electrical: '', plumbing: '', kitchen: '', bathrooms: '', painting: '',
  });
  const [clubhouseAreaSqft, setClubhouseAreaSqft] = useState<number | ''>('');

  // Section 5 — Amenities & Documents
  const [amenities,      setAmenities]      = useState<string[]>(['Swimming Pool', 'Gym', 'Clubhouse']);
  const [videoUrl,       setVideoUrl]       = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const brochureRef   = useRef<HTMLInputElement>(null);
  const reraCertRef   = useRef<HTMLInputElement>(null);
  const floorPlansRef = useRef<HTMLInputElement>(null);
  const [brochureFile,   setBrochureFile]   = useState<File | null>(null);
  const [reraCertFile,   setReraCertFile]   = useState<File | null>(null);
  const [floorPlanFiles, setFloorPlanFiles] = useState<FileList | null>(null);

  // Section 6 — Gallery
  const [galleryImages, setGalleryImages] = useState<Record<SlotKey, File | null>>({
    hero: null, tower: null, lobby: null, clubhouse: null, pool: null,
  });
  const filledCount = Object.values(galleryImages).filter(Boolean).length;
  const setSlotFile = (key: SlotKey, file: File | null) =>
    setGalleryImages(prev => ({ ...prev, [key]: file }));

  const [errors,     setErrors]     = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState(1);

  // ── Intersection observer for active section highlight ─────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const id = visible[0].target.id;
          const n = SECTIONS.find(s => s.id === id)?.n;
          if (n) setActiveSection(n);
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' },
    );
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  // ── Draft ─────────────────────────────────────────────────────────────────
  const DRAFT_KEY = 'dealio_new_project_draft';
  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      projectName, builderName, projectType, configurations, totalUnits, towers,
      floorsPerTower, projectStatus, reraNumber, reraExpiry, description,
      address, city, locality, pincode, landmark, mapsLink, nearbyHighlights,
      priceFrom, priceTo, pricePerSqftFrom, pricePerSqftTo, maintenance, floorRise,
      commissionType, flatPercent, slabRows, cpIncentive, possessionDate, closingSoon, featured,
      unitConfigs, amenities, videoUrl, virtualTourUrl,
      landArea, buildingPermitNumber, reraState,
      builderAbout, builderYearEstablished, builderDeliveredProjects, builderWebsite,
      locationAdvantages, paymentPlans, specifications, clubhouseAreaSqft,
    }));
    toast.success('Draft saved! Come back anytime to continue.');
  };

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (d.projectName)    setProjectName(d.projectName as string);
      if (d.builderName)    setBuilderName(d.builderName as string);
      if (d.projectType)    setProjectType(d.projectType as string);
      if (d.configurations) setConfigurations(d.configurations as string[]);
      if (d.totalUnits)     setTotalUnits(d.totalUnits as number);
      if (d.towers)         setTowers(d.towers as number);
      if (d.floorsPerTower) setFloorsPerTower(d.floorsPerTower as number);
      if (d.projectStatus)  setProjectStatus(d.projectStatus as string);
      if (d.reraNumber)     setReraNumber(d.reraNumber as string);
      if (d.reraExpiry)     setReraExpiry(d.reraExpiry as string);
      if (d.description)    setDescription(d.description as string);
      if (d.address)        setAddress(d.address as string);
      if (d.city)           setCity(d.city as string);
      if (d.locality)       setLocality(d.locality as string);
      if (d.pincode)        setPincode(d.pincode as string);
      if (d.landmark)       setLandmark(d.landmark as string);
      if (d.mapsLink)       setMapsLink(d.mapsLink as string);
      if (d.nearbyHighlights) setNearbyHighlights(d.nearbyHighlights as string[]);
      if (d.priceFrom)      setPriceFrom(d.priceFrom as number);
      if (d.priceTo)        setPriceTo(d.priceTo as number);
      if (d.pricePerSqftFrom) setPricePerSqftFrom(d.pricePerSqftFrom as number);
      if (d.pricePerSqftTo)   setPricePerSqftTo(d.pricePerSqftTo as number);
      if (d.maintenance)    setMaintenance(d.maintenance as number);
      if (d.floorRise)      setFloorRise(d.floorRise as number);
      if (d.commissionType) setCommissionType(d.commissionType as 'flat' | 'slab');
      if (d.flatPercent)    setFlatPercent(d.flatPercent as number);
      if (d.slabRows)       setSlabRows(d.slabRows as typeof slabRows);
      if (d.cpIncentive)    setCpIncentive(d.cpIncentive as string);
      if (d.possessionDate) setPossessionDate(d.possessionDate as string);
      if (typeof d.closingSoon === 'boolean') setClosingSoon(d.closingSoon);
      if (typeof d.featured   === 'boolean') setFeatured(d.featured);
      if (d.unitConfigs)    setUnitConfigs(d.unitConfigs as UnitConfig[]);
      if (d.amenities)      setAmenities(d.amenities as string[]);
      if (d.videoUrl)       setVideoUrl(d.videoUrl as string);
      if (d.virtualTourUrl) setVirtualTourUrl(d.virtualTourUrl as string);
      if (d.landArea)             setLandArea(d.landArea as string);
      if (d.buildingPermitNumber) setBuildingPermitNumber(d.buildingPermitNumber as string);
      if (d.reraState)            setReraState(d.reraState as string);
      if (d.builderAbout)         setBuilderAbout(d.builderAbout as string);
      if (d.builderYearEstablished)   setBuilderYearEstablished(d.builderYearEstablished as number);
      if (d.builderDeliveredProjects) setBuilderDeliveredProjects(d.builderDeliveredProjects as number);
      if (d.builderWebsite)       setBuilderWebsite(d.builderWebsite as string);
      if (d.locationAdvantages)   setLocationAdvantages(d.locationAdvantages as typeof locationAdvantages);
      if (d.paymentPlans)         setPaymentPlans(d.paymentPlans as typeof paymentPlans);
      if (d.specifications)       setSpecifications(d.specifications as typeof specifications);
      if (d.clubhouseAreaSqft)    setClubhouseAreaSqft(d.clubhouseAreaSqft as number);
      toast.info('Draft restored — continue where you left off.');
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleArr = (arr: string[], item: string, set: (a: string[]) => void) =>
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);

  const toBackendStatus = (s: string): string => {
    if (s === 'Pre-Launch')         return 'PRE_LAUNCH';
    if (s === 'Launched')           return 'LAUNCHED';
    if (s === 'Under Construction') return 'UNDER_CONSTRUCTION';
    if (s === 'Ready to Move')      return 'READY_TO_MOVE';
    return 'PRE_LAUNCH';
  };

  const syncUnitConfigs = (newConfigs: string[]) => {
    setConfigurations(newConfigs);
    setUnitConfigs(prev => {
      const existing = new globalThis.Map(prev.map(u => [u.bhkType, u]));
      return newConfigs.map(c => existing.get(c) ?? { bhkType: c, carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' });
    });
  };

  const validate = () => {
    const e: Errors = {};
    if (!projectName.trim())            e.projectName    = 'Project name is required';
    if (!configurations.length)         e.configurations = 'Select at least one configuration';
    if (!totalUnits || totalUnits <= 0) e.totalUnits     = 'Total units is required';
    if (!reraNumber.trim())             e.reraNumber     = 'RERA number is required';
    else if (!/^[A-Z0-9/\-]{6,30}$/i.test(reraNumber.trim())) e.reraNumber = 'Invalid format (e.g. P02400012345)';
    if (!reraExpiry)                    e.reraExpiry     = 'RERA expiry date is required';
    if (!address.trim())                e.address        = 'Address is required';
    if (!locality.trim())               e.locality       = 'Locality is required';
    if (!pincode.trim())                e.pincode        = 'Pincode is required';
    else if (!/^\d{6}$/.test(pincode))  e.pincode        = 'Pincode must be 6 digits';
    if (!priceFrom || priceFrom <= 0)   e.priceFrom      = 'Starting price is required';
    if (!priceTo   || priceTo   <= 0)   e.priceTo        = 'Ending price is required';
    else if (priceTo < priceFrom)       e.priceTo        = 'Must be ≥ starting price';
    if (!possessionDate)                e.possessionDate = 'Possession date is required';
    if (commissionType === 'flat' && (!flatPercent || flatPercent <= 0)) e.flatPercent = 'Commission % must be > 0';
    if (commissionType === 'slab' && slabRows.some(r => !r.percent || r.percent <= 0)) e.slabRows = 'All slab % values must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!user?.id) { toast.error('Please sign in again'); return; }
    setSubmitting(true);
    try {
      let builderId = builderApi.getCachedBuilderId();
      if (!builderId) {
        const email = user.email || `uid${user.id}@dealio.builder`;
        const bd = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
        builderId = String(bd.builderId);
        builderApi.setCachedBuilderId(builderId);
      }

      const payload = {
        name: projectName, location: address || locality || city, city, locality, address, pincode,
        landmark: landmark || undefined, googleMapsLink: mapsLink || undefined,
        description: description || undefined, status: toBackendStatus(projectStatus),
        projectType: projectType.toUpperCase().replace(/\s+/g, '_'), bhkTypes: configurations, configurations,
        totalUnits: totalUnits || undefined, towers: towers || undefined, floorsPerTower: floorsPerTower || undefined,
        reraId: reraNumber || undefined, reraNumber: reraNumber || undefined, reraExpiry: reraExpiry || undefined,
        amenities, nearbyHighlights: nearbyHighlights.length ? nearbyHighlights : undefined,
        possessionDate: possessionDate || undefined, priceMin: priceFrom || undefined, priceMax: priceTo || undefined,
        pricePerSqftMin: pricePerSqftFrom || undefined, pricePerSqftMax: pricePerSqftTo || undefined,
        maintenanceCharges: maintenance || undefined, floorRiseCharges: floorRise || undefined,
        commissionPercent: commissionType === 'flat' ? flatPercent : undefined,
        cpIncentive: cpIncentive || undefined, closingSoon, featured,
        videoUrl: videoUrl || undefined, virtualTourUrl: virtualTourUrl || undefined,
        builderName: builderName || undefined,
        landArea: landArea || undefined,
        buildingPermitNumber: buildingPermitNumber || undefined,
        reraState: reraState || undefined,
        builderAbout: builderAbout || undefined,
        builderYearEstablished: builderYearEstablished || undefined,
        builderDeliveredProjects: builderDeliveredProjects || undefined,
        builderWebsite: builderWebsite || undefined,
        locationAdvantages: locationAdvantages.filter(l => l.name).length
          ? locationAdvantages.filter(l => l.name) : undefined,
        paymentPlans: paymentPlans.filter(p => p.name).length
          ? paymentPlans.filter(p => p.name) : undefined,
        specifications: Object.values(specifications).some(v => v)
          ? specifications : undefined,
        clubhouseAreaSqft: clubhouseAreaSqft || undefined,
      };

      const created = await builderApi.createProject(builderId, payload) as { id?: number; projectId?: number };
      const projectId = created?.id ?? created?.projectId;

      if (projectId) {
        const uploads: Promise<void>[] = [];
        for (const slot of GALLERY_SLOTS) {
          const file = galleryImages[slot.key];
          if (!file) continue;
          if (slot.key === 'hero') {
            uploads.push(
              builderApi.uploadProjectImage(builderId, projectId, file)
                .then(coverUrl => builderApi.updateProject(builderId, projectId, { coverUrl }))
                .catch(() => toast.warning('Hero image upload failed — add it later.')),
            );
          } else {
            uploads.push(builderApi.uploadDocument(builderId, projectId, file, slot.dbCategory).catch(() => {}));
          }
        }
        if (floorPlanFiles?.length) {
          for (let i = 0; i < floorPlanFiles.length; i++)
            uploads.push(builderApi.uploadDocument(builderId, projectId, floorPlanFiles[i], 'Floor Plan').catch(() => {}));
        }
        if (brochureFile) uploads.push(builderApi.uploadDocument(builderId, projectId, brochureFile,  'Brochure').catch(() => {}));
        if (reraCertFile) uploads.push(builderApi.uploadDocument(builderId, projectId, reraCertFile,  'RERA Certificate').catch(() => {}));
        await Promise.all(uploads);
      }

      if (projectId && city) {
        try {
          const KEY = 'dealio_project_announcements';
          const existing = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown[];
          localStorage.setItem(KEY, JSON.stringify([
            { projectId, projectName, city, locality: locality || null, createdAt: new Date().toISOString() },
            ...existing,
          ].slice(0, 50)));
        } catch { /* ignore */ }
      }

      localStorage.removeItem(DRAFT_KEY);
      toast.success('Project created successfully!');
      navigate('/builder/projects');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="min-h-full bg-background -m-6">

        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
            <button
              onClick={() => navigate('/builder/projects')}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft size={14} /> Projects
            </button>
            <div className="w-px h-4 bg-border shrink-0" />
            <span className="text-[13px] font-semibold text-foreground shrink-0">New Project</span>
            <div className="w-px h-4 bg-border shrink-0" />

            {/* Section pill nav */}
            <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap ${
                    activeSection === s.n
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  style={activeSection === s.n ? { background: '#0A7E8C' } : undefined}
                >
                  {activeSection > s.n
                    ? <CheckCircle2 size={11} className="text-emerald-500" />
                    : <span className="text-[10px] font-bold opacity-60">{s.n}</span>}
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={saveDraft}
                className="px-3.5 py-1.5 text-[12px] font-semibold text-foreground border border-border bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                Save Draft
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="px-4 py-1.5 text-[12px] font-bold text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                {submitting ? <><Loader2 size={12} className="animate-spin" />Creating…</> : 'Create Project'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex gap-6">

            {/* ── Left sticky nav ── */}
            <div className="hidden lg:block w-48 flex-shrink-0">
              <div className="sticky top-20 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground px-3 mb-3">Sections</p>
                {SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all text-left ${
                      activeSection === s.n
                        ? 'font-medium text-foreground bg-muted'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeSection > s.n ? 'bg-emerald-100' : activeSection === s.n ? '' : 'bg-muted'
                    }`}
                    style={activeSection === s.n ? { background: '#0A7E8C18' } : undefined}>
                      {activeSection > s.n
                        ? <CheckCircle2 size={11} className="text-emerald-600" />
                        : <s.icon size={11} className={activeSection === s.n ? '' : 'text-muted-foreground opacity-60'}
                                  style={activeSection === s.n ? { color: '#0A7E8C' } : undefined} />}
                    </div>
                    {s.label}
                  </button>
                ))}

                <div className="pt-4 px-3">
                  <button type="button" onClick={saveDraft}
                    className="w-full py-2 text-[12px] font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors">
                    Save Draft
                  </button>
                </div>
              </div>
            </div>

            {/* ── Main form ── */}
            <div className="flex-1 min-w-0 space-y-5 pb-16">

              {/* Page intro */}
              <div className="pb-1">
                <h2 className="text-xl font-bold text-foreground">Add New Project</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Fill in each section — save as draft anytime, submit when ready.
                </p>
              </div>

              {/* ── 1. Identity ── */}
              <div id="section-1" className={card}>
                <SectionHeading n={1} title="Project Identity" icon={Building2}
                  desc="Basic details that identify your project on Dealio." />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>Project Name <span className="text-destructive">*</span></label>
                    <input
                      value={projectName}
                      onChange={e => { setProjectName(e.target.value); setErrors(p => ({ ...p, projectName: '' })); }}
                      className={inp(errors.projectName)} placeholder="e.g. Prestige Skyline"
                      data-error={!!errors.projectName}
                    />
                    <FieldError msg={errors.projectName} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Developer / Builder Name</label>
                    <input value={builderName} onChange={e => setBuilderName(e.target.value)}
                      className={inp()} placeholder="e.g. Prestige Group" />
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-2">
                  <label className={lbl}>Project Type <span className="text-destructive">*</span></label>
                  <div className="grid grid-cols-5 gap-2.5">
                    {projectTypes.map(t => (
                      <button key={t.value} type="button" onClick={() => setProjectType(t.value)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-[12px] font-semibold transition-all ${
                          projectType === t.value
                            ? 'text-white border-transparent'
                            : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/30'
                        }`}
                        style={projectType === t.value ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)', borderColor: 'transparent' } : undefined}>
                        <t.icon size={18} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configurations */}
                <div className="space-y-2">
                  <label className={lbl}>Configurations <span className="text-destructive">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {bhkOptions.map(b => (
                      <Chip key={b} active={configurations.includes(b)}
                        onClick={() => { syncUnitConfigs(configurations.includes(b) ? configurations.filter(x => x !== b) : [...configurations, b]); setErrors(p => ({ ...p, configurations: '' })); }}>
                        {b}
                      </Chip>
                    ))}
                  </div>
                  <FieldError msg={errors.configurations} />
                </div>

                {/* Numbers + Status */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>Towers</label>
                    <input type="number" min={0} value={towers || ''}
                      onChange={e => setTowers(parseInt(e.target.value) || 0)}
                      className={inp()} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Total Units <span className="text-destructive">*</span></label>
                    <input type="number" min={0} value={totalUnits || ''}
                      onChange={e => { setTotalUnits(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, totalUnits: '' })); }}
                      className={inp(errors.totalUnits)} data-error={!!errors.totalUnits} placeholder="0" />
                    <FieldError msg={errors.totalUnits} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Floors / Tower</label>
                    <input type="number" min={0} value={floorsPerTower || ''}
                      onChange={e => setFloorsPerTower(parseInt(e.target.value) || 0)}
                      className={inp()} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Status <span className="text-destructive">*</span></label>
                    <select value={projectStatus} onChange={e => setProjectStatus(e.target.value)} className={inp()}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* RERA */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>RERA Number <span className="text-destructive">*</span></label>
                    <input value={reraNumber} maxLength={30}
                      onChange={e => { setReraNumber(e.target.value.toUpperCase()); setErrors(p => ({ ...p, reraNumber: '' })); }}
                      className={inp(errors.reraNumber)} placeholder="e.g. P02400012345"
                      data-error={!!errors.reraNumber} />
                    <p className="text-[10px] text-muted-foreground">{30 - reraNumber.length} chars remaining</p>
                    <FieldError msg={errors.reraNumber} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>RERA State</label>
                    <select value={reraState} onChange={e => setReraState(e.target.value)} className={inp()}>
                      <option value="">Select state</option>
                      {['Telangana','Andhra Pradesh','Karnataka','Maharashtra','Tamil Nadu','Delhi','Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Kerala','Punjab','Haryana','Madhya Pradesh','Odisha'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <DatePickerField label="RERA Expiry" value={reraExpiry}
                    onChange={v => { setReraExpiry(v); setErrors(p => ({ ...p, reraExpiry: '' })); }}
                    error={errors.reraExpiry} required placeholder="Select expiry date"
                    fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 20} />
                </div>

                {/* Land area + permit */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>Land Area</label>
                    <input value={landArea} onChange={e => setLandArea(e.target.value)}
                      className={inp()} placeholder="e.g. 9.8 Acres" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className={lbl}>Building / GHMC Permit No.</label>
                    <input value={buildingPermitNumber} onChange={e => setBuildingPermitNumber(e.target.value)}
                      className={inp()} placeholder="e.g. GHMC/DP/2024/12345" />
                  </div>
                </div>

                {/* Builder profile */}
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Developer Profile</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className={lbl}>About the Developer</label>
                      <textarea value={builderAbout} onChange={e => setBuilderAbout(e.target.value)}
                        rows={3} className={ta()} placeholder="Brief description of the developer's background, legacy, and values…" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className={lbl}>Est. Year</label>
                        <input type="number" min={1900} max={new Date().getFullYear()} value={builderYearEstablished}
                          onChange={e => setBuilderYearEstablished(parseInt(e.target.value) || '')}
                          className={inp()} placeholder="e.g. 1998" />
                      </div>
                      <div className="space-y-1.5">
                        <label className={lbl}>Delivered Projects</label>
                        <input type="number" min={0} value={builderDeliveredProjects}
                          onChange={e => setBuilderDeliveredProjects(parseInt(e.target.value) || '')}
                          className={inp()} placeholder="e.g. 24" />
                      </div>
                      <div className="space-y-1.5">
                        <label className={lbl}>Website</label>
                        <input value={builderWebsite} onChange={e => setBuilderWebsite(e.target.value)}
                          className={inp()} placeholder="https://…" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Location ── */}
              <div id="section-2" className={card}>
                <SectionHeading n={2} title="Location" icon={MapPin}
                  desc="Where your project is situated — address, city, and map pin." />

                <div className="space-y-1.5">
                  <label className={lbl}>Full Address <span className="text-destructive">*</span></label>
                  <textarea value={address}
                    onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
                    rows={3} className={ta(errors.address)} data-error={!!errors.address}
                    placeholder="Street address, landmark, sector…" />
                  <FieldError msg={errors.address} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>City <span className="text-destructive">*</span></label>
                    <select value={city} onChange={e => setCity(e.target.value)} className={inp()}>
                      {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Locality / Area <span className="text-destructive">*</span></label>
                    <input value={locality}
                      onChange={e => { setLocality(e.target.value); setErrors(p => ({ ...p, locality: '' })); }}
                      className={inp(errors.locality)} placeholder="e.g. Gachibowli"
                      data-error={!!errors.locality} />
                    <FieldError msg={errors.locality} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Pincode <span className="text-destructive">*</span></label>
                    <input value={pincode} maxLength={6}
                      onChange={e => { setPincode(e.target.value); setErrors(p => ({ ...p, pincode: '' })); }}
                      className={inp(errors.pincode)} data-error={!!errors.pincode} placeholder="500032" />
                    <FieldError msg={errors.pincode} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={lbl}>Landmark</label>
                  <input value={landmark} onChange={e => setLandmark(e.target.value)}
                    className={inp()} placeholder="e.g. Near DLF Cyber City" />
                </div>

                <GoogleMapsLocationField value={mapsLink} onChange={setMapsLink} address={address} city={city} />

                <div className="space-y-2">
                  <label className={lbl}>Nearby Highlights</label>
                  <div className="flex flex-wrap gap-2">
                    {nearbyOptions.map(n => (
                      <Chip key={n} active={nearbyHighlights.includes(n)}
                        onClick={() => toggleArr(nearbyHighlights, n, setNearbyHighlights)}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Location Advantages */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Location Advantages</p>
                  <div className="hidden grid-cols-4 gap-2 px-1">
                    {['Category', 'Place Name', 'Distance (km)', 'Drive (min)'].map(h => (
                      <span key={h} className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{h}</span>
                    ))}
                  </div>
                  {locationAdvantages.map((adv, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={adv.category}
                        onChange={e => { const a = [...locationAdvantages]; a[i] = { ...a[i], category: e.target.value }; setLocationAdvantages(a); }}
                        className={`${inp()} w-36 shrink-0`}>
                        {['Corporate', 'Healthcare', 'Education', 'Shopping', 'Transit', 'Recreation', 'Other'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <input value={adv.name}
                        onChange={e => { const a = [...locationAdvantages]; a[i] = { ...a[i], name: e.target.value }; setLocationAdvantages(a); }}
                        className={inp()} placeholder="Place name (e.g. Financial District)" />
                      <input value={adv.distanceKm}
                        onChange={e => { const a = [...locationAdvantages]; a[i] = { ...a[i], distanceKm: e.target.value }; setLocationAdvantages(a); }}
                        className={`${inp()} w-24 shrink-0`} placeholder="km" />
                      <input value={adv.driveMinutes}
                        onChange={e => { const a = [...locationAdvantages]; a[i] = { ...a[i], driveMinutes: e.target.value }; setLocationAdvantages(a); }}
                        className={`${inp()} w-24 shrink-0`} placeholder="min" />
                      <button type="button"
                        onClick={() => setLocationAdvantages(locationAdvantages.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setLocationAdvantages([...locationAdvantages, { category: 'Corporate', name: '', distanceKm: '', driveMinutes: '' }])}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl px-4 py-2 transition-colors hover:border-primary/40">
                    + Add Location
                  </button>
                </div>
              </div>

              {/* ── 3. Pricing & Commission ── */}
              <div id="section-3" className={card}>
                <SectionHeading n={3} title="Pricing & Commission" icon={IndianRupee}
                  desc="Set price range, possession timeline, and CP commission structure." />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>Price From (₹) <span className="text-destructive">*</span></label>
                    <input type="number" min={0} value={priceFrom || ''}
                      onChange={e => { setPriceFrom(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, priceFrom: '' })); }}
                      className={inp(errors.priceFrom)} placeholder="8500000" data-error={!!errors.priceFrom} />
                    <FieldError msg={errors.priceFrom} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Price To (₹) <span className="text-destructive">*</span></label>
                    <input type="number" min={0} value={priceTo || ''}
                      onChange={e => { setPriceTo(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, priceTo: '' })); }}
                      className={inp(errors.priceTo)} data-error={!!errors.priceTo} placeholder="12000000" />
                    <FieldError msg={errors.priceTo} />
                  </div>
                  <DatePickerField label="Possession Date" value={possessionDate}
                    onChange={v => { setPossessionDate(v); setErrors(p => ({ ...p, possessionDate: '' })); }}
                    error={errors.possessionDate} required placeholder="Select date"
                    fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>₹ / sqft From</label>
                    <input type="number" min={0} max={99999} value={pricePerSqftFrom || ''}
                      onChange={e => { const v = parseInt(e.target.value) || 0; if (v <= 99999) setPricePerSqftFrom(v); }}
                      className={inp()} placeholder="6500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>₹ / sqft To</label>
                    <input type="number" min={0} max={99999} value={pricePerSqftTo || ''}
                      onChange={e => { const v = parseInt(e.target.value) || 0; if (v <= 99999) setPricePerSqftTo(v); }}
                      className={inp()} placeholder="8000" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Maintenance (₹/sqft/mo)</label>
                    <input type="number" min={0} step={0.01} value={maintenance || ''}
                      onChange={e => setMaintenance(parseFloat(e.target.value) || 0)}
                      className={inp()} placeholder="3.5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className={lbl}>Floor Rise (₹/floor)</label>
                    <input type="number" min={0} step={0.01} value={floorRise || ''}
                      onChange={e => setFloorRise(parseFloat(e.target.value) || 0)}
                      className={inp()} placeholder="25000" />
                  </div>
                  <div className="col-span-2 flex items-center gap-6 pb-1">
                    {[
                      { state: closingSoon, set: setClosingSoon, label: 'Mark as "Closing Soon"' },
                      { state: featured,    set: setFeatured,    label: 'Featured / Priority Push' },
                    ].map(({ state, set, label }) => (
                      <label key={label} className="flex items-center gap-2.5 cursor-pointer select-none group">
                        <div
                          onClick={() => set(!state)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            state ? 'border-transparent' : 'border-border group-hover:border-primary/50'
                          }`}
                          style={state ? { background: '#0A7E8C' } : undefined}
                        >
                          {state && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className="text-[13px] font-medium text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Commission */}
                <div className="space-y-3">
                  <label className={lbl}>Commission Structure</label>
                  <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1 gap-1">
                    {(['flat', 'slab'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setCommissionType(t)}
                        className={`px-5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                          commissionType === t
                            ? 'bg-card shadow-sm text-foreground border border-border'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {t === 'flat' ? 'Flat %' : 'Slab-based'}
                      </button>
                    ))}
                  </div>

                  {commissionType === 'flat' ? (
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input type="number" value={flatPercent} min={0.01} step={0.01}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            const n = isNaN(val) ? 0 : val;
                            setFlatPercent(n);
                            setErrors(p => ({ ...p, flatPercent: n <= 0 ? 'Must be > 0' : '' }));
                          }}
                          onBlur={() => { if (!flatPercent || flatPercent <= 0) setFlatPercent(0.01); }}
                          className={`w-32 ${inp(errors.flatPercent)}`} />
                      </div>
                      <Percent size={14} className="text-muted-foreground" />
                      <FieldError msg={errors.flatPercent} />
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-border">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="bg-muted/40">
                            {['Min Units', 'Max Units', 'Commission %'].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {slabRows.map((row, i) => (
                            <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                              <td className="px-3 py-2">
                                <input type="number" value={row.minUnits}
                                  onChange={e => { const r = [...slabRows]; r[i].minUnits = parseInt(e.target.value) || 0; setSlabRows(r); }}
                                  className={`w-24 ${ti}`} />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={row.maxUnits}
                                  onChange={e => { const r = [...slabRows]; r[i].maxUnits = parseInt(e.target.value) || 0; setSlabRows(r); }}
                                  className={`w-24 ${ti}`} />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={row.percent} min={0.01} step={0.01}
                                  onChange={e => { const r = [...slabRows]; r[i].percent = parseFloat(e.target.value) || 0; setSlabRows(r); setErrors(p => ({ ...p, slabRows: '' })); }}
                                  className={`w-24 ${ti}`} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button type="button"
                        onClick={() => setSlabRows([...slabRows, { minUnits: 0, maxUnits: 0, percent: 0 }])}
                        className="w-full py-2.5 text-[12px] font-semibold border-t border-border hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground">
                        + Add Row
                      </button>
                    </div>
                  )}
                  <FieldError msg={errors.slabRows} />
                </div>

                <div className="space-y-1.5">
                  <label className={lbl}>CP Incentive / Bonus</label>
                  <input value={cpIncentive} onChange={e => setCpIncentive(e.target.value)}
                    className={inp()} placeholder="e.g. Extra 0.25% for deals closed before Mar 31" />
                </div>

                {/* Payment Plans */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Payment Plans</p>
                  {paymentPlans.map((plan, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={plan.name}
                        onChange={e => { const p = [...paymentPlans]; p[i] = { ...p[i], name: e.target.value }; setPaymentPlans(p); }}
                        className={`${inp()} w-40 shrink-0`} placeholder="Plan name (e.g. 20:80)" />
                      <input value={plan.description}
                        onChange={e => { const p = [...paymentPlans]; p[i] = { ...p[i], description: e.target.value }; setPaymentPlans(p); }}
                        className={inp()} placeholder="e.g. 20% on booking, 80% on possession" />
                      <button type="button"
                        onClick={() => setPaymentPlans(paymentPlans.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setPaymentPlans([...paymentPlans, { name: '', description: '' }])}
                    className="text-[12px] font-semibold text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl px-4 py-2 transition-colors hover:border-primary/40">
                    + Add Plan
                  </button>
                </div>
              </div>

              {/* ── 4. Unit Configuration ── */}
              <div id="section-4" className={card}>
                <SectionHeading n={4} title="Unit Configuration" icon={Layers}
                  desc="Specify carpet area, count, and base price for each unit type." />

                <div className="rounded-xl overflow-auto border border-border">
                  <table className="w-full text-[13px] min-w-[640px]">
                    <thead>
                      <tr className="bg-muted/40">
                        {['BHK Type', 'Carpet (sqft)', 'Super Built-up', 'Floors', 'Units', 'Base Price (₹)', 'Status'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {unitConfigs.map((uc, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2 font-semibold text-foreground">
                            {uc.bhkType || (
                              <input value={uc.bhkType}
                                onChange={e => { const c = [...unitConfigs]; c[i].bhkType = e.target.value; setUnitConfigs(c); }}
                                className={`w-20 ${ti}`} placeholder="3BHK" />
                            )}
                          </td>
                          {(['carpetArea', 'superBuiltUp'] as const).map(field => (
                            <td key={field} className="px-3 py-2">
                              <input type="number" min={0} value={uc[field] || ''}
                                onChange={e => { const c = [...unitConfigs]; c[i][field] = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                                className={`w-24 ${ti}`} />
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            <input value={uc.floors}
                              onChange={e => { const c = [...unitConfigs]; c[i].floors = e.target.value; setUnitConfigs(c); }}
                              className={`w-24 ${ti}`} placeholder="1-15" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={uc.count || ''}
                              onChange={e => { const c = [...unitConfigs]; c[i].count = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                              className={`w-16 ${ti}`} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={uc.basePrice || ''}
                              onChange={e => { const c = [...unitConfigs]; c[i].basePrice = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                              className={`w-28 ${ti}`} />
                          </td>
                          <td className="px-3 py-2">
                            <select value={uc.status}
                              onChange={e => { const c = [...unitConfigs]; c[i].status = e.target.value; setUnitConfigs(c); }}
                              className={`${ti} text-xs`}>
                              <option>Available</option>
                              <option>Coming Soon</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button"
                    onClick={() => setUnitConfigs([...unitConfigs, { bhkType: '', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' }])}
                    className="w-full py-2.5 text-[12px] font-semibold border-t border-border hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground">
                    + Add Row
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Selecting configurations above auto-populates rows. Add extra rows for custom types.</p>
              </div>

              {/* ── 5. Amenities & Documents ── */}
              <div id="section-5" className={card}>
                <SectionHeading n={5} title="Amenities & Documents" icon={Sparkles}
                  desc="Highlight lifestyle features and upload key project documents." />

                <div className="space-y-2">
                  <label className={lbl}>Amenities</label>
                  <div className="grid grid-cols-4 gap-2">
                    {amenityOptions.map(a => (
                      <button key={a} type="button"
                        onClick={() => toggleArr(amenities, a, setAmenities)}
                        className={`px-3 py-2 rounded-xl text-[12px] font-medium border text-left transition-all ${
                          amenities.includes(a)
                            ? 'text-white border-transparent'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                        }`}
                        style={amenities.includes(a) ? { background: 'linear-gradient(135deg,#0A7E8C,#0d9488)', borderColor: 'transparent' } : undefined}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Construction Specifications */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Construction Specifications</p>
                  <div className="grid grid-cols-3 gap-4">
                    {([
                      ['structure',  'Structure'],
                      ['flooring',   'Flooring'],
                      ['doors',      'Main Doors'],
                      ['windows',    'Windows'],
                      ['electrical', 'Electrical'],
                      ['plumbing',   'Plumbing'],
                      ['kitchen',    'Kitchen'],
                      ['bathrooms',  'Bathrooms'],
                      ['painting',   'Painting'],
                    ] as [keyof typeof specifications, string][]).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <label className={lbl}>{label}</label>
                        <input value={specifications[key]}
                          onChange={e => setSpecifications(s => ({ ...s, [key]: e.target.value }))}
                          className={inp()} placeholder={
                            key === 'structure'  ? 'e.g. RCC framed structure' :
                            key === 'flooring'   ? 'e.g. Vitrified tiles' :
                            key === 'doors'      ? 'e.g. Teak wood frame' :
                            key === 'windows'    ? 'e.g. UPVC sliding' :
                            key === 'electrical' ? 'e.g. Concealed copper wiring' :
                            key === 'plumbing'   ? 'e.g. CPVC pipes' :
                            key === 'kitchen'    ? 'e.g. Granite counter, ceramic tiles' :
                            key === 'bathrooms'  ? 'e.g. Anti-skid tiles, EWC' :
                            'e.g. OBD/Emulsion paint'
                          } />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clubhouse Area */}
                <div className="space-y-1.5">
                  <label className={lbl}>Clubhouse Area (sqft)</label>
                  <input type="number" min={0} value={clubhouseAreaSqft}
                    onChange={e => setClubhouseAreaSqft(parseInt(e.target.value) || '')}
                    className={`w-48 ${inp()}`} placeholder="e.g. 12000" />
                </div>

                {/* Doc uploads */}
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { label: 'Project Brochure', ref: brochureRef,   accept: '.pdf',         multiple: false as const,
                      icon: FileText, display: brochureFile ? brochureFile.name : null },
                    { label: 'RERA Certificate', ref: reraCertRef,   accept: '.pdf',         multiple: false as const,
                      icon: Shield,   display: reraCertFile ? reraCertFile.name : null },
                    { label: 'Floor Plans',      ref: floorPlansRef, accept: 'image/*,.pdf', multiple: true  as const,
                      icon: Layers,   display: floorPlanFiles?.length ? `${floorPlanFiles.length} file${floorPlanFiles.length > 1 ? 's' : ''} selected` : null },
                  ]).map(({ label, ref, accept, multiple, icon: Icon, display }) => (
                    <div key={label} className="space-y-1.5">
                      <label className={lbl}>{label}</label>
                      <div onClick={() => ref.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 flex flex-col items-center gap-2 transition-all bg-card">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                          <Icon size={14} className="text-muted-foreground" />
                        </div>
                        {display
                          ? <span className="text-foreground font-semibold truncate max-w-full text-[12px]">{display}</span>
                          : <span className="text-[12px] text-muted-foreground">Drop or click to upload</span>}
                        <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
                          onChange={e => {
                            if      (ref === brochureRef)   setBrochureFile(e.target.files?.[0] || null);
                            else if (ref === reraCertRef)   setReraCertFile(e.target.files?.[0] || null);
                            else if (ref === floorPlansRef) setFloorPlanFiles(e.target.files);
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 6. Gallery ── */}
              <div id="section-6" className={card}>
                <SectionHeading n={6} title="Renders & Gallery" icon={ImageIcon}
                  desc={`Drag images into each slot. The hero image feeds the customer banner. ${filledCount}/${GALLERY_SLOTS.length} filled.`} />

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '176px 176px', gap: 10 }}>
                  <div style={{ gridRow: '1 / 3' }}>
                    <GallerySlot slotKey="hero" label="Hero render · drop image" large
                      file={galleryImages.hero} onFile={f => setSlotFile('hero', f)} />
                  </div>
                  {(['tower', 'lobby', 'clubhouse', 'pool'] as SlotKey[]).map(key => {
                    const slot = GALLERY_SLOTS.find(s => s.key === key)!;
                    return (
                      <GallerySlot key={key} slotKey={key} label={slot.label} large={false}
                        file={galleryImages[key]} onFile={f => setSlotFile(key, f)} />
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={lbl}>
                      Walkthrough Video URL
                      <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">YouTube or Vimeo</span>
                    </label>
                    <div className="relative">
                      <Video size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                        className={`${inp()} pl-9`} placeholder="https://youtu.be/…" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>
                      360° Virtual Tour URL
                      <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">Matterport, Pano2VR</span>
                    </label>
                    <input type="url" value={virtualTourUrl} onChange={e => setVirtualTourUrl(e.target.value)}
                      className={inp()} placeholder="https://my.matterport.com/show/?m=…" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={lbl}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                    className={ta()} placeholder="Describe the project, its highlights, vision…" />
                </div>
              </div>

              {/* ── Footer actions ── */}
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => navigate('/builder/projects')}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground border border-border bg-card hover:bg-muted hover:text-foreground transition-all">
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={saveDraft}
                    className="px-5 py-2.5 text-[13px] font-semibold border border-border bg-muted/40 hover:bg-muted text-foreground rounded-xl transition-colors">
                    Save Draft
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitting}
                    className="px-8 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
                    {submitting ? <><Loader2 size={14} className="animate-spin" />Creating…</> : 'Create Project'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProjectWizard;