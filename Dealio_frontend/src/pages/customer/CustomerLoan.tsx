import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { useLoanStore } from '@/stores/useLoanStore';
import { loanStatusColors, LoanStatus } from '@/data/loans';
import { formatCurrency, formatDate } from '@/lib/format';
import { CheckCircle, Clock, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const loanStages: LoanStatus[] = ['Applied', 'Documents Pending', 'Processing', 'Sanctioned', 'Disbursed'];

const CustomerLoan = () => {
  const { loans } = useLoanStore();
  const loan = loans.find(l => l.customerName === 'Rahul Singh') || loans[0];
  const [showFullEmi, setShowFullEmi] = useState(false);

  if (!loan) return <DashboardLayout><p className="text-gray-500 p-6">No loan data.</p></DashboardLayout>;

  const stageIndex = loanStages.indexOf(loan.status);
  const progressPct = ((stageIndex + 1) / loanStages.length) * 100;
  const rate = (loan.interestRate || 8.5) / 1200;
  const months = (loan.tenure || 20) * 12;
  const emi = loan.emi || Math.round(loan.loanAmount * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1));
  let outstanding = loan.loanAmount;
  const schedule = Array.from({ length: months }, (_, i) => {
    const interest = Math.round(outstanding * rate);
    const principal = emi - interest;
    outstanding -= principal;
    return { month: i + 1, emi, principal, interest, outstanding: Math.max(0, outstanding) };
  });
  const displaySchedule = showFullEmi ? schedule : schedule.slice(0, 6);
  const loanDates: Record<string, string> = {
    Applied: loan.appliedDate,
    'Documents Pending': loan.appliedDate ? new Date(new Date(loan.appliedDate).getTime() + 3 * 86400000).toISOString().split('T')[0] : '',
    Processing: loan.appliedDate ? new Date(new Date(loan.appliedDate).getTime() + 6 * 86400000).toISOString().split('T')[0] : '',
    Sanctioned: loan.sanctionedDate || '',
    Disbursed: loan.disbursedDate || '',
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">
        <div className="pt-1">
          <h1 className="text-xl font-bold text-gray-900">Home Loan</h1>
          <p className="text-sm text-gray-500">Track your loan status, EMI schedule and documents</p>
        </div>

        {/* Loan Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{loan.bank} Home Loan</h2>
              <p className="text-sm text-gray-500">{loan.projectName} — {loan.unitType}</p>
            </div>
            <StatusBadge status={loan.status} color={loanStatusColors[loan.status]} size="md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div><p className="text-xs text-gray-400 mb-0.5">Loan Amount</p><p className="text-lg font-bold text-gray-900">{formatCurrency(loan.loanAmount)}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Interest Rate</p><p className="text-lg font-bold text-gray-900">{loan.interestRate || 8.5}%</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Tenure</p><p className="text-lg font-bold text-gray-900">{loan.tenure || 20} years</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Monthly EMI</p><p className="text-lg font-bold text-gray-900">{formatCurrency(emi)}</p></div>
          </div>
          <Progress value={progressPct} className="h-2 mb-2" />
          <div className="flex justify-between">
            {loanStages.map((s, i) => (
              <span key={s} className={`text-[10px] font-medium ${i <= stageIndex ? 'text-emerald-600' : 'text-gray-400'}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Loan Journey */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Loan Journey</h3>
          <div className="space-y-4">
            {loanStages.map((stage, i) => {
              const completed = i <= stageIndex;
              return (
                <div key={stage} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {completed ? <CheckCircle size={20} className="text-emerald-500" /> : <Clock size={20} className="text-gray-300" />}
                    {i < loanStages.length - 1 && <div className={`w-0.5 h-8 ${completed ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-1">
                    <p className={`text-sm font-semibold ${completed ? 'text-gray-900' : 'text-gray-400'}`}>{stage}</p>
                    {loanDates[stage] && <p className="text-xs text-gray-400">{formatDate(loanDates[stage])}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Document Checklist</h3>
          <div className="space-y-2">
            {loan.documents.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-sm text-gray-700">{d.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{d.uploaded ? '✅ Submitted' : '📤 Upload Required'}</span>
                  {!d.uploaded && <button className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-medium border border-emerald-100">Upload</button>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Progress value={(loan.documents.filter(d => d.uploaded).length / loan.documents.length) * 100} className="h-2" />
            <p className="text-xs text-gray-400 mt-1">{loan.documents.filter(d => d.uploaded).length} of {loan.documents.length} documents complete</p>
          </div>
        </div>

        {/* EMI Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">EMI Schedule</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium">Month</th>
                  <th className="px-4 py-2.5 font-medium text-right">EMI</th>
                  <th className="px-4 py-2.5 font-medium text-right">Principal</th>
                  <th className="px-4 py-2.5 font-medium text-right">Interest</th>
                  <th className="px-4 py-2.5 font-medium text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {displaySchedule.map(row => (
                  <tr key={row.month} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{row.month}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(row.emi)}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(row.principal)}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(row.interest)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(row.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setShowFullEmi(!showFullEmi)} className="mt-3 text-sm text-secondary flex items-center gap-1 hover:underline">
            {showFullEmi ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View Full Schedule ({months} months)</>}
          </button>
        </div>

        {/* Bank Contact */}
        {loan.officerName && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Bank Contact</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2E5D8E] flex items-center justify-center text-white font-bold shrink-0">{loan.officerName[0]}</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{loan.officerName}</p>
                <p className="text-sm text-gray-500">{loan.bank} · {loan.officerPhone}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}><Phone size={14} /> Call</button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2" style={{ backgroundColor: '#25D366' }}><MessageCircle size={14} /> WhatsApp</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerLoan;