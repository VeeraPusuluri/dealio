import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Share2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  type: 'booking' | 'allotment' | 'commission';
  data: Record<string, string>;
}

const DocumentPreviewModal = ({ open, onClose, type, data }: DocumentPreviewModalProps) => {
  const titles: Record<string, string> = { booking: 'Booking Receipt', allotment: 'Allotment Letter', commission: 'Commission Certificate' };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{titles[type]}</DialogTitle></DialogHeader>
        <div className="border border-border rounded-lg p-6 bg-background space-y-4">
          <div className="text-center border-b border-border pb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center font-bold text-lg mb-2">CP</div>
            <h3 className="font-bold text-card-foreground">{titles[type]}</h3>
            <p className="text-xs text-muted-foreground">{data.refNo || `RCPT-2025-${Math.floor(1000 + Math.random() * 9000)}`}</p>
            <p className="text-xs text-muted-foreground">Date: {data.date || new Date().toLocaleDateString('en-IN')}</p>
          </div>

          {type === 'booking' && (
            <div className="space-y-2 text-sm">
              <Row label="Customer" value={data.customer} />
              <Row label="Project" value={data.project} />
              <Row label="Unit" value={data.unit} />
              <Row label="Booking Amount" value={data.bookingAmount} />
              <Row label="Total Sale Price" value={data.totalPrice} />
              <Row label="Builder" value={data.builder} />
              <Row label="CP" value={data.cp} />
              <Row label="Payment Mode" value={data.paymentMode || 'Online Transfer'} />
            </div>
          )}

          {type === 'allotment' && (
            <div className="space-y-2 text-sm">
              <Row label="Customer" value={data.customer} />
              <Row label="Project" value={data.project} />
              <Row label="Unit" value={`${data.tower || 'Tower A'}, Floor ${data.floor || '12'}, ${data.unit}`} />
              <Row label="Type" value={data.unitType} />
              <Row label="Area" value={`${data.sqft || '1850'} sqft`} />
              <Row label="Total Price" value={data.totalPrice} />
              <Row label="RERA No." value={data.rera || 'P02400012345'} />
              <Row label="Possession" value={data.possession || 'Sep 2025'} />
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-muted-foreground font-medium">Payment Schedule</p>
                <table className="w-full text-xs mt-1">
                  <tbody>
                    <tr className="border-b border-border"><td className="py-1">Booking</td><td className="text-right">10%</td></tr>
                    <tr className="border-b border-border"><td className="py-1">Foundation</td><td className="text-right">40%</td></tr>
                    <tr><td className="py-1">Possession</td><td className="text-right">50%</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {type === 'commission' && (
            <div className="space-y-2 text-sm">
              <Row label="CP Name" value={data.cpName} />
              <Row label="CP RERA" value={data.cpRera || 'A02400054321'} />
              <Row label="Project" value={data.project} />
              <Row label="Customer" value={data.customer} />
              <Row label="Sale Value" value={data.saleValue} />
              <Row label="Commission %" value={data.commissionPct} />
              <Row label="Gross Commission" value={data.grossComm} />
              <Row label="TDS (10%)" value={data.tds} />
              <Row label="Net Payable" value={data.netPayable} />
              <Row label="Payment Ref" value={data.paymentRef || `PAY-${Date.now().toString().slice(-6)}`} />
            </div>
          )}

          <div className="border-t border-border pt-4 text-center">
            <p className="text-[10px] text-muted-foreground">This is a system-generated document. Authorized signatory stamp area.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => toast.success('PDF downloaded')} className="flex-1 gap-2"><Download size={14} />Download PDF</Button>
          <Button variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${titles[type]} - ${data.customer || 'Customer'}`)}`, '_blank')} className="flex-1 gap-2">
            <Share2 size={14} />WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-card-foreground font-medium">{value || '—'}</span>
  </div>
);

export default DocumentPreviewModal;
