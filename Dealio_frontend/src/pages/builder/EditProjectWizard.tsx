import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Home, MapPin, Landmark, Trees, Upload, Loader2 } from 'lucide-react';
import GoogleMapsLocationField from '@/components/shared/GoogleMapsLocationField';
import DatePickerField from '@/components/shared/DatePickerField';

const projectTypes = [
  { value: 'Apartment',  icon: Building2, label: 'Apartment' },
  { value: 'Villa',      icon: Home,      label: 'Villa' },
  { value: 'Plot',       icon: MapPin,    label: 'Plot' },
  { value: 'Commercial', icon: Landmark,  label: 'Commercial' },
  { value: 'Mixed Use',  icon: Trees,     label: 'Mixed Use' },
];

const bhkOptions     = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Penthouse'];
const statusOptions  = ['Pre-Launch', 'New Launch', 'Launched', 'Active', 'Under Construction', 'Ready to Move', 'Closing Soon'];
const cityOptions    = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
const nearbyOptions  = ['Metro Station', 'Airport', 'IT Park', 'Hospital', 'School', 'Mall', 'Highway'];
const amenityOptions = [
  'Swimming Pool', 'Gym', 'Clubhouse', "Children's Play Area", 'Jogging Track', 'Tennis Court',
  'Basketball Court', 'Indoor Games', 'Party Hall', 'Co-working Space', 'EV Charging', 'Solar Power',
  'Rainwater Harvesting', '24hr Security', 'CCTV', 'Power Backup', 'Intercom', 'Vastu Compliant',
  'Gated Community', 'Visitor Parking', 'Landscaped Gardens', 'Senior Citizen Area',
];

interface UnitConfig {
  bhkType: string; carpetArea: number; superBuiltUp: number;
  floors: string; count: number; basePrice: number; status: string;
}

interface ProjectDetail {
  id: number; builderId?: number; name: string; projectType: string | null;
  status: string; description: string | null; address: string | null;
  city: string | null; locality: string | null; pincode: string | null;
  landmark: string | null; googleMapsLink: string | null;
  reraNumber: string | null; reraExpiry: string | null;
  totalUnits: number | null; towers: number | null; floorsPerTower: number | null;
  configurations: string[] | null; amenities: string[] | null;
  nearbyHighlights: string[] | null; priceMin: number | null; priceMax: number | null;
  pricePerSqftMin: number | null; pricePerSqftMax: number | null;
  maintenanceCharges: number | null; floorRiseCharges: number | null;
  commissionStructure: string | null; commissionValue: number | null;
  possessionDate: string | null; closingSoon: boolean; featured: boolean;
  published: boolean; videoUrl: string | null; builderName?: string | null;
  cpIncentive?: string | null;
}

type Errors = Record<string, string>;

// ── Style helpers (same as AddProjectWizard) ────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[11px] text-red-400 mt-1">{msg}</p> : null;

const ic = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none bg-white text-gray-800 placeholder:text-gray-500
   ${err
     ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-400'
     : 'border-gray-300 focus:ring-2 focus:ring-teal-500/15 focus:border-teal-400'}`;

const lbl = 'text-xs font-semibold text-gray-500 mb-1.5 block';

const SectionHeading = ({ n, title }: { n: number; title: string }) => (
  <div className="flex items-center gap-3 mb-7">
    <span className="w-6 h-6 rounded-full bg-teal-50 ring-1 ring-teal-200 text-teal-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </span>
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h3>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

const card = 'bg-white rounded-2xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8 space-y-6';

// ── Conversion helpers ──────────────────────────────────────────────────────

const fromBackendStatus = (s: string): string => {
  const map: Record<string, string> = {
    PRE_LAUNCH: 'Pre-Launch', NEW_LAUNCH: 'New Launch',
    LAUNCHED: 'Launched', ACTIVE: 'Active',
    UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
    CLOSING_SOON: 'Closing Soon',
  };
  return map[s] ?? 'Under Construction';
};

const toBackendStatus = (s: string): string => {
  const map: Record<string, string> = {
    'Pre-Launch': 'PRE_LAUNCH', 'New Launch': 'NEW_LAUNCH',
    'Launched': 'LAUNCHED', 'Active': 'ACTIVE',
    'Under Construction': 'UNDER_CONSTRUCTION', 'Ready to Move': 'READY_TO_MOVE',
    'Closing Soon': 'CLOSING_SOON',
  };
  return map[s] ?? 'PRE_LAUNCH';
};

const fromBackendProjectType = (s: string | null): string => {
  const map: Record<string, string> = {
    APARTMENT: 'Apartment', VILLA: 'Villa', PLOT: 'Plot',
    COMMERCIAL: 'Commercial', MIXED_USE: 'Mixed Use',
  };
  return (s && map[s]) ? map[s] : 'Apartment';
};

// ── Component ───────────────────────────────────────────────────────────────

const EditProjectWizard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loadingProject, setLoadingProject] = useState(true);
  const [builderId, setBuilderId] = useState<string | null>(null);

  // ── Section 1: Identity ──────────────────────────────────────────────────
  const [projectName,    setProjectName]    = useState('');
  const [builderName,    setBuilderName]    = useState('');
  const [projectType,    setProjectType]    = useState('Apartment');
  const [configurations, setConfigurations] = useState<string[]>([]);
  const [totalUnits,     setTotalUnits]     = useState<number>(0);
  const [towers,         setTowers]         = useState<number>(0);
  const [floorsPerTower, setFloorsPerTower] = useState<number>(0);
  const [projectStatus,  setProjectStatus]  = useState('Under Construction');
  const [reraNumber,     setReraNumber]     = useState('');
  const [reraExpiry,     setReraExpiry]     = useState('');
  const [description,    setDescription]   = useState('');

  // ── Section 2: Location ──────────────────────────────────────────────────
  const [address,          setAddress]          = useState('');
  const [city,             setCity]             = useState('Hyderabad');
  const [locality,         setLocality]         = useState('');
  const [pincode,          setPincode]          = useState('');
  const [landmark,         setLandmark]         = useState('');
  const [mapsLink,         setMapsLink]         = useState('');
  const [nearbyHighlights, setNearbyHighlights] = useState<string[]>([]);

  // ── Section 3: Pricing & Commission ────────────────────────────────────
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

  // ── Section 4: Unit Configuration ───────────────────────────────────────
  const [unitConfigs, setUnitConfigs] = useState<UnitConfig[]>([]);

  // ── Section 5: Amenities / Media / Documents ─────────────────────────────
  const [amenities,  setAmenities] = useState<string[]>([]);
  const [videoUrl,   setVideoUrl]  = useState('');
  const brochureRef   = useRef<HTMLInputElement>(null);
  const reraCertRef   = useRef<HTMLInputElement>(null);
  const floorPlansRef = useRef<HTMLInputElement>(null);
  const imagesRef     = useRef<HTMLInputElement>(null);
  const [brochureFile,   setBrochureFile]   = useState<File | null>(null);
  const [reraCertFile,   setReraCertFile]   = useState<File | null>(null);
  const [floorPlanFiles, setFloorPlanFiles] = useState<FileList | null>(null);
  const [imageFiles,     setImageFiles]     = useState<FileList | null>(null);

  const [errors,     setErrors]     = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch project and pre-populate ──────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !id) return;
    (async () => {
      try {
        let bid = builderApi.getCachedBuilderId();
        if (!bid) {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const bd = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
          bid = String(bd.builderId);
          builderApi.setCachedBuilderId(bid);
        }
        const raw = await builderApi.getProject(bid, id) as ProjectDetail & { coverUrl?: string };
        const p: ProjectDetail = raw;
        const effectiveBid = p.builderId ? String(p.builderId) : bid;
        if (effectiveBid !== bid) builderApi.setCachedBuilderId(effectiveBid);
        setBuilderId(effectiveBid);

        // Pre-populate form state
        setProjectName(p.name ?? '');
        setBuilderName(p.builderName ?? '');
        setProjectType(fromBackendProjectType(p.projectType));
        const cfgs = p.configurations ?? [];
        setConfigurations(cfgs);
        setUnitConfigs(cfgs.map(c => ({ bhkType: c, carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' })));
        setTotalUnits(p.totalUnits ?? 0);
        setTowers(p.towers ?? 0);
        setFloorsPerTower(p.floorsPerTower ?? 0);
        setProjectStatus(fromBackendStatus(p.status));
        setReraNumber(p.reraNumber ?? '');
        setReraExpiry(p.reraExpiry ?? '');
        setDescription(p.description ?? '');
        setAddress(p.address ?? '');
        setCity(p.city ?? 'Hyderabad');
        setLocality(p.locality ?? '');
        setPincode(p.pincode ?? '');
        setLandmark(p.landmark ?? '');
        setMapsLink(p.googleMapsLink ?? '');
        setNearbyHighlights(p.nearbyHighlights ?? []);
        setPriceFrom(p.priceMin ?? 0);
        setPriceTo(p.priceMax ?? 0);
        setPricePerSqftFrom(p.pricePerSqftMin ?? 0);
        setPricePerSqftTo(p.pricePerSqftMax ?? 0);
        setMaintenance(p.maintenanceCharges ?? 0);
        setFloorRise(p.floorRiseCharges ?? 0);
        const isFlat = !p.commissionStructure || p.commissionStructure.toUpperCase() !== 'SLAB';
        setCommissionType(isFlat ? 'flat' : 'slab');
        if (p.commissionValue != null && p.commissionValue > 0) setFlatPercent(p.commissionValue);
        setCpIncentive(p.cpIncentive ?? '');
        setPossessionDate(p.possessionDate ?? '');
        setClosingSoon(p.closingSoon ?? false);
        setFeatured(p.featured ?? false);
        setAmenities(p.amenities ?? []);
        setVideoUrl(p.videoUrl ?? '');
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load project');
        navigate(`/builder/projects/${id}`);
      } finally {
        setLoadingProject(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleArr = (arr: string[], item: string, set: (a: string[]) => void) =>
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);

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
      const el = document.querySelector('[data-error="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!builderId || !id) { toast.error('Project data missing — please reload'); return; }
    setSubmitting(true);
    try {
      const payload = {
        name:               projectName,
        location:           address || locality || city,
        city, locality, address, pincode,
        landmark:           landmark         || undefined,
        googleMapsLink:     mapsLink         || undefined,
        description:        description      || undefined,
        status:             toBackendStatus(projectStatus),
        projectType:        projectType.toUpperCase().replace(/\s+/g, '_'),
        bhkTypes:           configurations,
        configurations,
        totalUnits:         totalUnits       || undefined,
        towers:             towers           || undefined,
        floorsPerTower:     floorsPerTower   || undefined,
        reraId:             reraNumber       || undefined,
        reraNumber:         reraNumber       || undefined,
        reraExpiry:         reraExpiry       || undefined,
        amenities,
        nearbyHighlights:   nearbyHighlights.length ? nearbyHighlights : undefined,
        possessionDate:     possessionDate   || undefined,
        priceMin:           priceFrom        || undefined,
        priceMax:           priceTo          || undefined,
        pricePerSqftMin:    pricePerSqftFrom || undefined,
        pricePerSqftMax:    pricePerSqftTo   || undefined,
        maintenanceCharges: maintenance      || undefined,
        floorRiseCharges:   floorRise        || undefined,
        commissionPercent:  commissionType === 'flat' ? flatPercent : undefined,
        commissionValue:    commissionType === 'flat' ? flatPercent : undefined,
        cpIncentive:        cpIncentive      || undefined,
        closingSoon, featured,
        videoUrl:           videoUrl         || undefined,
        builderName:        builderName      || undefined,
      };

      await builderApi.updateProject(builderId, id, payload);

      // Upload new files if any were selected
      const uploads: Promise<void>[] = [];
      if (imageFiles?.length) {
        uploads.push(
          builderApi.uploadProjectImage(builderId, id, imageFiles[0])
            .then(coverUrl => builderApi.updateProject(builderId, id, { coverUrl }))
            .catch(() => { toast.warning('Cover image upload failed — you can change it from the project page.'); })
        );
        for (let i = 1; i < imageFiles.length; i++) {
          uploads.push(builderApi.uploadDocument(builderId, id, imageFiles[i], 'Project Image').catch(() => {}));
        }
      }
      if (floorPlanFiles?.length) {
        for (let i = 0; i < floorPlanFiles.length; i++) {
          uploads.push(builderApi.uploadDocument(builderId, id, floorPlanFiles[i], 'Floor Plan').catch(() => {}));
        }
      }
      if (brochureFile)  uploads.push(builderApi.uploadDocument(builderId, id, brochureFile,  'Brochure').catch(() => {}));
      if (reraCertFile)  uploads.push(builderApi.uploadDocument(builderId, id, reraCertFile,  'RERA Certificate').catch(() => {}));
      await Promise.all(uploads);

      toast.success('Project updated successfully!');
      navigate(`/builder/projects/${id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chip & type button helpers ────────────────────────────────────────────
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer
     ${active ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`;

  const typeBtn = (active: boolean) =>
    `flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 text-xs font-medium transition-all
     ${active ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`;

  const ti = 'px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-400/30 focus:border-teal-400 transition-all';

  // ── Loading state ────────────────────────────────────────────────────────
  if (loadingProject) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-32">
          <Loader2 size={28} className="animate-spin text-teal-500" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate(`/builder/projects/${id}`)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={14} /> Back to Project
        </button>

        {/* Header */}
        <div className="pb-1">
          <h2 className="text-xl font-semibold text-gray-700 tracking-tight">Edit Project</h2>
          <p className="text-sm text-gray-400 mt-1">Update project details — changes are saved when you click Save Changes.</p>
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
              <input value={reraNumber}
                onChange={e => { setReraNumber(e.target.value.toUpperCase()); setErrors(p => ({ ...p, reraNumber: '' })); }}
                className={ic(errors.reraNumber)} placeholder="e.g. P02400012345" data-error={!!errors.reraNumber} />
              <p className="text-[11px] text-gray-400 mt-1">Alphanumeric, 6–30 chars (e.g. P02400012345)</p>
              <FieldError msg={errors.reraNumber} />
            </div>
            <div>
              <label className={lbl}>RERA Expiry <span className="text-red-400">*</span></label>
              <DatePickerField value={reraExpiry}
                onChange={v => { setReraExpiry(v); setErrors(p => ({ ...p, reraExpiry: '' })); }}
                error={errors.reraExpiry} />
              <FieldError msg={errors.reraExpiry} />
            </div>
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
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm resize-none outline-none transition-all bg-white text-gray-800 placeholder:text-gray-500
                  ${errors.address ? 'border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-400' : 'border-gray-300 focus:ring-2 focus:ring-teal-500/15 focus:border-teal-400'}`}
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
            <GoogleMapsLocationField
              value={mapsLink}
              onChange={setMapsLink}
              address={address}
              city={city}
            />

            <div className="col-span-2">
              <label className={lbl}>Nearby Highlights</label>
              <div className="flex flex-wrap gap-2">
                {nearbyOptions.map(n => (
                  <button key={n} type="button" onClick={() => toggleArr(nearbyHighlights, n, setNearbyHighlights)}
                    className={chip(nearbyHighlights.includes(n))}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
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
            <div>
              <label className={lbl}>Possession Date <span className="text-red-400">*</span></label>
              <DatePickerField value={possessionDate}
                onChange={v => { setPossessionDate(v); setErrors(p => ({ ...p, possessionDate: '' })); }}
                error={errors.possessionDate}
                minDate={new Date().toISOString().split('T')[0]}
                toYear={new Date().getFullYear() + 10} />
              <FieldError msg={errors.possessionDate} />
            </div>
            <div className="flex flex-col gap-3 justify-end pb-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={closingSoon} onChange={e => setClosingSoon(e.target.checked)} className="rounded accent-teal-500 w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Mark as "Closing Soon"</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="rounded accent-teal-500 w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Featured / Priority Push</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className={lbl}>Commission Structure</label>
              <div className="flex gap-2 mb-4">
                {(['flat', 'slab'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setCommissionType(t)}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all
                      ${commissionType === t ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}>
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
                    className={`w-32 px-3.5 py-2.5 rounded-xl border text-sm bg-white text-gray-800 outline-none transition-all
                      ${errors.flatPercent ? 'border-red-300 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:ring-2 focus:ring-teal-500/15 focus:border-teal-400'}`} />
                  <span className="text-sm text-gray-500 font-medium">%</span>
                  <FieldError msg={errors.flatPercent} />
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        {['Min Units', 'Max Units', 'Commission %'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slabRows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2.5"><input type="number" value={row.minUnits} onChange={e => { const r = [...slabRows]; r[i].minUnits = parseInt(e.target.value) || 0; setSlabRows(r); }} className={`w-20 ${ti}`} /></td>
                          <td className="px-3 py-2.5"><input type="number" value={row.maxUnits} onChange={e => { const r = [...slabRows]; r[i].maxUnits = parseInt(e.target.value) || 0; setSlabRows(r); }} className={`w-20 ${ti}`} /></td>
                          <td className="px-3 py-2.5"><input type="number" value={row.percent} min={0.01} step={0.01} onChange={e => { const r = [...slabRows]; r[i].percent = parseFloat(e.target.value) || 0; setSlabRows(r); setErrors(p => ({ ...p, slabRows: '' })); }} className={`w-20 ${ti}`} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" onClick={() => setSlabRows([...slabRows, { minUnits: 0, maxUnits: 0, percent: 0 }])}
                    className="w-full py-2.5 text-xs text-teal-500 hover:bg-teal-50/40 border-t border-gray-100 transition-colors font-medium">
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
        </div>

        {/* ── 4. Unit Configuration ────────────────────────────────────────── */}
        <div className={card}>
          <SectionHeading n={4} title="Unit Configuration" />
          <div className="border border-gray-100 rounded-xl overflow-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-gray-50">
                  {['BHK Type', 'Carpet (sqft)', 'Super Built-up', 'Floors', 'Units', 'Base Price (₹)', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unitConfigs.map((uc, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/40 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-600 text-xs">{uc.bhkType || (
                      <input value={uc.bhkType} onChange={e => { const c = [...unitConfigs]; c[i].bhkType = e.target.value; setUnitConfigs(c); }} className={`w-20 ${ti}`} placeholder="e.g. 3BHK" />
                    )}</td>
                    <td className="px-3 py-2.5"><input type="number" min={0} value={uc.carpetArea || ''} onChange={e => { const c = [...unitConfigs]; c[i].carpetArea = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className={`w-20 ${ti}`} /></td>
                    <td className="px-3 py-2.5"><input type="number" min={0} value={uc.superBuiltUp || ''} onChange={e => { const c = [...unitConfigs]; c[i].superBuiltUp = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className={`w-20 ${ti}`} /></td>
                    <td className="px-3 py-2.5"><input value={uc.floors} onChange={e => { const c = [...unitConfigs]; c[i].floors = e.target.value; setUnitConfigs(c); }} className={`w-24 ${ti}`} placeholder="1-15" /></td>
                    <td className="px-3 py-2.5"><input type="number" min={0} value={uc.count || ''} onChange={e => { const c = [...unitConfigs]; c[i].count = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className={`w-16 ${ti}`} /></td>
                    <td className="px-3 py-2.5"><input type="number" min={0} value={uc.basePrice || ''} onChange={e => { const c = [...unitConfigs]; c[i].basePrice = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className={`w-28 ${ti}`} /></td>
                    <td className="px-3 py-2.5">
                      <select value={uc.status} onChange={e => { const c = [...unitConfigs]; c[i].status = e.target.value; setUnitConfigs(c); }}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs text-gray-600 focus:outline-none focus:border-teal-400">
                        <option>Available</option><option>Coming Soon</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button"
              onClick={() => setUnitConfigs([...unitConfigs, { bhkType: '', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' }])}
              className="w-full py-2.5 text-xs text-teal-500 hover:bg-teal-50/40 border-t border-gray-100 transition-colors font-medium">
              + Add Row
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Configurations above auto-populate rows. Add extra rows for custom types.</p>
        </div>

        {/* ── 5. Amenities, Media & Documents ──────────────────────────────── */}
        <div className={card}>
          <SectionHeading n={5} title="Amenities, Media & Documents" />

          <div>
            <label className={lbl}>Amenities</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {amenityOptions.map(a => (
                <button key={a} type="button" onClick={() => toggleArr(amenities, a, setAmenities)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all
                    ${amenities.includes(a) ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {([
              { label: 'Project Brochure (PDF)', ref: brochureRef,   accept: '.pdf',         multiple: false, display: brochureFile   ? brochureFile.name : null },
              { label: 'RERA Certificate (PDF)', ref: reraCertRef,   accept: '.pdf',         multiple: false, display: reraCertFile   ? reraCertFile.name : null },
              { label: 'Floor Plans',            ref: floorPlansRef, accept: 'image/*,.pdf', multiple: true,  display: floorPlanFiles?.length ? `${floorPlanFiles.length} file${floorPlanFiles.length > 1 ? 's' : ''} selected` : null },
              { label: 'Project Images',         ref: imagesRef,     accept: 'image/*',      multiple: true,  display: imageFiles?.length     ? `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} selected`   : null },
            ] as const).map(({ label, ref, accept, multiple, display }) => (
              <div key={label}>
                <label className={lbl}>{label}</label>
                <div onClick={() => ref.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center text-xs cursor-pointer hover:border-teal-300 hover:bg-teal-50/20 flex flex-col items-center gap-2 transition-all">
                  <Upload size={15} className="text-gray-400" />
                  {display
                    ? <span className="text-gray-600 font-medium truncate max-w-full">{display}</span>
                    : <span className="text-gray-500">{multiple ? 'Click to select files' : 'Click to upload'}</span>}
                  <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
                    onChange={e => {
                      if      (ref === brochureRef)   setBrochureFile(e.target.files?.[0] || null);
                      else if (ref === reraCertRef)   setReraCertFile(e.target.files?.[0] || null);
                      else if (ref === floorPlansRef) setFloorPlanFiles(e.target.files);
                      else                            setImageFiles(e.target.files);
                    }} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className={lbl}>Project Video URL</label>
            <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              className={ic()} placeholder="YouTube or Vimeo link" />
          </div>

          <div>
            <label className={lbl}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 placeholder:text-gray-500 resize-none outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-400 transition-all"
              placeholder="Describe the project, its highlights, vision…" />
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-8 pt-1">
          <button type="button" onClick={() => navigate(`/builder/projects/${id}`)}
            className="px-5 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="px-9 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default EditProjectWizard;