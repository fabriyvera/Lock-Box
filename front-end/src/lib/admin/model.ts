export type AdminSummary = {
  completedOrders: number; serviceRevenueCents: number; pointCommissionCents: number;
  variableCostCents: number; contributionCents: number; testOrders: number;
};
export type PointReport = { id: string; name: string; active: boolean; completedOrders: number; commissionCents: number };
export type AdminState = {
  policy: { version: number; feeCents: number; pointCommissionCents: number; variableCostCents: number; payer: string };
  summary: AdminSummary;
  pointReport: PointReport[];
  monthlyReport: (AdminSummary & { month: string })[];
  orders: { id: string; status: string; isTest: boolean; buyer: string; seller: string; point: string; merchandiseCents: number; totalCents: number; serviceFeeCents: number; policyVersion: number | null; createdAt: string }[];
  profiles: { id: string; name: string; username: string; role: string; active: boolean }[];
  audit: { id: string; actorId: string; entity: string; targetId: string; active: boolean; at: string }[];
};
