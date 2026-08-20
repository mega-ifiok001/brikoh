/**
 * Typed service functions — one per endpoint group in the API contract.
 * All consumption goes through these; no local fallbacks.
 */

import { api } from "./client";
import type {
  AuthResponse, RegisterRequest, LoginRequest, RefreshRequest,
  VerifyRequest, VerifyResponse, AcceptInviteRequest, AccountUser,
  OnboardingRequest, OnboardingResponse,
  Product, ProductListResponse, CreateProductRequest, UpdateProductRequest,
  StockAdjustmentRequest, StockAdjustmentResponse,
  PresignRequest, PresignResponse,
  StaffMember, StaffListResponse, UpdateStaffRequest,
  InviteRequest, Invite, InviteListResponse,
  PaymentProviderSettings, UpdatePaymentProviderRequest, SettlementsResponse,
  BankAccount, BankAccountsResponse, CreateBankAccountRequest,
  SubscriptionUsage, SubscriptionPlan, SetCustomDomainRequest,
  Location, CreateLocationRequest,
  Branch, BranchesResponse, CreateBranchRequest, UpdateBranchRequest,
  BranchTransferRequest, BranchTransferResponse,
  Category, CategoriesResponse, CreateCategoryRequest, UpdateCategoryRequest,
  Unit, UnitsResponse, CreateUnitRequest, UpdateUnitRequest,
  Campaign, CampaignsResponse, CreateCampaignRequest, UpdateCampaignRequest,
  CustomerGroup, CustomerGroupsResponse, CustomerGroupDetail,
  CreateGroupRequest, UpdateGroupRequest,
  Customer, CustomersResponse, CustomerDetail,
  CreateCustomerRequest, UpdateCustomerRequest,
  RepaymentRequest, RepaymentResponse,
  ActivityListResponse,
  AnalyticsSummary, AnalyticsTimeseries, AnalyticsTrends, StaffPerformance,
  AnalyticsGranularity, AnalyticsChannels,
  CampaignStats,
  Discount, DiscountsResponse, CreateDiscountRequest, UpdateDiscountRequest,
  Expense, ExpensesResponse, CreateExpenseRequest, UpdateExpenseRequest,
  InvoiceListResponse, InvoiceDetail, CreateInvoiceRequest,
  UpdateInvoiceRequest, InvoicePaymentRequest, InvoicePaymentResponse,
  CustomerImportResponse,
  NotificationsResponse, TestNotificationResponse,
  OrderListResponse, OrderDetail, PosSaleRequest, PosSaleResponse,
  OverviewResponse,
  BusinessSettings, NotificationSettings, StorefrontSettings,
  ChangePasswordRequest, TwoFactorState, TwoFactorSetup,
  PnLReport, ExpenseCategoryReport, InventoryValuation,
  Supplier, SuppliersResponse, CreateSupplierRequest, UpdateSupplierRequest,
  PurchaseOrderListResponse, PurchaseOrderDetail, CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest, ReceivePurchaseOrderRequest,
  PurchaseOrderPaymentRequest, PurchaseOrderPaymentResponse,
  TemplateCatalogResponse, TemplateCatalogItem, TemplateCustomizationRequest,
  WalletOverview, WithdrawalRequest, WithdrawalItem, WithdrawalsResponse,
  BulkImportPreview, BulkImportPreviewRow, BulkImportConfirm, BulkImportResult,
  CheckoutInitRequest, CheckoutInitResponse, HealthResponse,
  GoogleAuthRequest, PublicStorefrontData,
  AdminLoginRequest, AdminSession, AdminMe, Admin2faRotate,
  AdminStoreSearchResponse, AdminStoreDetail, AdminSignups, AdminActivation,
  AdminSubscriptions, AdminChurn, AdminPricingResponse, AdminPricingUpdate,
  AdminAuditResponse, AdminAnomaly, AdminOrphanedOrders, AdminFlaggedContent,
} from "./types";

/* ------------------------- /api/public/health ------------------------- */
export const health = () => api.get<HealthResponse>("/api/public/health");

/* ------------------------------ auth --------------------------------- */
export const authService = {
  register: (body: RegisterRequest) => api.post<AuthResponse>("/api/public/auth/register", body),
  login: (body: LoginRequest) => api.post<AuthResponse>("/api/public/auth/login", body),
  refresh: (body: RefreshRequest) => api.post<{ accessToken: string; refreshToken: string }>("/api/public/auth/refresh", body),
  logout: (refreshToken: string) => api.post<null>("/api/public/auth/logout", { refreshToken }),
  verify: (body: VerifyRequest) => api.post<VerifyResponse>("/api/public/auth/verify", body),
  acceptInvite: (body: AcceptInviteRequest) => api.post<AuthResponse>("/api/public/auth/accept-invite", body),
  google: (body: GoogleAuthRequest) => api.post<AuthResponse>("/api/public/auth/google", body),
};

/* ------------------------------ dashboard ----------------------------- */
export const dashboardService = {
  me: () => api.get<AccountUser>("/api/dashboard/me", { auth: true }),
  onboarding: (body: OnboardingRequest) => api.post<OnboardingResponse>("/api/dashboard/onboarding", body, { auth: true }),
  resendVerification: () => api.post<{ sent: boolean }>("/api/dashboard/resend-verification", undefined, { auth: true }),
};

/* ------------------------------ products ------------------------------ */
export const productsService = {
  list: (limit = 50, cursor?: string) => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    return api.get<ProductListResponse>(`/api/dashboard/products?${qs.toString()}`, { auth: true });
  },
  get: (id: string) => api.get<Product>(`/api/dashboard/products/${id}`, { auth: true }),
  create: (body: CreateProductRequest) => api.post<Product>("/api/dashboard/products", body, { auth: true }),
  update: (id: string, body: UpdateProductRequest) =>
    api.patch<Product>(`/api/dashboard/products/${id}`, body, { auth: true }),
  del: (id: string) => api.del<null>(`/api/dashboard/products/${id}`, { auth: true }),
  stockAdjustments: (productId: string, body: StockAdjustmentRequest) =>
    api.post<StockAdjustmentResponse>(`/api/dashboard/products/${productId}/stock-adjustments`, body, { auth: true }),
};

/* ------------------------------ uploads ------------------------------- */
export const uploadsService = {
  presignProductImage: (body: PresignRequest) =>
    api.post<PresignResponse>("/api/dashboard/uploads/presign-product-image", body, { auth: true }),
};

/* ------------------------------- staff -------------------------------- */
export const staffService = {
  list: () => api.get<StaffListResponse>("/api/dashboard/staff", { auth: true }),
  update: (staffId: string, body: UpdateStaffRequest) =>
    api.patch<StaffMember>(`/api/dashboard/staff/${staffId}`, body, { auth: true }),
  remove: (staffId: string) => api.del<null>(`/api/dashboard/staff/${staffId}`, { auth: true }),
  invites: () => api.get<InviteListResponse>("/api/dashboard/staff/invites", { auth: true }),
  invite: (body: InviteRequest) => api.post<Invite>("/api/dashboard/staff/invites", body, { auth: true }),
  revokeInvite: (inviteId: string) => api.del<null>(`/api/dashboard/staff/invites/${inviteId}`, { auth: true }),
};

/* ------------------------------ payments ------------------------------ */
export const paymentsService = {
  getProvider: () => api.get<PaymentProviderSettings>("/api/dashboard/payments/provider", { auth: true }),
  updateProvider: (body: UpdatePaymentProviderRequest) =>
    api.put<PaymentProviderSettings>("/api/dashboard/payments/provider", body, { auth: true }),
  settlements: () => api.get<SettlementsResponse>("/api/dashboard/payments/settlements", { auth: true }),
};

/* --------------------------- wallet / bank ---------------------------- */
export const bankAccountsService = {
  list: () => api.get<BankAccountsResponse>("/api/dashboard/wallet/bank-accounts", { auth: true }),
  create: (body: CreateBankAccountRequest) =>
    api.post<{ bankAccount: BankAccount }>("/api/dashboard/wallet/bank-accounts", body, { auth: true }),
  del: (bankAccountId: string) =>
    api.del<null>(`/api/dashboard/wallet/bank-accounts/${bankAccountId}`, { auth: true }),
};

/* ---------------------------- subscription ---------------------------- */
export const subscriptionService = {
  usage: () => api.get<SubscriptionUsage>("/api/dashboard/subscriptions/usage", { auth: true }),
  plan: () => api.get<SubscriptionPlan>("/api/dashboard/subscriptions/plan", { auth: true }),
  setCustomDomain: (body: SetCustomDomainRequest) =>
    api.put<{ customDomain: string }>("/api/dashboard/subscriptions/custom-domain", body, { auth: true }),
};

/* ------------------------------ locations ----------------------------- */
export const locationsService = {
  list: () => api.get<Location[]>("/api/dashboard/locations", { auth: true }),
  create: (body: CreateLocationRequest) => api.post<Location>("/api/dashboard/locations", body, { auth: true }),
};

/* ------------------------------ branches ------------------------------ */
export const branchesService = {
  list: () => api.get<BranchesResponse>("/api/dashboard/branches", { auth: true }),
  get: (branchId: string) => api.get<Branch>(`/api/dashboard/branches/${branchId}`, { auth: true }),
  create: (body: CreateBranchRequest) => api.post<Branch>("/api/dashboard/branches", body, { auth: true }),
  update: (branchId: string, body: UpdateBranchRequest) =>
    api.patch<Branch>(`/api/dashboard/branches/${branchId}`, body, { auth: true }),
  makeDefault: (branchId: string) => api.put<Branch>(`/api/dashboard/branches/${branchId}/default`, undefined, { auth: true }),
  del: (branchId: string) => api.del<{ id: string }>(`/api/dashboard/branches/${branchId}`, { auth: true }),
  transfer: (body: BranchTransferRequest) =>
    api.post<BranchTransferResponse>("/api/dashboard/branches/transfers", body, { auth: true }),
};

/* ------------------------------ catalog ------------------------------- */
export const catalogService = {
  categories: {
    list: () => api.get<CategoriesResponse>("/api/dashboard/categories", { auth: true }),
    get: (id: string) => api.get<Category>(`/api/dashboard/categories/${id}`, { auth: true }),
    create: (body: CreateCategoryRequest) => api.post<Category>("/api/dashboard/categories", body, { auth: true }),
    update: (id: string, body: UpdateCategoryRequest) =>
      api.patch<Category>(`/api/dashboard/categories/${id}`, body, { auth: true }),
    del: (id: string) => api.del<null>(`/api/dashboard/categories/${id}`, { auth: true }),
  },
  units: {
    list: () => api.get<UnitsResponse>("/api/dashboard/units", { auth: true }),
    get: (id: string) => api.get<Unit>(`/api/dashboard/units/${id}`, { auth: true }),
    create: (body: CreateUnitRequest) => api.post<Unit>("/api/dashboard/units", body, { auth: true }),
    update: (id: string, body: UpdateUnitRequest) =>
      api.patch<Unit>(`/api/dashboard/units/${id}`, body, { auth: true }),
    del: (id: string) => api.del<null>(`/api/dashboard/units/${id}`, { auth: true }),
  },
};

/* ------------------------------ campaigns ----------------------------- */
export const campaignsService = {
  list: (params?: { isActive?: boolean; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.isActive != null) sp.set("isActive", String(params.isActive));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<CampaignsResponse>(`/api/dashboard/campaigns${qs ? `?${qs}` : ""}`, { auth: true });
  },
  get: (id: string) => api.get<Campaign>(`/api/dashboard/campaigns/${id}`, { auth: true }),
  create: (body: CreateCampaignRequest) => api.post<Campaign>("/api/dashboard/campaigns", body, { auth: true }),
  update: (id: string, body: UpdateCampaignRequest) =>
    api.put<Campaign>(`/api/dashboard/campaigns/${id}`, body, { auth: true }),
  del: (id: string) => api.del<{ ok: boolean }>(`/api/dashboard/campaigns/${id}`, { auth: true }),
  stats: () => api.get<CampaignStats>("/api/dashboard/campaigns/stats", { auth: true }),
};

/* ------------------------------ discounts ----------------------------- */
export const discountsService = {
  list: (params?: { isActive?: boolean; type?: string; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.isActive != null) sp.set("isActive", String(params.isActive));
    if (params?.type) sp.set("type", params.type);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<DiscountsResponse>(`/api/dashboard/discounts${qs ? `?${qs}` : ""}`, { auth: true });
  },
  get: (id: string) => api.get<Discount>(`/api/dashboard/discounts/${id}`, { auth: true }),
  create: (body: CreateDiscountRequest) => api.post<Discount>("/api/dashboard/discounts", body, { auth: true }),
  update: (id: string, body: UpdateDiscountRequest) =>
    api.put<Discount>(`/api/dashboard/discounts/${id}`, body, { auth: true }),
  del: (id: string) => api.del<{ ok: boolean }>(`/api/dashboard/discounts/${id}`, { auth: true }),
};

/* ------------------------------- expenses ----------------------------- */
export const expensesService = {
  list: (params?: { category?: string; from?: string; to?: string; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.category) sp.set("category", params.category);
    if (params?.from) sp.set("from", params.from);
    if (params?.to) sp.set("to", params.to);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<ExpensesResponse>(`/api/dashboard/expenses${qs ? `?${qs}` : ""}`, { auth: true });
  },
  create: (body: CreateExpenseRequest) => api.post<{ expense: Expense }>("/api/dashboard/expenses", body, { auth: true }),
  update: (id: string, body: UpdateExpenseRequest) =>
    api.put<{ expense: Expense }>(`/api/dashboard/expenses/${id}`, body, { auth: true }),
  del: (id: string) => api.del<null>(`/api/dashboard/expenses/${id}`, { auth: true }),
};

/* ------------------------------- invoices ----------------------------- */
export const invoicesService = {
  list: (params?: { status?: string; q?: string; customerId?: string; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.q) sp.set("q", params.q);
    if (params?.customerId) sp.set("customerId", params.customerId);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<InvoiceListResponse>(`/api/dashboard/invoices${qs ? `?${qs}` : ""}`, { auth: true });
  },
  get: (id: string) => api.get<InvoiceDetail>(`/api/dashboard/invoices/${id}`, { auth: true }),
  create: (body: CreateInvoiceRequest) => api.post<InvoiceDetail>(`/api/dashboard/invoices`, body, { auth: true }),
  update: (id: string, body: UpdateInvoiceRequest) =>
    api.put<InvoiceDetail>(`/api/dashboard/invoices/${id}`, body, { auth: true }),
  del: (id: string) => api.del<{ ok: boolean }>(`/api/dashboard/invoices/${id}`, { auth: true }),
  issue: (id: string) => api.post<InvoiceDetail>(`/api/dashboard/invoices/${id}/issue`, {}, { auth: true }),
  void: (id: string) => api.post<InvoiceDetail>(`/api/dashboard/invoices/${id}/void`, {}, { auth: true }),
  pay: (id: string, body: InvoicePaymentRequest) =>
    api.post<InvoicePaymentResponse>(`/api/dashboard/invoices/${id}/payments`, body, { auth: true }),
};

/* --------------------------- customer groups -------------------------- */
export const customerGroupsService = {
  list: () => api.get<CustomerGroupsResponse>("/api/dashboard/customer-groups", { auth: true }),
  get: (id: string) => api.get<CustomerGroupDetail>(`/api/dashboard/customer-groups/${id}`, { auth: true }),
  create: (body: CreateGroupRequest) => api.post<CustomerGroup>("/api/dashboard/customer-groups", body, { auth: true }),
  update: (id: string, body: UpdateGroupRequest) =>
    api.put<CustomerGroup>(`/api/dashboard/customer-groups/${id}`, body, { auth: true }),
  del: (id: string) => api.del<{ ok: boolean }>(`/api/dashboard/customer-groups/${id}`, { auth: true }),
};

/* ------------------------------ customers ----------------------------- */
export const customersService = {
  list: (params?: { q?: string; hasOutstandingCredit?: boolean; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.hasOutstandingCredit != null) sp.set("hasOutstandingCredit", String(params.hasOutstandingCredit));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<CustomersResponse>(`/api/dashboard/customers${qs ? `?${qs}` : ""}`, { auth: true });
  },
  get: (id: string) => api.get<CustomerDetail>(`/api/dashboard/customers/${id}`, { auth: true }),
  create: (body: CreateCustomerRequest) => api.post<Customer>("/api/dashboard/customers", body, { auth: true }),
  update: (id: string, body: UpdateCustomerRequest) =>
    api.put<Customer>(`/api/dashboard/customers/${id}`, body, { auth: true }),
  del: (id: string) => api.del<{ ok: boolean }>(`/api/dashboard/customers/${id}`, { auth: true }),
  repay: (customerId: string, body: RepaymentRequest) =>
    api.post<RepaymentResponse>(`/api/dashboard/customers/${customerId}/credits/repayments`, body, { auth: true }),
  /** CSV export — downloads the full address book. */
  exportCsv: async () => {
    const token = (await import("./config")).getAccessToken();
    const base = (await import("./config")).getApiBaseUrl();
    const res = await fetch(`${base}/api/dashboard/customers/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try { const b = await res.json(); msg = b?.error?.message ?? msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  },
  /** Atomic CSV import — raw CSV body. */
  importCsv: async (csv: string) => {
    const token = (await import("./config")).getAccessToken();
    const base = (await import("./config")).getApiBaseUrl();
    const res = await fetch(`${base}/api/dashboard/customers/import`, {
      method: "POST",
      headers: {
        "Content-Type": "text/csv",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: csv,
    });
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!res.ok) {
      const err = body?.error;
      throw new Error(err?.message ?? `Import failed (${res.status})`);
    }
    return body as CustomerImportResponse;
  },
};

/* ------------------------------- activity ----------------------------- */
export const activityService = {
  list: (params?: { limit?: number; cursor?: string; staffMemberId?: string; start?: string; end?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    if (params?.staffMemberId) sp.set("staffMemberId", params.staffMemberId);
    if (params?.start) sp.set("start", params.start);
    if (params?.end) sp.set("end", params.end);
    const qs = sp.toString();
    return api.get<ActivityListResponse>(`/api/dashboard/activity${qs ? `?${qs}` : ""}`, { auth: true });
  },
};

/* ----------------------------- analytics ------------------------------ */
export const analyticsService = {
  summary: (start: string, end: string, top = 5) =>
    api.get<AnalyticsSummary>(`/api/dashboard/analytics/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&top=${top}`, { auth: true }),
  timeseries: (start: string, end: string, granularity: AnalyticsGranularity = "daily") =>
    api.get<AnalyticsTimeseries>(`/api/dashboard/analytics/timeseries?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&granularity=${granularity}`, { auth: true }),
  trends: (start: string, end: string, granularity: AnalyticsGranularity = "daily") =>
    api.get<AnalyticsTrends>(`/api/dashboard/analytics/trends?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&granularity=${granularity}`, { auth: true }),
  staffPerformance: (start: string, end: string) =>
    api.get<StaffPerformance>(`/api/dashboard/analytics/staff-performance?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { auth: true }),
  channels: (start: string, end: string) =>
    api.get<AnalyticsChannels>(`/api/dashboard/analytics/channels?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { auth: true }),
};

/** UTC ISO-8601 [start, end) for the last N days (≤366). */
export function utcRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/* --------------------------- public storefront ------------------------ */
export const publicService = {
  storefront: (subdomain: string) => api.get<PublicStorefrontData>(`/api/public/storefront/${subdomain}`),
  checkout: (subdomain: string, body: CheckoutInitRequest) =>
    api.post<CheckoutInitResponse>(`/api/public/checkout/${subdomain}`, body),
};

/* ------------------------------- admin -------------------------------- */
export const adminService = {
  login: (body: AdminLoginRequest) => api.post<AdminSession>("/api/admin/auth/login", body),
  rotate2fa: () => api.post<Admin2faRotate>("/api/admin/auth/2fa/rotate", {}, { admin: true }),
  me: () => api.get<AdminMe>("/api/admin/me", { admin: true }),
  stores: (params?: { q?: string; tier?: string; subscriptionStatus?: string; cursor?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.tier) sp.set("tier", params.tier);
    if (params?.subscriptionStatus) sp.set("subscriptionStatus", params.subscriptionStatus);
    if (params?.cursor) sp.set("cursor", params.cursor);
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return api.get<AdminStoreSearchResponse>(`/api/admin/stores/search${qs ? `?${qs}` : ""}`, { admin: true });
  },
  store: (storeId: string) => api.get<AdminStoreDetail>(`/api/admin/stores/${storeId}`, { admin: true }),
  signups: (start: string, end: string, granularity: "daily" | "weekly" = "daily") =>
    api.get<AdminSignups>(`/api/admin/health/signups?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&granularity=${granularity}`, { admin: true }),
  activation: (start: string, end: string) =>
    api.get<AdminActivation>(`/api/admin/health/activation?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { admin: true }),
  subscriptions: () => api.get<AdminSubscriptions>("/api/admin/health/subscriptions", { admin: true }),
  churn: (start: string, end: string) =>
    api.get<AdminChurn>(`/api/admin/health/churn?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { admin: true }),
  pricing: () => api.get<AdminPricingResponse>("/api/admin/billing/pricing", { admin: true }),
  updatePricing: (plan: string, monthlyPrice: number | null) =>
    api.put<AdminPricingUpdate>(`/api/admin/billing/pricing/${plan}`, { monthlyPrice }, { admin: true }),
  auditLog: (params?: { adminId?: string; storeId?: string; action?: string; start?: string; end?: string; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.adminId) sp.set("adminId", params.adminId);
    if (params?.storeId) sp.set("storeId", params.storeId);
    if (params?.action) sp.set("action", params.action);
    if (params?.start) sp.set("start", params.start);
    if (params?.end) sp.set("end", params.end);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<AdminAuditResponse>(`/api/admin/audit-log${qs ? `?${qs}` : ""}`, { admin: true });
  },
  reprocessWebhook: (eventId: string) =>
    api.post<{ outcome: string }>(`/api/admin/webhook-events/${eventId}/reprocess`, {}, { admin: true }),
  ledgerAnomalies: () => api.get<{ items: AdminAnomaly[] }>("/api/admin/integrity/ledger-anomalies", { admin: true }),
  orphanedOrders: (hours = 24) =>
    api.get<AdminOrphanedOrders>(`/api/admin/integrity/orphaned-orders?hours=${hours}`, { admin: true }),
  flaggedContent: () => api.get<AdminFlaggedContent>("/api/admin/moderation/flagged-content", { admin: true }),
};

/* --------------------------- notifications --------------------------- */
export const notificationsService = {
  list: (params?: { limit?: number; cursor?: string; kind?: string }) => {
    const sp = new URLSearchParams();
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    if (params?.kind) sp.set("kind", params.kind);
    const qs = sp.toString();
    return api.get<NotificationsResponse>(`/api/dashboard/notifications${qs ? `?${qs}` : ""}`, { auth: true });
  },
  test: () => api.post<TestNotificationResponse>("/api/dashboard/notifications/test", {}, { auth: true }),
};

/* ------------------------------- orders ------------------------------- */
export const ordersService = {
  list: (params?: { status?: string; paymentMethod?: string; source?: string; start?: string; end?: string; q?: string; customerId?: string; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.paymentMethod) sp.set("paymentMethod", params.paymentMethod);
    if (params?.source) sp.set("source", params.source);
    if (params?.start) sp.set("start", params.start);
    if (params?.end) sp.set("end", params.end);
    if (params?.q) sp.set("q", params.q);
    if (params?.customerId) sp.set("customerId", params.customerId);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<OrderListResponse>(`/api/dashboard/orders${qs ? `?${qs}` : ""}`, { auth: true });
  },
  get: (id: string) => api.get<OrderDetail>(`/api/dashboard/orders/${id}`, { auth: true }),
  posSale: (body: PosSaleRequest) => api.post<PosSaleResponse>("/api/dashboard/orders", body, { auth: true }),
};

/* ------------------------------- overview ------------------------------ */
export const overviewService = {
  get: () => api.get<OverviewResponse>("/api/dashboard/overview", { auth: true }),
};

/* ------------------------------- settings ------------------------------ */
export const settingsService = {
  business: {
    get: () => api.get<BusinessSettings>("/api/dashboard/settings/business", { auth: true }),
    update: (body: BusinessSettings) => api.put<BusinessSettings>("/api/dashboard/settings/business", body, { auth: true }),
  },
  notifications: {
    get: () => api.get<NotificationSettings>("/api/dashboard/settings/notifications", { auth: true }),
    update: (body: Partial<NotificationSettings>) => api.put<NotificationSettings>("/api/dashboard/settings/notifications", body, { auth: true }),
  },
  storefront: {
    get: () => api.get<StorefrontSettings>("/api/dashboard/settings/storefront", { auth: true }),
    update: (body: Partial<StorefrontSettings>) => api.put<StorefrontSettings>("/api/dashboard/settings/storefront", body, { auth: true }),
  },
  password: (body: ChangePasswordRequest) => api.post<{ ok: boolean }>("/api/dashboard/settings/password", body, { auth: true }),
  twoFactor: {
    state: () => api.get<TwoFactorState>("/api/dashboard/settings/2fa", { auth: true }),
    setup: () => api.post<TwoFactorSetup>("/api/dashboard/settings/2fa/setup", {}, { auth: true }),
    enable: (code: string) => api.post<{ enabled: boolean }>("/api/dashboard/settings/2fa/enable", { code }, { auth: true }),
    disable: (code: string) => api.post<{ enabled: boolean }>("/api/dashboard/settings/2fa/disable", { code }, { auth: true }),
  },
  deleteAccount: () => api.del<{ ok: boolean }>("/api/dashboard/account", { auth: true }),
};

/* ------------------------------- reports ------------------------------- */
export const reportsService = {
  pnl: (period: string = "week") => api.get<PnLReport>(`/api/dashboard/reports/pnl?period=${period}`, { auth: true }),
  expensesByCategory: (period: string = "week") => api.get<ExpenseCategoryReport>(`/api/dashboard/reports/expenses-by-category?period=${period}`, { auth: true }),
  inventoryValuation: () => api.get<InventoryValuation>("/api/dashboard/reports/inventory-valuation", { auth: true }),
};

/* ------------------------------- suppliers ----------------------------- */
export const suppliersService = {
  list: () => api.get<SuppliersResponse>("/api/dashboard/suppliers", { auth: true }),
  get: (id: string) => api.get<Supplier>(`/api/dashboard/suppliers/${id}`, { auth: true }),
  create: (body: CreateSupplierRequest) => api.post<Supplier>("/api/dashboard/suppliers", body, { auth: true }),
  update: (id: string, body: UpdateSupplierRequest) =>
    api.put<Supplier>(`/api/dashboard/suppliers/${id}`, body, { auth: true }),
  del: (id: string) => api.del<null>(`/api/dashboard/suppliers/${id}`, { auth: true }),
};

/* ---------------------------- purchase orders -------------------------- */
export const purchaseOrdersService = {
  list: (params?: { status?: string; supplierId?: string; limit?: number; cursor?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.supplierId) sp.set("supplierId", params.supplierId);
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.cursor) sp.set("cursor", params.cursor);
    const qs = sp.toString();
    return api.get<PurchaseOrderListResponse>(`/api/dashboard/purchase-orders${qs ? `?${qs}` : ""}`, { auth: true });
  },
  get: (id: string) => api.get<PurchaseOrderDetail>(`/api/dashboard/purchase-orders/${id}`, { auth: true }),
  create: (body: CreatePurchaseOrderRequest) => api.post<PurchaseOrderDetail>("/api/dashboard/purchase-orders", body, { auth: true }),
  update: (id: string, body: UpdatePurchaseOrderRequest) =>
    api.put<PurchaseOrderDetail>(`/api/dashboard/purchase-orders/${id}`, body, { auth: true }),
  del: (id: string) => api.del<null>(`/api/dashboard/purchase-orders/${id}`, { auth: true }),
  issue: (id: string) => api.post<PurchaseOrderDetail>(`/api/dashboard/purchase-orders/${id}/issue`, {}, { auth: true }),
  receive: (id: string, body: ReceivePurchaseOrderRequest) =>
    api.post<PurchaseOrderDetail>(`/api/dashboard/purchase-orders/${id}/receive`, body, { auth: true }),
  pay: (id: string, body: PurchaseOrderPaymentRequest) =>
    api.post<PurchaseOrderPaymentResponse>(`/api/dashboard/purchase-orders/${id}/payments`, body, { auth: true }),
  cancel: (id: string) => api.post<PurchaseOrderDetail>(`/api/dashboard/purchase-orders/${id}/cancel`, {}, { auth: true }),
};

/* ------------------------------- templates ------------------------------ */
export const templatesService = {
  catalog: () => api.get<TemplateCatalogResponse>("/api/dashboard/templates", { auth: true }),
  select: (templateId: string) => api.put<{ template: TemplateCatalogItem }>("/api/dashboard/templates", { templateId }, { auth: true }),
  customize: (body: TemplateCustomizationRequest) =>
    api.put<{ settings: TemplateCustomizationRequest }>("/api/dashboard/templates/customization", body, { auth: true }),
};

/* -------------------------------- wallet ------------------------------- */
export const walletService = {
  overview: () => api.get<WalletOverview>("/api/dashboard/wallet", { auth: true }),
  withdrawals: () => api.get<WithdrawalsResponse>("/api/dashboard/wallet/withdrawals", { auth: true }),
  withdraw: (body: WithdrawalRequest) => api.post<WithdrawalItem>("/api/dashboard/wallet/withdrawals", body, { auth: true }),
};

/* -------------------------- product publish/bulk ------------------------ */
export const productPublishService = {
  publish: (productId: string) => api.post<Product>(`/api/dashboard/products/${productId}/publish`, {}, { auth: true }),
  unpublish: (productId: string) => api.post<Product>(`/api/dashboard/products/${productId}/unpublish`, {}, { auth: true }),
  bulkImport: (rows: BulkImportPreviewRow[]) => api.post<BulkImportPreview>("/api/dashboard/products/bulk/import", { rows }, { auth: true }),
  bulkConfirm: (body: BulkImportConfirm) => api.post<BulkImportResult>("/api/dashboard/products/bulk/confirm", body, { auth: true }),
};
