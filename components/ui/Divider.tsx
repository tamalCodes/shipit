type DividerProps = {
  label?: string;
};

export default function Divider({ label = "or" }: DividerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}
