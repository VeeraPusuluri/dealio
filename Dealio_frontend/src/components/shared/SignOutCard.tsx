import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

const SignOutCard = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const identity = user?.email || user?.phone;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <LogOut size={15} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-card-foreground">Sign Out</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {identity ? `Signed in as ${identity}` : 'End your session on this device'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all shrink-0"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default SignOutCard;
