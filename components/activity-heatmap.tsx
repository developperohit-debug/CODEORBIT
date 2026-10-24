'use client';

import { useState, useMemo } from 'react';

interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  activity: ActivityDay[];
  days: number; // 30, 90, or 365
}

/**
 * GitHub-style contribution heatmap.
 * Displays daily activity intensity over a configurable time window.
 */
export function ActivityHeatmap({ activity, days }: ActivityHeatmapProps) {
  const [hovered, setHovered] = useState<{ date: string; count: number } | null>(null);

  const { weeks, maxCount, totalCount, activeDays } = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of activity) {
      map.set(d.date, d.count);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from `days` ago, aligned to the start of a week (Sunday)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weekList: { date: string; count: number; future: boolean }[][] = [];
    const cursor = new Date(startDate);
    let mx = 0;
    let total = 0;
    let active = 0;

    while (cursor <= today) {
      const week: { date: string; count: number; future: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const isFuture = cursor > today;
        const count = isFuture ? 0 : (map.get(dateStr) || 0);
        week.push({ date: dateStr, count, future: isFuture });
        if (!isFuture) {
          if (count > mx) mx = count;
          total += count;
          if (count > 0) active++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      weekList.push(week);
    }

    return { weeks: weekList, maxCount: mx, totalCount: total, activeDays: active };
  }, [activity, days]);

  function intensity(count: number): number {
    if (count === 0) return 0;
    if (maxCount === 0) return 1;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  const intensityColors = [
    'bg-muted/40 border-border/30',
    'bg-primary/20 border-primary/20',
    'bg-primary/40 border-primary/30',
    'bg-primary/60 border-primary/40',
    'bg-primary/80 border-primary/50',
  ];

  const cellSize = days <= 30 ? 'h-4 w-4' : days <= 90 ? 'h-3 w-3' : 'h-2.5 w-2.5';
  const gap = days <= 30 ? 'gap-1.5' : days <= 90 ? 'gap-1' : 'gap-0.5';

  function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div>
      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          <div className={`flex ${gap}`}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-sm border ${cellSize} ${day.future ? 'border-transparent' : intensityColors[intensity(day.count)]} transition-colors hover:ring-1 hover:ring-primary/40`}
                    onMouseEnter={() => !day.future && setHovered({ date: day.date, count: day.count })}
                    onMouseLeave={() => setHovered(null)}
                    role="img"
                    aria-label={day.future ? '' : `${formatDateLabel(day.date)}: ${day.count} activities`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend + summary */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{hovered ? (
            <span className="font-medium text-foreground">
              {hovered.count > 0
                ? `${hovered.count} activit${hovered.count === 1 ? 'y' : 'ies'} on ${formatDateLabel(hovered.date)}`
                : `No activity on ${formatDateLabel(hovered.date)}`}
            </span>
          ) : (
            <span>{activeDays} active days · {totalCount} total activities</span>
          )}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Less</span>
          {intensityColors.map((color, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm border ${color}`} />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
