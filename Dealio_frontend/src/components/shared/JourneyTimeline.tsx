import { CheckCircle, Circle, Clock } from 'lucide-react';

export interface TimelineStep {
  label: string;
  date?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  notes?: string;
  expandable?: boolean;
  details?: string;
}

interface JourneyTimelineProps {
  steps: TimelineStep[];
}

const JourneyTimeline = ({ steps }: JourneyTimelineProps) => {
  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4 pb-8 last:pb-0">
          <div className="flex flex-col items-center">
            {step.status === 'completed' && (
              <CheckCircle size={24} className="text-available flex-shrink-0" />
            )}
            {step.status === 'in-progress' && (
              <Clock size={24} className="text-booked animate-pulse-amber flex-shrink-0" />
            )}
            {step.status === 'upcoming' && (
              <Circle size={24} className="text-hold flex-shrink-0" />
            )}
            {index < steps.length - 1 && (
              <div className={`w-0.5 flex-1 mt-2 ${step.status === 'completed' ? 'bg-available' : 'bg-border'}`} />
            )}
          </div>
          <div className="flex-1 pb-2">
            <p className={`font-semibold text-sm ${step.status === 'upcoming' ? 'text-muted-foreground' : 'text-card-foreground'}`}>
              {step.label}
            </p>
            {step.date && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
            )}
            {step.notes && (
              <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-md p-2">{step.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JourneyTimeline;
