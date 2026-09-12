export const VALID_RANGES = ["7D", "30D", "90D", "12M"] as const;
export type ValidRange = (typeof VALID_RANGES)[number];

export function isValidRange(range: unknown): range is ValidRange {
  return typeof range === "string" && VALID_RANGES.includes(range as ValidRange);
}

export interface TimeRangeBounds {
  range: ValidRange;
  startDate: Date;
  endDate: Date;
  bucketKeys: string[];
}

export interface PipelineHistoryBucket {
  period: string;
  month: string;
  date: string;
  pipeline: number;
  revenue: number;
}

export interface BuyerAcquisitionBucket {
  period: string;
  month: string;
  date: string;
  discovered: number;
  qualified: number;
}

export interface OutreachTimelineBucket {
  period: string;
  month: string;
  date: string;
  sent: number;
  replied: number;
  bounced: number;
}

export interface AggregatedTimeseries {
  range: ValidRange;
  startDate: string;
  endDate: string;
  pipelineHistory: PipelineHistoryBucket[];
  buyerAcquisition: BuyerAcquisitionBucket[];
  outreachTimeline: OutreachTimelineBucket[];
  recordCount: {
    leads: number;
    opportunities: number;
    emailLogs: number;
  };
}

export function formatDateUTC(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatYearMonthUTC(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getTimeRangeBounds(range: ValidRange, referenceDate = new Date()): TimeRangeBounds {
  // Use UTC midnight for deterministic boundaries
  const endYear = referenceDate.getUTCFullYear();
  const endMonth = referenceDate.getUTCMonth();
  const endDay = referenceDate.getUTCDate();
  const endDate = new Date(Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999));

  let startDate: Date;
  const bucketKeys: string[] = [];

  if (range === "7D") {
    // 7 daily buckets ending today (6 days ago to today)
    startDate = new Date(Date.UTC(endYear, endMonth, endDay - 6, 0, 0, 0, 0));
    for (let i = 0; i < 7; i++) {
      const bDate = new Date(startDate.getTime() + i * 86400000);
      bucketKeys.push(formatDateUTC(bDate));
    }
  } else if (range === "30D") {
    // 30 daily buckets ending today (29 days ago to today)
    startDate = new Date(Date.UTC(endYear, endMonth, endDay - 29, 0, 0, 0, 0));
    for (let i = 0; i < 30; i++) {
      const bDate = new Date(startDate.getTime() + i * 86400000);
      bucketKeys.push(formatDateUTC(bDate));
    }
  } else if (range === "90D") {
    // 13 weekly buckets ending this week (12 weeks prior = 84 days + 6 = 90 days total)
    // 13 intervals of 7 days = 91 days
    startDate = new Date(Date.UTC(endYear, endMonth, endDay - (13 * 7 - 1), 0, 0, 0, 0));
    for (let i = 0; i < 13; i++) {
      const bDate = new Date(startDate.getTime() + i * 7 * 86400000);
      bucketKeys.push(formatDateUTC(bDate));
    }
  } else {
    // 12M: 12 monthly buckets ending with current month
    // Starting on the 1st of the month 11 months prior
    startDate = new Date(Date.UTC(endYear, endMonth - 11, 1, 0, 0, 0, 0));
    for (let i = 0; i < 12; i++) {
      const mDate = new Date(Date.UTC(endYear, endMonth - 11 + i, 1));
      bucketKeys.push(formatYearMonthUTC(mDate));
    }
  }

  return {
    range,
    startDate,
    endDate,
    bucketKeys,
  };
}

export function findBucketKey(
  date: Date,
  range: ValidRange,
  bounds: TimeRangeBounds
): string | null {
  const time = date.getTime();
  if (time < bounds.startDate.getTime() || time > bounds.endDate.getTime()) {
    return null;
  }

  if (range === "7D" || range === "30D") {
    return formatDateUTC(date);
  }

  if (range === "90D") {
    const diffDays = Math.floor((time - bounds.startDate.getTime()) / (86400000 * 7));
    const index = Math.min(Math.max(diffDays, 0), bounds.bucketKeys.length - 1);
    return bounds.bucketKeys[index] || null;
  }

  // 12M
  return formatYearMonthUTC(date);
}

export function aggregateTimeseriesData({
  range,
  bounds,
  leads,
  opportunities,
  emailLogs,
}: {
  range: ValidRange;
  bounds: TimeRangeBounds;
  leads: Array<{ createdAt: Date; leadScore: number }>;
  opportunities: Array<{ createdAt: Date; inquiryValue: number | null | { toNumber?: () => number }; stage: string }>;
  emailLogs: Array<{ sentAt: Date; status: string }>;
}): AggregatedTimeseries {
  // Pre-initialize empty buckets with 0 to prevent gaps in charts
  const pipelineMap = new Map<string, PipelineHistoryBucket>();
  const leadMap = new Map<string, BuyerAcquisitionBucket>();
  const outreachMap = new Map<string, OutreachTimelineBucket>();

  for (const key of bounds.bucketKeys) {
    pipelineMap.set(key, {
      period: key,
      month: key,
      date: key,
      pipeline: 0,
      revenue: 0,
    });
    leadMap.set(key, {
      period: key,
      month: key,
      date: key,
      discovered: 0,
      qualified: 0,
    });
    outreachMap.set(key, {
      period: key,
      month: key,
      date: key,
      sent: 0,
      replied: 0,
      bounced: 0,
    });
  }

  // Aggregate opportunities (only those within range)
  for (const opp of opportunities) {
    const key = findBucketKey(new Date(opp.createdAt), range, bounds);
    if (!key) continue;

    const bucket = pipelineMap.get(key);
    if (!bucket) continue;

    const val = Number(opp.inquiryValue || 0);
    if (opp.stage === "CLOSED_WON") {
      bucket.revenue += val;
    } else if (opp.stage !== "CLOSED_LOST") {
      bucket.pipeline += val;
    }
  }

  // Aggregate buyer leads
  for (const lead of leads) {
    const key = findBucketKey(new Date(lead.createdAt), range, bounds);
    if (!key) continue;

    const bucket = leadMap.get(key);
    if (!bucket) continue;

    bucket.discovered += 1;
    if (lead.leadScore >= 80) {
      bucket.qualified += 1;
    }
  }

  // Aggregate email logs
  for (const email of emailLogs) {
    const key = findBucketKey(new Date(email.sentAt), range, bounds);
    if (!key) continue;

    const bucket = outreachMap.get(key);
    if (!bucket) continue;

    if (email.status === "SENT") {
      bucket.sent += 1;
    } else if (email.status === "REPLIED") {
      bucket.replied += 1;
    } else if (email.status === "BOUNCED") {
      bucket.bounced += 1;
    }
  }

  return {
    range,
    startDate: bounds.startDate.toISOString(),
    endDate: bounds.endDate.toISOString(),
    pipelineHistory: Array.from(pipelineMap.values()),
    buyerAcquisition: Array.from(leadMap.values()),
    outreachTimeline: Array.from(outreachMap.values()),
    recordCount: {
      leads: leads.length,
      opportunities: opportunities.length,
      emailLogs: emailLogs.length,
    },
  };
}
