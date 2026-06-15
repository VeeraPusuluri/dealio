import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore, roleLabels, roleColors } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';
import ProfilePicUploader from '@/components/shared/ProfilePicUploader';
import SignOutCard from '@/components/shared/SignOutCard';
import { User, Mail, Phone, Moon, Sun, Landmark } from 'lucide-react';

const BankSettings = () => {
  const authUser = useAuthStore((s) => s.user);
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const color = authUser ? roleColors[authUser.role] || '#2E5D8E' : '#2E5D8E';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 pb-8">

        {/* Profile header */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="h-16" style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }} />
          <div className="px-5 pb-5 -mt-7 flex items-end gap-4">
            <div className="border-4 border-card rounded-2xl flex-shrink-0" style={{ boxShadow: `0 4px 14px ${color}40` }}>
              <ProfilePicUploader size={56} showLabel={false} />
            </div>
            <div className="pb-0.5 flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-card-foreground truncate">{authUser?.name || 'Bank User'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                  {authUser ? roleLabels[authUser.role] : 'Bank'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <Landmark size={10} /> Lending partner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User size={14} style={{ color }} />
            <h3 className="text-[13px] font-semibold text-card-foreground">Account</h3>
          </div>
          <div className="space-y-2">
            {[
              { icon: User, label: 'Name', value: authUser?.name || '—' },
              { icon: Mail, label: 'Email', value: authUser?.email || '—' },
              { icon: Phone, label: 'Phone', value: authUser?.phone?.startsWith('google-') ? '—' : authUser?.phone || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <Icon size={13} className="text-muted-foreground" />
                  <span className="text-[13px] font-medium text-card-foreground">{label}</span>
                </div>
                <span className="text-[12px] text-muted-foreground truncate max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={15} style={{ color }} /> : <Sun size={15} style={{ color }} />}
              <div>
                <p className="text-[13px] font-semibold text-card-foreground">Dark Mode</p>
                <p className="text-[11px] text-muted-foreground">{isDark ? 'Dark theme is on' : 'Light theme is on'}</p>
              </div>
            </div>
            <button onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isDark ? 'bg-teal-600' : 'bg-muted border border-border'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <SignOutCard />
      </div>
    </DashboardLayout>
  );
};

export default BankSettings;
