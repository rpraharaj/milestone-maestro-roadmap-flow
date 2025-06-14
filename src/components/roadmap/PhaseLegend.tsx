
interface Phase {
  key: string;
  label: string;
  color: string;
}

export default function PhaseLegend({ phases }: { phases: Phase[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {phases.map(phase => (
        <div key={phase.key} className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded ${phase.color}`}></div>
          <span className="text-sm font-medium">{phase.label}</span>
        </div>
      ))}
    </div>
  );
}
