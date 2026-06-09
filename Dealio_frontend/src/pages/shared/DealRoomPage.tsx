// ─── DealRoomPage — the unified per-deal stage+action+comms page ────────────────
//
// One route, three roles. Reachable at /builder/deals/:dealId, /cp/deals/:dealId,
// /customer/deals/:dealId. Fetches the deal with the role-appropriate API, maps it
// to the DealRoomDeal shape, and renders the shared <DealRoom> (stage stepper +
// role action card + visibility-scoped docs + live chat).

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DealRoom, { DealRoomDeal, DealRoomDoc } from '@/components/shared/DealRoom';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi, cpApi, portalApi } from '@/lib/api';
import { DealRole } from '@/lib/dealStages';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const ROLE_HOME: Record<DealRole, string> = {
  builder: '/builder/pipeline?tab=deals',
  cp: '/cp/pipeline',
  customer: '/customer/journey',
};

function mapDoc(d: Record<string, unknown>): DealRoomDoc {
  return {
    id: d.id as number,
    name: d.name as string,
    docType: d.docType as string,
    fileUrl: (d.fileUrl as string | null) ?? null,
    uploadedByRole: d.uploadedByRole as string | undefined,
    sharedWithCp: d.sharedWithCp as boolean | undefined,
    sharedWithCustomer: d.sharedWithCustomer as boolean | undefined,
    createdAt: d.createdAt as string | undefined,
  };
}

// Narrow the auth role to the three roles DealRoom supports.
function asDealRole(role?: string): DealRole | undefined {
  return role === 'builder' || role === 'cp' || role === 'customer' ? role : undefined;
}

export default function DealRoomPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { user } = useAuthStore();
  const role = asDealRole(user?.role);

  const [deal, setDeal] = useState<DealRoomDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!dealId || !role || !user) {
        setLoading(false);
        setError('This deal could not be found.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let mapped: DealRoomDeal | null = null;

        if (role === 'builder') {
          const builderId = builderApi.getCachedBuilderId();
          if (!builderId) throw new Error('Builder profile not loaded yet. Reopen from your deals list.');
          const d = (await builderApi.getDeal(builderId, dealId)) as Record<string, unknown>;
          mapped = {
            id: Number(d.id),
            projectName: (d.projectName as string) ?? 'Your Property',
            status: d.status as string,
            dealValue: d.dealValue as number | null,
            documents: ((d.dealDocuments as Record<string, unknown>[]) ?? []).map(mapDoc),
          };
        } else if (role === 'cp') {
          const d = (await cpApi.getCPDeal(user.id, dealId)) as Record<string, unknown>;
          mapped = {
            id: Number(d.id),
            projectName: (d.projectName as string) ?? 'Your Property',
            status: d.status as string,
            dealValue: d.dealValue as number | null,
            documents: ((d.dealDocuments as Record<string, unknown>[]) ?? []).map(mapDoc),
          };
        } else {
          // customer
          const deals = ((await portalApi.getMyDeals(user.phone ?? '')) as Record<string, unknown>[]) ?? [];
          const d = deals.find((x) => String(x.dealId) === String(dealId));
          if (d) {
            mapped = {
              id: Number(d.dealId),
              projectName: (d.projectName as string) ?? 'Your Property',
              unitType: d.unitType as string | undefined,
              status: d.dealStatus as string,
              dealValue: d.dealValue as number | null,
              documents: ((d.dealDocuments as Record<string, unknown>[]) ?? []).map(mapDoc),
            };
          }
        }

        if (cancelled) return;
        if (!mapped) setError('This deal could not be found.');
        setDeal(mapped);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || 'Could not load this deal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dealId, role, user]);

  const back = role ? ROLE_HOME[role] : '/';

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8 max-w-3xl mx-auto">
        <Link to={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft size={15} /> Back to deals
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={30} className="animate-spin text-teal-500" />
          </div>
        ) : error || !deal || !role ? (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertCircle size={28} className="text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-900">{error ?? 'Deal not found'}</h3>
            <p className="text-sm text-gray-500 mt-1">It may have moved, or you may not have access to it.</p>
          </div>
        ) : (
          <DealRoom deal={deal} role={role} />
        )}
      </div>
    </DashboardLayout>
  );
}
