import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Home, MapPin, Landmark, Trees, Upload, Loader2 } from 'lucide-react';

const projectTypes = [
  { value: 'Apartment',  icon: Building2, label: 'Apartment' },
  { value: 'Villa',      icon: Home,      label: 'Villa' },
  { value: 'Plot',       icon: MapPin,    label: 'Plot' },
  { value: 'Commercial', icon: Landmark,  label: 'Commercial' },
  { value: 'Mixed Use',  icon: Trees,     label: 'Mixed Use' },
];

const bhkOptions      = ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Penthouse'];
const statusOptions   = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move'];
const cityOptions     = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
const nearbyOptions   = ['Metro Station', 'Airport', 'IT Park', 'Hospital', 'School', 'Mall', 'Highway'];
const amenityOptions  = [
  'Swimming Pool', 'Gym', 'Clubhouse', "Children's Play Area", 'Jogging Track', 'Tennis Court',
  'Basketball Court', 'Indoor Games', 'Party Hall', 'Co-working Space', 'EV Charging', 'Solar Power',
  'Rainwater Harvesting', '24hr Security', 'CCTV', 'Power Backup', 'Intercom', 'Vastu Compliant',
  'Gated Community', 'Visitor Parking', 'Landscaped Gardens', 'Senior Citizen Area',
];

interface UnitConfig {
  bhkType: string; carpetArea: number; superBuiltUp: number;
  floors: string; count: number; basePrice: number; status: string;
}

type Errors = Record<string, string>;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

const ic = (err?: string) =>
  `w-full px-3 py-2 rounded-lg border ${err ? 'border-destructive' : 'border-input'} bg-card text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all`;

const SectionHeading = ({ n, title }: { n: number; title: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
    <h3 className="font-bold text-card-foreground text-[15px]">{title}</h3>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const AddProjectWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ── Section 1: Identity ────────────────────────────────────────────────────
  const [projectName,   setProjectName]   = useState('');
  const [builderName,   setBuilderName]   = useState(user?.name || '');
  const [projectType,   setProjectType]   = useState('Apartment');
  const [configurations, setConfigurations] = useState<string[]>(['3BHK']);
  const [totalUnits,    setTotalUnits]    = useState<number>(0);
  const [towers,        setTowers]        = useState<number>(0);
  const [floorsPerTower, setFloorsPerTower] = useState<number>(0);
  const [projectStatus, setProjectStatus] = useState('Under Construction');
  const [reraNumber,    setReraNumber]    = useState('');
  const [reraExpiry,    setReraExpiry]    = useState('');
  const [description,   setDescription]  = useState('');

  // ── Section 2: Location ────────────────────────────────────────────────────
  const [address,         setAddress]         = useState('');
  const [city,            setCity]            = useState('Hyderabad');
  const [locality,        setLocality]        = useState('');
  const [pincode,         setPincode]         = useState('');
  const [landmark,        setLandmark]        = useState('');
  const [mapsLink,        setMapsLink]        = useState('');
  const [nearbyHighlights, setNearbyHighlights] = useState<string[]>([]);

  // ── Section 3: Pricing & Commission ───────────────────────────────────────
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
  const [cpIncentive,   setCpIncentive]  = useState('');
  const [possessionDate, setPossessionDate] = useState('');
  const [closingSoon,   setClosingSoon]  = useState(false);
  const [featured,      setFeatured]     = useState(false);

  // ── Section 4: Unit Configuration ─────────────────────────────────────────
  const [unitConfigs, setUnitConfigs] = useState<UnitConfig[]>([
    { bhkType: '3BHK', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' },
  ]);

  // ── Section 5: Media & Amenities ──────────────────────────────────────────
  const [amenities,      setAmenities]  = useState<string[]>(['Swimming Pool', 'Gym', 'Clubhouse']);
  const [videoUrl,       setVideoUrl]   = useState('');
  const brochureRef   = useRef<HTMLInputElement>(null);
  const reraCertRef   = useRef<HTMLInputElement>(null);
  const floorPlansRef = useRef<HTMLInputElement>(null);
  const imagesRef     = useRef<HTMLInputElement>(null);
  const [brochureFile,    setBrochureFile]    = useState<File | null>(null);
  const [reraCertFile,    setReraCertFile]    = useState<File | null>(null);
  const [floorPlanFiles,  setFloorPlanFiles]  = useState<FileList | null>(null);
  const [imageFiles,      setImageFiles]      = useState<FileList | null>(null);

  const [errors,    setErrors]    = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const toggleArr = (arr: string[], item: string, set: (a: string[]) => void) =>
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);

  const toBackendStatus = (s: string): string => {
    if (s === 'Pre-Launch') return 'PRE_LAUNCH';
    if (s === 'Launched')   return 'LAUNCHED';
    if (s === 'Under Construction') return 'UNDER_CONSTRUCTION';
    if (s === 'Ready to Move') return 'READY_TO_MOVE';
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
    if (!projectName.trim())          e.projectName   = 'Project name is required';
    if (!configurations.length)       e.configurations = 'Select at least one configuration';
    if (!totalUnits || totalUnits <= 0) e.totalUnits  = 'Total units is required';
    if (!reraNumber.trim())           e.reraNumber    = 'RERA number is required';
    if (!reraExpiry)                  e.reraExpiry    = 'RERA expiry date is required';
    if (!address.trim())              e.address       = 'Address is required';
    if (!locality.trim())             e.locality      = 'Locality is required';
    if (!pincode.trim())              e.pincode       = 'Pincode is required';
    else if (!/^\d{6}$/.test(pincode)) e.pincode     = 'Pincode must be 6 digits';
    if (!priceFrom || priceFrom <= 0) e.priceFrom     = 'Starting price is required';
    if (!priceTo   || priceTo   <= 0) e.priceTo       = 'Ending price is required';
    else if (priceTo < priceFrom)     e.priceTo       = 'Ending price must be ≥ starting price';
    if (!possessionDate)              e.possessionDate = 'Possession date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      // scroll to first error
      const el = document.querySelector('[data-error="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        city,
        locality,
        address,
        pincode,
        landmark:         landmark || undefined,
        googleMapsLink:   mapsLink || undefined,
        description:      description || undefined,
        status:           toBackendStatus(projectStatus),
        projectType:      projectType.toUpperCase().replace(/\s+/g, '_'),
        bhkTypes:         configurations,
        configurations,
        totalUnits:       totalUnits || undefined,
        towers:           towers     || undefined,
        floorsPerTower:   floorsPerTower || undefined,
        reraId:           reraNumber || undefined,
        reraNumber:       reraNumber || undefined,
        reraExpiry:       reraExpiry || undefined,
        amenities,
        nearbyHighlights: nearbyHighlights.length ? nearbyHighlights : undefined,
        possessionDate:   possessionDate || undefined,
        priceMin:         priceFrom || undefined,
        priceMax:         priceTo   || undefined,
        pricePerSqftMin:  pricePerSqftFrom || undefined,
        pricePerSqftMax:  pricePerSqftTo   || undefined,
        maintenanceCharges: maintenance  || undefined,
        floorRiseCharges:   floorRise    || undefined,
        commissionPercent:  commissionType === 'flat' ? flatPercent : undefined,
        cpIncentive:        cpIncentive || undefined,
        closingSoon,
        featured,
        videoUrl:    videoUrl    || undefined,
        builderName: builderName || undefined,
      };

      const created = await builderApi.createProject(builderId, payload) as { id?: number; projectId?: number };
      const projectId = created?.id ?? created?.projectId;

      // Upload all files after project creation
      if (projectId) {
        const uploads: Promise<void>[] = [];

        // Cover image (first selected image) + extra images as documents
        if (imageFiles?.length) {
          uploads.push(
            builderApi.uploadProjectImage(builderId, projectId, imageFiles[0])
              .then(coverUrl => builderApi.updateProject(builderId, projectId, { coverUrl }))
              .catch(() => { toast.warning('Cover image upload failed — you can add it later.'); })
          );
          for (let i = 1; i < imageFiles.length; i++) {
            uploads.push(
              builderApi.uploadDocument(builderId, projectId, imageFiles[i], 'Project Image').catch(() => {})
            );
          }
        }

        // Floor plans
        if (floorPlanFiles?.length) {
          for (let i = 0; i < floorPlanFiles.length; i++) {
            uploads.push(
              builderApi.uploadDocument(builderId, projectId, floorPlanFiles[i], 'Floor Plan').catch(() => {})
            );
          }
        }

        // Brochure
        if (brochureFile) {
          uploads.push(
            builderApi.uploadDocument(builderId, projectId, brochureFile, 'Brochure').catch(() => {})
          );
        }

        // RERA Certificate
        if (reraCertFile) {
          uploads.push(
            builderApi.uploadDocument(builderId, projectId, reraCertFile, 'RERA Certificate').catch(() => {})
          );
        }

        await Promise.all(uploads);
      }

      // Announce new project for city-preference notifications
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

      toast.success('Project created successfully!');
      navigate('/builder/projects');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => navigate('/builder/projects')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <div>
          <h2 className="text-xl font-bold text-card-foreground">Add New Project</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in all sections and submit to publish your project.</p>
        </div>

        {/* ── 1. Project Identity ─────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <SectionHeading n={1} title="Project Identity" />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Project Name <span className="text-destructive">*</span></label>
              <input value={projectName} onChange={e => { setProjectName(e.target.value); setErrors(p => ({ ...p, projectName: '' })); }}
                className={ic(errors.projectName)} placeholder="e.g. Prestige Skyline" data-error={!!errors.projectName} />
              <FieldError msg={errors.projectName} />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Developer / Builder Name</label>
              <input value={builderName} onChange={e => setBuilderName(e.target.value)} className={ic()} />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                placeholder="Describe the project, its highlights, vision…" />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Project Type <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-5 gap-2">
                {projectTypes.map(t => (
                  <button key={t.value} type="button" onClick={() => setProjectType(t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs font-medium transition-all ${projectType === t.value ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground hover:bg-muted'}`}>
                    <t.icon size={20} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Configurations <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2">
                {bhkOptions.map(b => (
                  <button key={b} type="button"
                    onClick={() => { syncUnitConfigs(configurations.includes(b) ? configurations.filter(x => x !== b) : [...configurations, b]); setErrors(p => ({ ...p, configurations: '' })); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${configurations.includes(b) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground hover:bg-muted'}`}>{b}</button>
                ))}
              </div>
              <FieldError msg={errors.configurations} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Total Units <span className="text-destructive">*</span></label>
              <input type="number" min={0} value={totalUnits || ''} onChange={e => { setTotalUnits(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, totalUnits: '' })); }}
                className={ic(errors.totalUnits)} data-error={!!errors.totalUnits} />
              <FieldError msg={errors.totalUnits} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Number of Towers</label>
              <input type="number" min={0} value={towers || ''} onChange={e => setTowers(parseInt(e.target.value) || 0)} className={ic()} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Floors per Tower</label>
              <input type="number" min={0} value={floorsPerTower || ''} onChange={e => setFloorsPerTower(parseInt(e.target.value) || 0)} className={ic()} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Project Status <span className="text-destructive">*</span></label>
              <select value={projectStatus} onChange={e => setProjectStatus(e.target.value)} className={ic()}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">RERA Number <span className="text-destructive">*</span></label>
              <input value={reraNumber} onChange={e => { setReraNumber(e.target.value); setErrors(p => ({ ...p, reraNumber: '' })); }}
                className={ic(errors.reraNumber)} placeholder="e.g. P02400012345" data-error={!!errors.reraNumber} />
              <FieldError msg={errors.reraNumber} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">RERA Expiry <span className="text-destructive">*</span></label>
              <input type="date" value={reraExpiry} onChange={e => { setReraExpiry(e.target.value); setErrors(p => ({ ...p, reraExpiry: '' })); }}
                className={ic(errors.reraExpiry)} data-error={!!errors.reraExpiry} />
              <FieldError msg={errors.reraExpiry} />
            </div>
          </div>
        </div>

        {/* ── 2. Location ─────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <SectionHeading n={2} title="Location" />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Full Address <span className="text-destructive">*</span></label>
              <textarea value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
                className={`w-full px-3 py-2 rounded-lg border ${errors.address ? 'border-destructive' : 'border-input'} bg-card text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30`}
                data-error={!!errors.address} />
              <FieldError msg={errors.address} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">City <span className="text-destructive">*</span></label>
              <select value={city} onChange={e => setCity(e.target.value)} className={ic()}>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Locality / Area <span className="text-destructive">*</span></label>
              <input value={locality} onChange={e => { setLocality(e.target.value); setErrors(p => ({ ...p, locality: '' })); }}
                className={ic(errors.locality)} placeholder="e.g. Gachibowli" data-error={!!errors.locality} />
              <FieldError msg={errors.locality} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Pincode <span className="text-destructive">*</span></label>
              <input value={pincode} maxLength={6} onChange={e => { setPincode(e.target.value); setErrors(p => ({ ...p, pincode: '' })); }}
                className={ic(errors.pincode)} data-error={!!errors.pincode} />
              <FieldError msg={errors.pincode} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Landmark</label>
              <input value={landmark} onChange={e => setLandmark(e.target.value)} className={ic()} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Google Maps Link</label>
              <input type="url" value={mapsLink} onChange={e => setMapsLink(e.target.value)} className={ic()} placeholder="https://maps.google.com/..." />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Nearby Highlights</label>
              <div className="flex flex-wrap gap-2">
                {nearbyOptions.map(n => (
                  <button key={n} type="button" onClick={() => toggleArr(nearbyHighlights, n, setNearbyHighlights)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${nearbyHighlights.includes(n) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground hover:bg-muted'}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Pricing & Commission ──────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <SectionHeading n={3} title="Pricing & Commission" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Price From (₹) <span className="text-destructive">*</span></label>
              <input type="number" min={0} value={priceFrom || ''} onChange={e => { setPriceFrom(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, priceFrom: '' })); }}
                className={ic(errors.priceFrom)} placeholder="e.g. 8500000" data-error={!!errors.priceFrom} />
              <FieldError msg={errors.priceFrom} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Price To (₹) <span className="text-destructive">*</span></label>
              <input type="number" min={0} value={priceTo || ''} onChange={e => { setPriceTo(parseInt(e.target.value) || 0); setErrors(p => ({ ...p, priceTo: '' })); }}
                className={ic(errors.priceTo)} data-error={!!errors.priceTo} />
              <FieldError msg={errors.priceTo} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">₹/sqft From</label>
              <input type="number" min={0} value={pricePerSqftFrom || ''} onChange={e => setPricePerSqftFrom(parseInt(e.target.value) || 0)} className={ic()} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">₹/sqft To</label>
              <input type="number" min={0} value={pricePerSqftTo || ''} onChange={e => setPricePerSqftTo(parseInt(e.target.value) || 0)} className={ic()} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Maintenance (₹/sqft/month)</label>
              <input type="number" min={0} value={maintenance || ''} onChange={e => setMaintenance(parseInt(e.target.value) || 0)} className={ic()} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Floor Rise (₹/floor)</label>
              <input type="number" min={0} value={floorRise || ''} onChange={e => setFloorRise(parseInt(e.target.value) || 0)} className={ic()} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Possession Date <span className="text-destructive">*</span></label>
              <input type="date" value={possessionDate} onChange={e => { setPossessionDate(e.target.value); setErrors(p => ({ ...p, possessionDate: '' })); }}
                className={ic(errors.possessionDate)} data-error={!!errors.possessionDate} />
              <FieldError msg={errors.possessionDate} />
            </div>
            <div className="space-y-3 flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={closingSoon} onChange={e => setClosingSoon(e.target.checked)} className="rounded accent-secondary" />
                <span className="text-sm text-foreground">Mark as "Closing Soon"</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="rounded accent-secondary" />
                <span className="text-sm text-foreground">Featured / Priority Push</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Commission Structure</label>
              <div className="flex gap-3 mb-3">
                {(['flat', 'slab'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setCommissionType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${commissionType === t ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground hover:bg-muted'}`}>
                    {t === 'flat' ? 'Flat %' : 'Slab-based'}
                  </button>
                ))}
              </div>
              {commissionType === 'flat' ? (
                <div className="flex items-center gap-3">
                  <input type="number" value={flatPercent} step={0.25} onChange={e => setFlatPercent(parseFloat(e.target.value) || 0)}
                    className="w-32 px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted">
                      {['Min Units', 'Max Units', 'Commission %'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {slabRows.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2"><input type="number" value={row.minUnits} onChange={e => { const r = [...slabRows]; r[i].minUnits = parseInt(e.target.value) || 0; setSlabRows(r); }} className="w-20 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                          <td className="px-3 py-2"><input type="number" value={row.maxUnits} onChange={e => { const r = [...slabRows]; r[i].maxUnits = parseInt(e.target.value) || 0; setSlabRows(r); }} className="w-20 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                          <td className="px-3 py-2"><input type="number" value={row.percent} step={0.25} onChange={e => { const r = [...slabRows]; r[i].percent = parseFloat(e.target.value) || 0; setSlabRows(r); }} className="w-20 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" onClick={() => setSlabRows([...slabRows, { minUnits: 0, maxUnits: 0, percent: 0 }])}
                    className="w-full py-2 text-xs text-secondary hover:bg-muted border-t border-border transition-colors">+ Add Row</button>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">CP Incentive / Bonus</label>
              <input value={cpIncentive} onChange={e => setCpIncentive(e.target.value)} className={ic()} placeholder="e.g. Extra 0.25% for deals closed before Mar 31" />
            </div>
          </div>
        </div>

        {/* ── 4. Unit Configuration ────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6">
          <SectionHeading n={4} title="Unit Configuration" />
          <div className="border border-border rounded-lg overflow-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-muted">
                  {['BHK Type', 'Carpet (sqft)', 'Super Built-up', 'Floors', 'Units', 'Base Price (₹)', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unitConfigs.map((uc, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-card-foreground">{uc.bhkType || (
                      <input value={uc.bhkType} onChange={e => { const c = [...unitConfigs]; c[i].bhkType = e.target.value; setUnitConfigs(c); }} className="w-20 px-2 py-1 rounded border border-input bg-card text-sm" placeholder="e.g. 3BHK" />
                    )}</td>
                    <td className="px-3 py-2"><input type="number" min={0} value={uc.carpetArea || ''} onChange={e => { const c = [...unitConfigs]; c[i].carpetArea = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className="w-20 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={uc.superBuiltUp || ''} onChange={e => { const c = [...unitConfigs]; c[i].superBuiltUp = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className="w-20 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                    <td className="px-3 py-2"><input value={uc.floors} onChange={e => { const c = [...unitConfigs]; c[i].floors = e.target.value; setUnitConfigs(c); }} className="w-24 px-2 py-1 rounded border border-input bg-card text-sm" placeholder="1-15" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={uc.count || ''} onChange={e => { const c = [...unitConfigs]; c[i].count = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className="w-16 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={uc.basePrice || ''} onChange={e => { const c = [...unitConfigs]; c[i].basePrice = parseInt(e.target.value) || 0; setUnitConfigs(c); }} className="w-28 px-2 py-1 rounded border border-input bg-card text-sm" /></td>
                    <td className="px-3 py-2">
                      <select value={uc.status} onChange={e => { const c = [...unitConfigs]; c[i].status = e.target.value; setUnitConfigs(c); }} className="px-2 py-1 rounded border border-input bg-card text-xs">
                        <option>Available</option><option>Coming Soon</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={() => setUnitConfigs([...unitConfigs, { bhkType: '', carpetArea: 0, superBuiltUp: 0, floors: '', count: 0, basePrice: 0, status: 'Available' }])}
              className="w-full py-2 text-xs text-secondary hover:bg-muted border-t border-border transition-colors">+ Add Row</button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Selecting configurations above auto-populates rows. Add extra rows for custom types.</p>
        </div>

        {/* ── 5. Amenities, Media & Documents ─────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <SectionHeading n={5} title="Amenities, Media & Documents" />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Amenities</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {amenityOptions.map(a => (
                <button key={a} type="button" onClick={() => toggleArr(amenities, a, setAmenities)}
                  className={`px-2 py-1.5 rounded text-xs font-medium border text-left transition-colors ${amenities.includes(a) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground hover:bg-muted'}`}>{a}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {([
              { label: 'Project Brochure (PDF)', ref: brochureRef,   accept: '.pdf',         multiple: false,
                display: brochureFile ? brochureFile.name : null },
              { label: 'RERA Certificate (PDF)', ref: reraCertRef,   accept: '.pdf',         multiple: false,
                display: reraCertFile ? reraCertFile.name : null },
              { label: 'Floor Plans',            ref: floorPlansRef, accept: 'image/*,.pdf', multiple: true,
                display: floorPlanFiles?.length ? `${floorPlanFiles.length} file${floorPlanFiles.length > 1 ? 's' : ''} selected` : null },
              { label: 'Project Images',         ref: imagesRef,     accept: 'image/*',      multiple: true,
                display: imageFiles?.length ? `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} selected` : null },
            ] as const).map(({ label, ref, accept, multiple, display }) => (
              <div key={label}>
                <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
                <div onClick={() => ref.current?.click()}
                  className="border-2 border-dashed border-input rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer hover:border-secondary/40 flex flex-col items-center gap-1.5 transition-colors">
                  <Upload size={16} />
                  {display
                    ? <span className="text-foreground font-medium truncate max-w-full">{display}</span>
                    : <span>{multiple ? 'Click to select files' : 'Click to upload'}</span>}
                  <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
                    onChange={e => {
                      if (ref === brochureRef)   setBrochureFile(e.target.files?.[0] || null);
                      else if (ref === reraCertRef)   setReraCertFile(e.target.files?.[0] || null);
                      else if (ref === floorPlansRef) setFloorPlanFiles(e.target.files);
                      else                            setImageFiles(e.target.files);
                    }} />
                </div>
              </div>
            ))}

            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground mb-1 block">Project Video URL</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className={ic()} placeholder="YouTube or Vimeo link" />
            </div>
          </div>
        </div>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-6">
          <button type="button" onClick={() => navigate('/builder/projects')} className="px-5 py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Project'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProjectWizard;