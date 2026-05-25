import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Building2, Home, MapPin, Landmark, Trees,
  Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ImageIcon, X,
} from 'lucide-react';
import GoogleMapsLocationField from '@/components/shared/GoogleMapsLocationField';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ── Constants ─────────────────────────────────────────────────────────────────
const projectTypes = [
  { value: 'Apartment',  icon: Building2, label: 'Apartment' },
  { value: 'Villa',      icon: Home,      label: 'Villa' },
  { value: 'Plot',       icon: MapPin,    label: 'Plot' },
  { value: 'Commercial', icon: Landmark,  label: 'Commercial' },
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

// Gallery named slots — order matches the grid in the screenshot
const GALLERY_SLOTS = [
  { key: 'hero',      label: 'Hero render · drop image', large: true,  dbCategory: 'Hero Render' },
  { key: 'tower',     label: 'Tower elevation',          large: false, dbCategory: 'Tower Elevation' },
  { key: 'lobby',     label: 'Lobby / arrival',          large: false, dbCategory: 'Lobby Arrival' },
  { key: 'clubhouse', label: 'Clubhouse',                large: false, dbCategory: 'Clubhouse' },
  { key: 'pool',      label: 'Pool deck',                large: false, dbCategory: 'Pool Deck' },
] as const;
type SlotKey = typeof GALLERY_SLOTS[number]['key'];

interface UnitConfig {
  bhkType: string; carpetArea: number; superBuiltUp: number;
  floors: string; count: number; basePrice: number; status: string;
}
type Errors = Record<string, string>;

// ── Style constants ────────────────────────────────────────────────────────────
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[11px] text-red-400 mt-1">{msg}</p> : null;

const ic = (err?: string) =>
  `w-full px-4 py-2.5 rounded-2xl border text-sm transition-all outline-none bg-white/80 backdrop-blur-sm text-gray-800 placeholder:text-gray-400
   ${err
     ? 'border-red-300 focus:ring-2 focus:ring-red-100/60 focus:border-red-400'
     : 'border-gray-200/80 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm'}`;

const lbl = 'text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block';

const SectionHeading = ({ n, title }: { n: number; title: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <span className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-300/40"
        style={{ background: 'linear-gradient(135deg,#0FA5BB,#0A7E8C)' }}>
        {n}
      </span>
      <h3 className="text-[22px] font-semibold text-gray-800 tracking-tight leading-tight">{title}</h3>
    </div>
    <div className="h-px bg-gray-100 ml-10" />
  </div>
);

const card = 'bg-white/75 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-gray-200/70 p-8 space-y-6';
const saveBtnCls = 'px-5 py-2 text-[11px] font-bold text-teal-600 border border-teal-200 rounded-xl bg-teal-50/80 hover:bg-teal-100/80 transition-colors shadow-sm';

// ── Date picker ───────────────────────────────────────────────────────────────
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

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isoOf      = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isSelected = (d: number) => value === isoOf(d);
  const isToday    = (d: number) => now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d;
  const displayValue = value
    ? `${value.slice(8)} ${MONTHS[+value.slice(5, 7) - 1]} ${value.slice(0, 4)}`
    : null;

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-400"> *</span>}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" data-error={!!error}
            className={`${ic(error)} flex items-center justify-between gap-2 text-left`}>
            <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
              {displayValue ?? placeholder}
            </span>
            <CalendarIcon size={13} className="text-gray-400 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-56 rounded-2xl shadow-xl border border-gray-100 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center gap-1 px-2 pt-2.5 pb-1.5">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronLeft size={13} />
            </button>
            <div className="flex-1 flex items-center justify-center gap-1">
              <select value={viewMonth} onChange={e => setViewMonth(+e.target.value)}
                className="text-[12px] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer hover:text-teal-600 transition-colors">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(+e.target.value)}
                className="text-[12px] font-semibold text-gray-700 bg-transparent outline-none cursor-pointer hover:text-teal-600 transition-colors">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-7 px-2 mb-0.5">
            {WEEK.map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-2 pb-2.5 gap-y-0.5">
            {cells.map((day, i) =>
              day === null ? <div key={i} /> : (
                <button key={i} type="button" onClick={() => { onChange(isoOf(day)); setOpen(false); }}
                  className={`h-7 w-full text-[12px] rounded-xl font-medium transition-colors
                    ${isSelected(day) ? 'bg-teal-500 text-white' : isToday(day) ? 'bg-teal-50 text-teal-600' : 'text-gray-700 hover:bg-gray-100'}`}>
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

// ── Gallery slot component ─────────────────────────────────────────────────────
function GallerySlot({ slotKey, label, large, file, onFile }: {
  slotKey: SlotKey; label: string; large: boolean;
  file: File | null; onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer select-none
        ${dragging ? 'border-teal-400 bg-teal-50/60 scale-[0.99]' : preview ? 'border-transparent' : 'border-gray-200 bg-gray-50/60 hover:border-teal-300 hover:bg-teal-50/30'}
        ${large ? 'min-h-[368px]' : 'min-h-[176px]'}`}
      onClick={() => !preview && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith('image/')) onFile(f);
      }}
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
        <div className="flex flex-col items-center gap-2.5 p-5 text-center pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-300" />
          </div>
          <span className="text-[11px] text-gray-400 font-medium leading-snug">{label}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        key={slotKey}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
const AddProjectWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ── Section 1: Identity ──────────────────────────────────────────────────────
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

  // ── Section 2: Location ──────────────────────────────────────────────────────
  const [address,          setAddress]          = useState('');
  const [city,             setCity]             = useState('Hyderabad');
  const [locality,         setLocality]         = useState('');
  const [pincode,          setPincode]          = useState('');
  const [landmark,         setLandmark]         = useState('');
  const [mapsLink,         setMapsLink]         = useState('');
  const [nearbyHighlights, setNearbyHighlights] = useState<string[]>([]);

  // ── Section 3: Pricing & Commission ─────────────────────────────────────────
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
  const [cpIncentive,    setCpIncentive]   = useState('');
  const [possessionDate, setPossessionDate] = useState('');
  const [closingSoon,    setClosingSoon]   = useState(false);
  const [featured,       setFeatured]      = useState(false);

  // ── Section 4: Unit Configuration ───────────────────────────────────────────
  const [unitConfigs, setUnitConfigs] = useState<UnitConfig[]>([
    { bhkType: '3BHK', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' },
  ]);

  // ── Section 5: Amenities, Documents ─────────────────────────────────────────
  const [amenities,  setAmenities] = useState<string[]>(['Swimming Pool', 'Gym', 'Clubhouse']);
  const [videoUrl,        setVideoUrl]        = useState('');
  const [virtualTourUrl,  setVirtualTourUrl]  = useState('');
  const brochureRef   = useRef<HTMLInputElement>(null);
  const reraCertRef   = useRef<HTMLInputElement>(null);
  const floorPlansRef = useRef<HTMLInputElement>(null);
  const [brochureFile,   setBrochureFile]   = useState<File | null>(null);
  const [reraCertFile,   setReraCertFile]   = useState<File | null>(null);
  const [floorPlanFiles, setFloorPlanFiles] = useState<FileList | null>(null);

  // ── Section 6: Gallery (named slots) ────────────────────────────────────────
  const [galleryImages, setGalleryImages] = useState<Record<SlotKey, File | null>>({
    hero: null, tower: null, lobby: null, clubhouse: null, pool: null,
  });
  const filledCount = Object.values(galleryImages).filter(Boolean).length;
  const setSlotFile = (key: SlotKey, file: File | null) =>
    setGalleryImages(prev => ({ ...prev, [key]: file }));

  const [errors,     setErrors]     = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Draft persistence ────────────────────────────────────────────────────────
  const DRAFT_KEY = 'dealio_new_project_draft';
  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      projectName, builderName, projectType, configurations, totalUnits, towers,
      floorsPerTower, projectStatus, reraNumber, reraExpiry, description,
      address, city, locality, pincode, landmark, mapsLink, nearbyHighlights,
      priceFrom, priceTo, pricePerSqftFrom, pricePerSqftTo, maintenance, floorRise,
      commissionType, flatPercent, slabRows, cpIncentive, possessionDate, closingSoon, featured,
      unitConfigs, amenities, videoUrl, virtualTourUrl,
    }));
    toast.success('Draft saved! You can come back and continue later.');
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
      if (typeof d.featured  === 'boolean')   setFeatured(d.featured);
      if (d.unitConfigs)    setUnitConfigs(d.unitConfigs as UnitConfig[]);
      if (d.amenities)      setAmenities(d.amenities as string[]);
      if (d.videoUrl)       setVideoUrl(d.videoUrl as string);
      if (d.virtualTourUrl) setVirtualTourUrl(d.virtualTourUrl as string);
      toast.info('Draft restored — continue where you left off.');
    } catch { /* ignore corrupted draft */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
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
      const existing = new Map(prev.map(u => [u.bhkType, u]));
      return newConfigs.map(c => existing.get(c) ?? { bhkType: c, carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' });
    });
  };

  const validate = () => {
    const e: Errors = {};
    if (!projectName.trim())            e.projectName    = 'Project name is required';
    if (!configurations.length)         e.configurations = 'Select at least one configuration';
    if (!totalUnits || totalUnits <= 0) e.totalUnits     = 'Total units is required';
    if (!reraNumber.trim())             e.reraNumber     = 'RERA number is required';
    else if (!/^[A-Z0-9/\-]{6,30}$/i.test(reraNumber.trim())) e.reraNumber = 'Invalid format — use alphanumeric (e.g. P02400012345)';
    if (!reraExpiry)                    e.reraExpiry     = 'RERA expiry date is required';
    if (!address.trim())                e.address        = 'Address is required';
    if (!locality.trim())               e.locality       = 'Locality is required';
    if (!pincode.trim())                e.pincode        = 'Pincode is required';
    else if (!/^\d{6}$/.test(pincode))  e.pincode        = 'Pincode must be 6 digits';
    if (!priceFrom || priceFrom <= 0)   e.priceFrom      = 'Starting price is required';
    if (!priceTo   || priceTo   <= 0)   e.priceTo        = 'Ending price is required';
    else if (priceTo < priceFrom)       e.priceTo        = 'Ending price must be ≥ starting price';
    if (!possessionDate)                e.possessionDate = 'Possession date is required';
    if (commissionType === 'flat' && (!flatPercent || flatPercent <= 0)) e.flatPercent = 'Commission % must be greater than 0';
    if (commissionType === 'slab' && slabRows.some(r => !r.percent || r.percent <= 0)) e.slabRows = 'All slab commission % values must be greater than 0';
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
        name:             projectName,
        location:         address || locality || city,
        city, locality, address, pincode,
        landmark:         landmark         || undefined,
        googleMapsLink:   mapsLink         || undefined,
        description:      description      || undefined,
        status:           toBackendStatus(projectStatus),
        projectType:      projectType.toUpperCase().replace(/\s+/g, '_'),
        bhkTypes:         configurations,
        configurations,
        totalUnits:       totalUnits    || undefined,
        towers:           towers        || undefined,
        floorsPerTower:   floorsPerTower|| undefined,
        reraId:           reraNumber    || undefined,
        reraNumber:       reraNumber    || undefined,
        reraExpiry:       reraExpiry    || undefined,
        amenities,
        nearbyHighlights: nearbyHighlights.length ? nearbyHighlights : undefined,
        possessionDate:   possessionDate  || undefined,
        priceMin:         priceFrom       || undefined,
        priceMax:         priceTo         || undefined,
        pricePerSqftMin:  pricePerSqftFrom|| undefined,
        pricePerSqftMax:  pricePerSqftTo  || undefined,
        maintenanceCharges: maintenance   || undefined,
        floorRiseCharges:   floorRise     || undefined,
        commissionPercent:  commissionType === 'flat' ? flatPercent : undefined,
        cpIncentive:        cpIncentive   || undefined,
        closingSoon, featured,
        videoUrl:        videoUrl        || undefined,
        virtualTourUrl:  virtualTourUrl  || undefined,
        builderName: builderName || undefined,
      };

      const created = await builderApi.createProject(builderId, payload) as { id?: number; projectId?: number };
      const projectId = created?.id ?? created?.projectId;

      if (projectId) {
        const uploads: Promise<void>[] = [];

        // Upload gallery images by category slot
        for (const slot of GALLERY_SLOTS) {
          const file = galleryImages[slot.key];
          if (!file) continue;
          if (slot.key === 'hero') {
            uploads.push(
              builderApi.uploadProjectImage(builderId, projectId, file)
                .then(coverUrl => builderApi.updateProject(builderId, projectId, { coverUrl }))
                .catch(() => { toast.warning('Hero image upload failed — you can add it later.'); })
            );
          } else {
            uploads.push(
              builderApi.uploadDocument(builderId, projectId, file, slot.dbCategory).catch(() => {})
            );
          }
        }

        // Document uploads
        if (floorPlanFiles?.length) {
          for (let i = 0; i < floorPlanFiles.length; i++) {
            uploads.push(builderApi.uploadDocument(builderId, projectId, floorPlanFiles[i], 'Floor Plan').catch(() => {}));
          }
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

  // ── Style helpers ─────────────────────────────────────────────────────────────
  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer
     ${active
       ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-teal-100/60 text-teal-700 shadow-sm shadow-teal-200/50'
       : 'border-gray-200/80 bg-white/70 text-gray-500 hover:border-gray-300 hover:bg-white/90'}`;

  const typeBtn = (active: boolean) =>
    `flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-[11px] font-bold transition-all
     ${active
       ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-teal-100/50 text-teal-700 shadow-md shadow-teal-200/50'
       : 'border-gray-200/80 bg-white/70 text-gray-400 hover:border-gray-300 hover:bg-white/90'}`;

  const ti = 'px-2.5 py-1.5 rounded-xl border border-gray-200/80 bg-white/80 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-400/30 focus:border-teal-400 transition-all';

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="min-h-full pb-12" style={{ background: 'linear-gradient(145deg,#f0fdfa 0%,#f8fafc 40%,#f5f3ff 80%,#ecfdf5 100%)' }}>
        <div className="max-w-3xl mx-auto space-y-5 pt-1">

          {/* Back */}
          <button onClick={() => navigate('/builder/projects')}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={14} /> Back to Projects
          </button>

          {/* Header */}
          <div className="pb-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-200/60 mb-3 shadow-sm">
              <Building2 size={11} className="text-teal-600" />
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">New Project</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Add New Project</h2>
            <p className="text-sm text-gray-500 mt-1.5">Fill in each section and save as draft anytime — submit when ready.</p>
          </div>

          {/* ── 1. Project Identity ──────────────────────────────────────────── */}
          <div className={card}>
            <SectionHeading n={1} title="Project Identity" />
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={lbl}>Project Name <span className="text-red-400">*</span></label>
                <input value={projectName}
                  onChange={e => { setProjectName(e.target.value); setErrors(p => ({ ...p, projectName: '' })); }}
                  className={ic(errors.projectName)} data-error={!!errors.projectName} />
                <FieldError msg={errors.projectName} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Developer / Builder Name</label>
                <input value={builderName} onChange={e => setBuilderName(e.target.value)} className={ic()} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Project Type <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-5 gap-2">
                  {projectTypes.map(t => (
                    <button key={t.value} type="button" onClick={() => setProjectType(t.value)} className={typeBtn(projectType === t.value)}>
                      <t.icon size={18} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Configurations <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {bhkOptions.map(b => (
                    <button key={b} type="button"
                      onClick={() => { syncUnitConfigs(configurations.includes(b) ? configurations.filter(x => x !== b) : [...configurations, b]); setErrors(p => ({ ...p, configurations: '' })); }}
                      className={chip(configurations.includes(b))}>
                      {b}
                    </button>
                  ))}
                </div>
                <FieldError msg={errors.configurations} />
              </div>
              <div>
                <label className={lbl}>Number of Towers</label>
                <input type="number" min={0} value={towers || ''} onChange={e => setTowers(parseInt(e.target.value) || 0)} className={ic()} />
              </div>
              <div>
                <label className={lbl}>Total Units <span className="text-red-400">*</span></label>
                <input type="number" min={0} value={totalUnits || ''}
                  onChange={e => { setTotalUnits(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, totalUnits: '' })); }}
                  className={ic(errors.totalUnits)} data-error={!!errors.totalUnits} />
                <FieldError msg={errors.totalUnits} />
              </div>
              <div>
                <label className={lbl}>Floors per Tower</label>
                <input type="number" min={0} value={floorsPerTower || ''} onChange={e => setFloorsPerTower(parseInt(e.target.value) || 0)} className={ic()} />
              </div>
              <div>
                <label className={lbl}>Project Status <span className="text-red-400">*</span></label>
                <select value={projectStatus} onChange={e => setProjectStatus(e.target.value)} className={ic()}>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>RERA Number <span className="text-red-400">*</span></label>
                <input value={reraNumber} maxLength={30}
                  onChange={e => { setReraNumber(e.target.value.toUpperCase()); setErrors(p => ({ ...p, reraNumber: '' })); }}
                  className={ic(errors.reraNumber)} placeholder="e.g. P02400012345" data-error={!!errors.reraNumber} />
                <p className="text-[10px] text-gray-300 mt-1">Alphanumeric, 6–30 chars · {30 - reraNumber.length} remaining</p>
                <FieldError msg={errors.reraNumber} />
              </div>
              <DatePickerField label="RERA Expiry" value={reraExpiry}
                onChange={v => { setReraExpiry(v); setErrors(p => ({ ...p, reraExpiry: '' })); }}
                error={errors.reraExpiry} required placeholder="Select expiry date"
                fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 20} />
            </div>
            <div className="flex justify-end pt-1">
              <button type="button" onClick={saveDraft} className={saveBtnCls}>Save Draft</button>
            </div>
          </div>

          {/* ── 2. Location ──────────────────────────────────────────────────── */}
          <div className={card}>
            <SectionHeading n={2} title="Location" />
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={lbl}>Full Address <span className="text-red-400">*</span></label>
                <textarea value={address}
                  onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm resize-none outline-none transition-all bg-white/80 backdrop-blur-sm text-gray-800 placeholder:text-gray-400
                    ${errors.address ? 'border-red-300 focus:ring-2 focus:ring-red-100/60 focus:border-red-400' : 'border-gray-200/80 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm'}`}
                  data-error={!!errors.address} />
                <FieldError msg={errors.address} />
              </div>
              <div>
                <label className={lbl}>City <span className="text-red-400">*</span></label>
                <select value={city} onChange={e => setCity(e.target.value)} className={ic()}>
                  {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Locality / Area <span className="text-red-400">*</span></label>
                <input value={locality}
                  onChange={e => { setLocality(e.target.value); setErrors(p => ({ ...p, locality: '' })); }}
                  className={ic(errors.locality)} placeholder="e.g. Gachibowli" data-error={!!errors.locality} />
                <FieldError msg={errors.locality} />
              </div>
              <div>
                <label className={lbl}>Pincode <span className="text-red-400">*</span></label>
                <input value={pincode} maxLength={6}
                  onChange={e => { setPincode(e.target.value); setErrors(p => ({ ...p, pincode: '' })); }}
                  className={ic(errors.pincode)} data-error={!!errors.pincode} />
                <FieldError msg={errors.pincode} />
              </div>
              <div>
                <label className={lbl}>Landmark</label>
                <input value={landmark} onChange={e => setLandmark(e.target.value)} className={ic()} />
              </div>
              <GoogleMapsLocationField value={mapsLink} onChange={setMapsLink} address={address} city={city} />
              <div className="col-span-2">
                <label className={lbl}>Nearby Highlights</label>
                <div className="flex flex-wrap gap-2">
                  {nearbyOptions.map(n => (
                    <button key={n} type="button" onClick={() => toggleArr(nearbyHighlights, n, setNearbyHighlights)}
                      className={chip(nearbyHighlights.includes(n))}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button type="button" onClick={saveDraft} className={saveBtnCls}>Save Draft</button>
            </div>
          </div>

          {/* ── 3. Pricing & Commission ───────────────────────────────────────── */}
          <div className={card}>
            <SectionHeading n={3} title="Pricing & Commission" />
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={lbl}>Price From (₹) <span className="text-red-400">*</span></label>
                <input type="number" min={0} value={priceFrom || ''}
                  onChange={e => { setPriceFrom(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, priceFrom: '' })); }}
                  className={ic(errors.priceFrom)} placeholder="e.g. 8500000" data-error={!!errors.priceFrom} />
                <FieldError msg={errors.priceFrom} />
              </div>
              <div>
                <label className={lbl}>Price To (₹) <span className="text-red-400">*</span></label>
                <input type="number" min={0} value={priceTo || ''}
                  onChange={e => { setPriceTo(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, priceTo: '' })); }}
                  className={ic(errors.priceTo)} data-error={!!errors.priceTo} />
                <FieldError msg={errors.priceTo} />
              </div>
              <div>
                <label className={lbl}>₹ / sqft From</label>
                <input type="number" min={0} max={99999} value={pricePerSqftFrom || ''}
                  onChange={e => { const v = parseInt(e.target.value) || 0; if (v <= 99999) setPricePerSqftFrom(v); }} className={ic()} />
              </div>
              <div>
                <label className={lbl}>₹ / sqft To</label>
                <input type="number" min={0} max={99999} value={pricePerSqftTo || ''}
                  onChange={e => { const v = parseInt(e.target.value) || 0; if (v <= 99999) setPricePerSqftTo(v); }} className={ic()} />
              </div>
              <div>
                <label className={lbl}>Maintenance (₹/sqft/month)</label>
                <input type="number" min={0} step={0.01} value={maintenance || ''}
                  onChange={e => setMaintenance(parseFloat(e.target.value) || 0)} className={ic()} />
              </div>
              <div>
                <label className={lbl}>Floor Rise (₹/floor)</label>
                <input type="number" min={0} step={0.01} value={floorRise || ''}
                  onChange={e => setFloorRise(parseFloat(e.target.value) || 0)} className={ic()} />
              </div>
              <DatePickerField label="Possession Date" value={possessionDate}
                onChange={v => { setPossessionDate(v); setErrors(p => ({ ...p, possessionDate: '' })); }}
                error={errors.possessionDate} required placeholder="Select possession date"
                fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} />
              <div className="flex flex-col gap-3 justify-end pb-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={closingSoon} onChange={e => setClosingSoon(e.target.checked)}
                    className="rounded accent-teal-500 w-3.5 h-3.5" />
                  <span className="text-xs text-gray-500">Mark as "Closing Soon"</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)}
                    className="rounded accent-teal-500 w-3.5 h-3.5" />
                  <span className="text-xs text-gray-500">Featured / Priority Push</span>
                </label>
              </div>

              {/* Commission */}
              <div className="col-span-2">
                <label className={lbl}>Commission Structure</label>
                <div className="flex gap-2 mb-4">
                  {(['flat', 'slab'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setCommissionType(t)}
                      className={`px-5 py-2 rounded-2xl text-[11px] font-bold border transition-all
                        ${commissionType === t
                          ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-teal-100/50 text-teal-700 shadow-sm'
                          : 'border-gray-200/80 bg-white/70 text-gray-400 hover:bg-white/90'}`}>
                      {t === 'flat' ? 'Flat %' : 'Slab-based'}
                    </button>
                  ))}
                </div>
                {commissionType === 'flat' ? (
                  <div className="flex items-center gap-3">
                    <input type="number" value={flatPercent} min={0.01} step={0.01}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const n = isNaN(val) ? 0 : val;
                        setFlatPercent(n);
                        setErrors(p => ({ ...p, flatPercent: n <= 0 ? 'Must be greater than 0' : '' }));
                      }}
                      onBlur={() => { if (!flatPercent || flatPercent <= 0) setFlatPercent(0.01); }}
                      className={`w-32 px-4 py-2.5 rounded-2xl border text-sm bg-white/80 text-gray-700 outline-none transition-all
                        ${errors.flatPercent ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-gray-200/80 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400'}`} />
                    <span className="text-sm text-gray-400 font-medium">%</span>
                    <FieldError msg={errors.flatPercent} />
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-gray-200/80 bg-white/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80">
                          {['Min Units', 'Max Units', 'Commission %'].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {slabRows.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100/80">
                            <td className="px-3 py-2.5"><input type="number" value={row.minUnits}
                              onChange={e => { const r = [...slabRows]; r[i].minUnits = parseInt(e.target.value) || 0; setSlabRows(r); }}
                              className={`w-20 ${ti}`} /></td>
                            <td className="px-3 py-2.5"><input type="number" value={row.maxUnits}
                              onChange={e => { const r = [...slabRows]; r[i].maxUnits = parseInt(e.target.value) || 0; setSlabRows(r); }}
                              className={`w-20 ${ti}`} /></td>
                            <td className="px-3 py-2.5"><input type="number" value={row.percent} min={0.01} step={0.01}
                              onChange={e => { const r = [...slabRows]; r[i].percent = parseFloat(e.target.value) || 0; setSlabRows(r); setErrors(p => ({ ...p, slabRows: '' })); }}
                              className={`w-20 ${ti}`} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button"
                      onClick={() => setSlabRows([...slabRows, { minUnits: 0, maxUnits: 0, percent: 0 }])}
                      className="w-full py-2.5 text-[11px] text-teal-500 hover:bg-teal-50/40 border-t border-gray-100 transition-colors font-semibold">
                      + Add Row
                    </button>
                  </div>
                )}
                <FieldError msg={errors.slabRows} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>CP Incentive / Bonus</label>
                <input value={cpIncentive} onChange={e => setCpIncentive(e.target.value)}
                  className={ic()} placeholder="e.g. Extra 0.25% for deals closed before Mar 31" />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button type="button" onClick={saveDraft} className={saveBtnCls}>Save Draft</button>
            </div>
          </div>

          {/* ── 4. Unit Configuration ────────────────────────────────────────── */}
          <div className={card}>
            <SectionHeading n={4} title="Unit Configuration" />
            <div className="rounded-2xl overflow-auto border border-gray-200/80 bg-white/60">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50/80">
                    {['BHK Type', 'Carpet (sqft)', 'Super Built-up', 'Floors', 'Units', 'Base Price (₹)', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unitConfigs.map((uc, i) => (
                    <tr key={i} className="border-t border-gray-100/80 hover:bg-teal-50/20 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-gray-600 text-xs">{uc.bhkType || (
                        <input value={uc.bhkType}
                          onChange={e => { const c = [...unitConfigs]; c[i].bhkType = e.target.value; setUnitConfigs(c); }}
                          className={`w-20 ${ti}`} placeholder="e.g. 3BHK" />
                      )}</td>
                      <td className="px-3 py-2.5"><input type="number" min={0} value={uc.carpetArea || ''}
                        onChange={e => { const c = [...unitConfigs]; c[i].carpetArea = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                        className={`w-20 ${ti}`} /></td>
                      <td className="px-3 py-2.5"><input type="number" min={0} value={uc.superBuiltUp || ''}
                        onChange={e => { const c = [...unitConfigs]; c[i].superBuiltUp = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                        className={`w-20 ${ti}`} /></td>
                      <td className="px-3 py-2.5"><input value={uc.floors}
                        onChange={e => { const c = [...unitConfigs]; c[i].floors = e.target.value; setUnitConfigs(c); }}
                        className={`w-24 ${ti}`} placeholder="1-15" /></td>
                      <td className="px-3 py-2.5"><input type="number" min={0} value={uc.count || ''}
                        onChange={e => { const c = [...unitConfigs]; c[i].count = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                        className={`w-16 ${ti}`} /></td>
                      <td className="px-3 py-2.5"><input type="number" min={0} value={uc.basePrice || ''}
                        onChange={e => { const c = [...unitConfigs]; c[i].basePrice = parseInt(e.target.value) || 0; setUnitConfigs(c); }}
                        className={`w-28 ${ti}`} /></td>
                      <td className="px-3 py-2.5">
                        <select value={uc.status}
                          onChange={e => { const c = [...unitConfigs]; c[i].status = e.target.value; setUnitConfigs(c); }}
                          className="px-2.5 py-1.5 rounded-xl border border-gray-200/80 bg-white/80 text-xs text-gray-600 focus:outline-none focus:border-teal-400">
                          <option>Available</option><option>Coming Soon</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button"
                onClick={() => setUnitConfigs([...unitConfigs, { bhkType: '', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' }])}
                className="w-full py-2.5 text-[11px] text-teal-500 hover:bg-teal-50/40 border-t border-gray-100 transition-colors font-semibold">
                + Add Row
              </button>
            </div>
            <p className="text-[10px] text-gray-300 mt-1">Selecting configurations above auto-populates rows. Add extra rows for custom types.</p>
            <div className="flex justify-end pt-1">
              <button type="button" onClick={saveDraft} className={saveBtnCls}>Save Draft</button>
            </div>
          </div>

          {/* ── 5. Amenities & Documents ─────────────────────────────────────── */}
          <div className={card}>
            <SectionHeading n={5} title="Amenities & Documents" />

            {/* Amenities */}
            <div>
              <label className={lbl}>Amenities</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {amenityOptions.map(a => (
                  <button key={a} type="button" onClick={() => toggleArr(amenities, a, setAmenities)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border text-left transition-all
                      ${amenities.includes(a)
                        ? 'border-teal-400 bg-gradient-to-br from-teal-50 to-teal-100/60 text-teal-700 shadow-sm'
                        : 'border-gray-200/80 bg-white/70 text-gray-600 hover:border-gray-300 hover:bg-white/90'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Document uploads — no project images here; those go in the gallery section */}
            <div className="grid grid-cols-3 gap-4">
              {([
                { label: 'Project Brochure', ref: brochureRef,   accept: '.pdf',         multiple: false,
                  display: brochureFile   ? brochureFile.name : null },
                { label: 'RERA Certificate', ref: reraCertRef,   accept: '.pdf',         multiple: false,
                  display: reraCertFile   ? reraCertFile.name : null },
                { label: 'Floor Plans',      ref: floorPlansRef, accept: 'image/*,.pdf', multiple: true,
                  display: floorPlanFiles?.length ? `${floorPlanFiles.length} file${floorPlanFiles.length > 1 ? 's' : ''} selected` : null },
              ] as const).map(({ label, ref, accept, multiple, display }) => (
                <div key={label}>
                  <label className={lbl}>{label}</label>
                  <div onClick={() => ref.current?.click()}
                    className="border-2 border-dashed border-gray-200/80 rounded-2xl p-5 text-center text-xs text-gray-300 cursor-pointer hover:border-teal-300 hover:bg-teal-50/20 flex flex-col items-center gap-2 transition-all bg-white/40">
                    <div className="w-8 h-8 rounded-xl bg-gray-100/80 flex items-center justify-center">
                      <ImageIcon size={14} className="text-gray-300" />
                    </div>
                    {display
                      ? <span className="text-gray-600 font-semibold truncate max-w-full text-[11px]">{display}</span>
                      : <span className="text-gray-400 text-[11px]">{multiple ? 'Drop or click' : 'Drop or click'}</span>}
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

            <div className="flex justify-end pt-1">
              <button type="button" onClick={saveDraft} className={saveBtnCls}>Save Draft</button>
            </div>
          </div>

          {/* ── 6. Renders & Gallery ─────────────────────────────────────────── */}
          <div className={card}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 shadow-md shadow-teal-300/40"
                    style={{ background: 'linear-gradient(135deg,#0FA5BB,#0A7E8C)' }}>6</span>
                  <h3 className="text-[22px] font-semibold text-gray-800 tracking-tight leading-tight">
                    Renders <span className="italic font-light text-gray-500">&amp; gallery</span>
                  </h3>
                </div>
                <p className="text-[12px] text-gray-400 ml-10">
                  Drag images into each slot. The first three feed the customer hero — choose your strongest.
                </p>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap pt-1">
                {filledCount} of {GALLERY_SLOTS.length} filled
              </span>
            </div>

            <div className="h-px bg-gray-100 mb-6" />

            {/* Gallery grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '184px 184px', gap: 12 }}>
              {/* Hero — spans 2 rows */}
              <div style={{ gridRow: '1 / 3' }}>
                <GallerySlot
                  slotKey="hero"
                  label="Hero render · drop image"
                  large
                  file={galleryImages.hero}
                  onFile={f => setSlotFile('hero', f)}
                />
              </div>
              {/* 4 smaller slots */}
              {(['tower', 'lobby', 'clubhouse', 'pool'] as SlotKey[]).map(key => {
                const slot = GALLERY_SLOTS.find(s => s.key === key)!;
                return (
                  <GallerySlot
                    key={key}
                    slotKey={key}
                    label={slot.label}
                    large={false}
                    file={galleryImages[key]}
                    onFile={f => setSlotFile(key, f)}
                  />
                );
              })}
            </div>

            {/* Video & Virtual Tour */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className={lbl}>
                  Walkthrough Video URL{' '}
                  <span className="font-normal normal-case text-gray-400 tracking-normal">YouTube or Vimeo</span>
                </label>
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  className={ic()} placeholder="https://youtu.be/…" />
              </div>
              <div>
                <label className={lbl}>
                  360° Virtual Tour URL{' '}
                  <span className="font-normal normal-case text-gray-400 tracking-normal">Matterport, Pano2VR</span>
                </label>
                <input type="url" value={virtualTourUrl} onChange={e => setVirtualTourUrl(e.target.value)}
                  className={ic()} placeholder="https://my.matterport.com/show/?m=…" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={lbl}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm text-sm text-gray-800 placeholder:text-gray-400 resize-none outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all shadow-sm"
                placeholder="Describe the project, its highlights, vision…" />
            </div>

            <div className="flex justify-end pt-1">
              <button type="button" onClick={saveDraft} className={saveBtnCls}>Save Draft</button>
            </div>
          </div>

          {/* ── Submit ───────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pb-8 pt-1">
            <button type="button" onClick={() => navigate('/builder/projects')}
              className="px-5 py-2.5 rounded-2xl text-sm text-gray-400 border border-gray-200/80 hover:bg-white/80 hover:text-gray-600 transition-all bg-white/60 backdrop-blur-sm shadow-sm">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="px-10 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-teal-400/30"
              style={{ background: 'linear-gradient(135deg,#0FA5BB,#0A7E8C)' }}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Project'}
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProjectWizard;