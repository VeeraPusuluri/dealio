import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriProfiles, nriCountries } from '@/data/nriData';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AccountDeletionCard from '@/components/shared/AccountDeletionCard';

const NRIProfile = () => {
  const profile = nriProfiles[0];
  const [editing, setEditing] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-xl p-6 border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#F5A623' }}>
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">🇦🇪 {profile.city}, {profile.country} · {profile.email}</p>
            <p className="text-xs text-muted-foreground">{profile.phone}</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="ml-auto px-4 py-2 rounded-lg border text-sm font-medium" style={{ color: '#F5A623', borderColor: '#F5A623' }}>
            {editing ? 'Save' : 'Edit Profile'}
          </button>
        </div>

        {/* Details */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Country', value: `🇦🇪 ${profile.country}` },
              { label: 'City', value: profile.city },
              { label: 'Timezone', value: profile.timezone },
              { label: 'Currency', value: profile.currency },
              { label: 'Occupation', value: profile.occupation },
              { label: 'Employer', value: profile.employer },
              { label: 'Monthly Income', value: `AED ${profile.monthlyIncomeForeign.toLocaleString()}` },
              { label: 'NRE Bank', value: profile.nreAccountBank },
              { label: 'PAN', value: profile.panNumber },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-muted-foreground">{f.label}</p>
                {editing ? (
                  <input defaultValue={f.value} className="w-full px-3 py-1.5 rounded-lg border border-input bg-card text-sm mt-1" />
                ) : (
                  <p className="font-medium mt-0.5">{f.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Investment Preferences */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-4">Investment Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Preferred Cities</p><div className="flex gap-1 mt-1"><Badge variant="secondary">Hyderabad</Badge><Badge variant="secondary">Bengaluru</Badge></div></div>
            <div><p className="text-xs text-muted-foreground">BHK Preference</p><div className="flex gap-1 mt-1">{profile.interestedBHK.map(b => <Badge key={b} variant="secondary">{b}</Badge>)}</div></div>
            <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-medium mt-0.5">₹{(profile.budgetINR.min / 100000).toFixed(0)}L – ₹{(profile.budgetINR.max / 10000000).toFixed(1)}Cr</p></div>
            <div><p className="text-xs text-muted-foreground">Purpose</p><p className="font-medium mt-0.5">{profile.purpose}</p></div>
          </div>
        </div>

        {/* Assigned CP */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-3">Assigned CP</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#E87722' }}>R</div>
            <div>
              <p className="font-medium">{profile.assignedCPName}</p>
              <p className="text-xs text-muted-foreground">Platinum Tier · Hyderabad</p>
            </div>
            <a href="https://wa.me/919876543210" target="_blank" className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-green-500">
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-3">Notification Settings</h3>
          <div className="space-y-3">
            {[
              'WhatsApp alerts for new NRI-recommended projects',
              'Consultation reminders (1 day + 1 hour before)',
              'Payment due date reminders',
              'Loan status updates',
              'Exchange rate alerts (when INR moves >2%)',
              'Construction progress photos from builder',
            ].map((n, i) => (
              <label key={i} className="flex items-center justify-between py-2">
                <span className="text-sm">{n}</span>
                <input type="checkbox" defaultChecked={i < 4} className="rounded" />
              </label>
            ))}
          </div>
        </div>

        {editing && (
          <button onClick={() => { setEditing(false); toast.success('Profile updated!'); }}
            className="w-full py-3 rounded-lg text-white font-semibold" style={{ backgroundColor: '#F5A623' }}>
            Save Changes
          </button>
        )}

        <AccountDeletionCard />
      </div>
    </DashboardLayout>
  );
};

export default NRIProfile;
