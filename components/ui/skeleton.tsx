import { cn } from '@/lib/api/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800',
        className,
      )}
      {...props}
    />
  );
}

function SkeletonTable({
  rows = 3,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonTable };
