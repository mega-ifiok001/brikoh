/**
 * Contract types — matching the Oja/Brikoh API contracts exactly.
 * Money is ALWAYS a string (decimal). Timestamps UTC ISO-8601.
 * Tenant is `req.tenant.storeId`; admin uses a SEPARATE token type.
 */

/* ------------------------------ shared ------------------------------ */

export interface ApiErrorBody { error: { code: string; message: string }; }

export class ApiError extends Error {
  code: string; status: number;
  constructor(code: string, message: string, status = 400) {
    super(message); this.name = "ApiError"; this.code = code; this.status = status;
  }
}

export interface UtcRange { start: string; end: string; }
export interface CursorPage<T> { items: T[]; nextCursor: string | null; }

/* ------------------------------- auth ------------------------------- */

export type AccountRole = "OWNER" | "ADMIN" | "MANAGER" | "STAFF";

export interface AccountUser {
  accountId: string; email: string;
  firstName: string | null; lastName: string | null; phone: string | null;
  role: AccountRole | null; storeId: string | null; storeName: string | null;
  subdomain: string | null; needsOnboarding: boolean; verified: boolean;
  permissions: string[];
}

export interface AuthTokens { accessToken: string; refreshToken: string; }
export type AuthResponse = AuthTokens & { user: AccountUser };
export interface RegisterRequest { firstName: string; lastName: string; phone: string; email: string; password: string; confirmPassword: string; }
export interface LoginRequest { email: string; password: string; totpCode?: string; }
export interface RefreshRequest { refreshToken: string; }
export interface VerifyRequest { token: string; }
export interface VerifyResponse { verified: boolean; }
export interface AcceptInviteRequest { token: string; password: string; }
export interface GoogleAuthRequest { code: string; redirectUri: string; }

/* --------------------------- public storefront --------------------------- */
export interface PublicStorefrontData {
  name: string; subdomain: string; whatsapp: string | null; phone: string | null;
  city: string | null; country: string | null; currency: string;
  template: string | null; accentColor: string | null; tagline: string | null;
  heroTitle: string | null; heroSubtitle: string | null;
  announcementBar: { enabled: boolean; text: string } | null;
  socialLinks: { instagram: string | null; facebook: string | null; tiktok: string | null };
  ga4MeasurementId: string | null;
  products: { id: string; name: string; price: string; description: string | null; images: string[]; stock: number }[];
}

/* ----------------------------- withdrawals ----------------------------- */
export interface WithdrawalRequest { amount: string; bankAccountId: string; }
export interface WithdrawalItem { id: string; amount: string; fee: string; bankAccountId: string; status: string; requestedAt: string; completedAt: string | null; }
export interface WithdrawalsResponse { withdrawals: WithdrawalItem[]; }

/* ---------------------------- onboarding ---------------------------- */

export type BusinessType = "RETAIL" | "FOOD_AND_BEVERAGE" | "FASHION_AND_WEARABLES" | "HEALTH_AND_BEAUTY" | "ELECTRONICS" | "PROFESSIONAL_SERVICES" | "AGRICULTURE" | "OTHER";
export type Currency = "NGN" | "USD" | "GHS" | "KES" | "ZAR";

export interface OnboardingRequest {
  name: string; businessType: BusinessType; location: string;
  currency: Currency; businessPhone: string; templateId?: string;
}
export interface OnboardingResponse { user: AccountUser; }

/* ------------------------------ products ----------------------------- */

export interface Variant {
  id: string; name: string; sellingPrice: string | null; sku: string | null;
  quantity: number; createdAt: string; updatedAt: string;
}

export interface Product {
  id: string; storeId: string; name: string; sku: string | null;
  price: string; costPrice: string | null; description: string | null;
  images: string[]; coverImageUrl: string | null; discountPrice: string | null;
  lowStockThreshold: number | null; expiryDate: string | null;
  status: "DRAFT" | "PUBLISHED";
  categoryId: string | null; unitId: string | null;
  category: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
  quantity: number; deletedAt: string | null;
  variants: Variant[];
  salesCount?: number;
  createdAt: string; updatedAt: string;
}

export interface ProductListResponse extends CursorPage<Product> { total: number; }

export interface CreateProductRequest {
  name: string; sku?: string | null; price: number | string; costPrice?: number | string | null;
  description?: string | null; images?: string[]; coverImageUrl?: string | null;
  discountPrice?: number | string | null; lowStockThreshold?: number; expiryDate?: string;
  categoryId?: string | null; unitId?: string | null; initialStock?: number;
  variants?: { name: string; sellingPrice?: string; sku?: string; initialStock?: number }[];
}
export type UpdateProductRequest = Partial<Omit<CreateProductRequest, "initialStock" | "variants">>;

export type StockReason = "MANUAL_ADJUSTMENT" | "RESTOCK" | "REFUND" | "WRITE_OFF";

export interface StockAdjustmentRequest {
  branchId: string; quantityChange: number; reason: StockReason;
  variantId?: string; referenceId?: string;
}
export interface StockAdjustmentResponse {
  product: { id: string; name: string; quantity: number };
  variant: { id: string; name: string; quantity: number } | null;
  branchStockAfter: number;
  ledgerEntry: { id: string; variantId: string | null; quantityChange: number; reason: string; referenceId: string | null; performedByStaffId: string | null; createdAt: string };
}

export interface PresignRequest { fileName: string; contentType: "image/jpeg" | "image/png" | "image/webp"; declaredSizeBytes: number; }
export interface PresignResponse { uploadUrl: string; publicUrl: string; key: string; expiresInSeconds: number; }

/* ------------------------------- staff ------------------------------- */

export type StaffRole = "ADMIN" | "MANAGER" | "STAFF";
export interface StaffMember { id: string; email: string; role: StaffRole; permissions: string[]; isActive: boolean; createdAt: string; }
export interface StaffListResponse { items: StaffMember[]; }
export interface UpdateStaffRequest { role?: StaffRole; permissions?: string[]; isActive?: boolean; }
export interface InviteRequest { email: string; role: StaffRole; }
export interface Invite { id: string; email: string; role: StaffRole; status: "PENDING"; expiresAt: string; createdAt: string; expiresInSeconds?: number; }
export interface InviteListResponse { items: Invite[]; }

/* ------------------------------ payments ----------------------------- */

export interface PaymentProviderSettings { configured: boolean; provider: "paystack"; publicKey: string | null; secretKeyMasked: string | null; updatedAt: string | null; }
export interface UpdatePaymentProviderRequest { provider: "paystack"; publicKey: string; secretKey: string; }
export interface SettlementItem { orderId: string; reference: string; total: string; currency: string; transactionStatus: string; paidAt: string | null; settlement: { status: string; settledAt: string | null; detail: string }; }
export interface SettlementsResponse { settlements: SettlementItem[]; }

/* --------------------------- wallet / bank --------------------------- */

export interface BankAccount { id: string; accountName: string; bankName: string; bankCode: string; maskedAccountNumber: string; isDefault: boolean; createdAt: string; }
export interface BankAccountsResponse { bankAccounts: BankAccount[]; }
export interface CreateBankAccountRequest { accountName?: string; accountNumber: string; bankName: string; bankCode: string; isDefault?: boolean; }
export interface WalletOverview {
  wallet: { currency: string; available: string; pending: string; withdrawn: string; totalCredits: string };
  recentEntries: { id: string; type: "CREDIT" | "DEBIT"; source: string; amount: string; balanceAfter: string; orderId: string | null; payoutId: string | null; createdAt: string }[];
}

/* ----------------------------- subscription -------------------------- */

export type PlanTier = "STARTER" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | null;
export interface PlanLimits { staffCap: number | null; locationCap: number | null; productCap: number | null; orderCap: number | null; }
export interface PlanFeatureFlags { customDomain: boolean; advancedAnalytics: boolean; marketingTools: boolean; }
export interface SubscriptionPlan { tier: PlanTier; status: SubscriptionStatus; active: boolean; limits: PlanLimits; featureFlags: PlanFeatureFlags; }
export interface SubscriptionUsage { plan: SubscriptionPlan; usage: { staff: number; locations: number; products: number; orders: number }; period: { start: string; end: string }; customDomain: string | null; }
export interface SetCustomDomainRequest { customDomain: string; }

/* ------------------------------ locations ---------------------------- */

export interface Location { id: string; name: string; address: string; createdAt: string; }
export interface CreateLocationRequest { name: string; address: string; }

/* ------------------------------ branches ----------------------------- */

export interface Branch { id: string; storeId: string; name: string; address: string | null; isDefault: boolean; createdAt: string; updatedAt: string; }
export interface BranchesResponse { items: Branch[]; }
export interface CreateBranchRequest { name: string; address?: string | null; }
export type UpdateBranchRequest = Partial<CreateBranchRequest>;
export interface BranchTransferRequest { productId: string; variantId?: string; sourceBranchId: string; destinationBranchId: string; quantity: number; }
export interface BranchTransferResponse { productId: string; variantId: string | null; quantity: number; sourceBranch: { branchId: string; quantityChange: number; stockAfter: number }; destinationBranch: { branchId: string; quantityChange: number; stockAfter: number }; }

/* ------------------------------ catalog ------------------------------ */

export interface Category { id: string; storeId: string; name: string; description: string | null; createdAt: string; updatedAt: string; }
export interface CategoriesResponse { items: Category[]; }
export interface CreateCategoryRequest { name: string; description?: string | null; }
export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;
export interface Unit { id: string; storeId: string; name: string; symbol: string | null; createdAt: string; updatedAt: string; }
export interface UnitsResponse { items: Unit[]; }
export interface CreateUnitRequest { name: string; symbol?: string | null; }
export type UpdateUnitRequest = Partial<CreateUnitRequest>;

/* ------------------------------- orders ------------------------------- */

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "REFUNDED" | "FAILED";
export type OrderSource = "STOREFRONT" | "POS" | "DIRECT" | "SOCIAL" | "MARKETPLACE" | "REFERRAL";
export type PaymentMethod = "CASH" | "TRANSFER" | "CREDIT" | "CARD";

export interface OrderListItem {
  id: string; orderNumber: string; status: OrderStatus; paymentMethod: PaymentMethod; source: OrderSource;
  total: string; discountAmount: string; discountId: string | null;
  amountPaid: string; balanceDue: string; itemCount: number;
  customer: { id: string; name: string; phone: string | null };
  branch: { id: string; name: string };
  soldBy: { id: string; name: string } | null;
  createdAt: string;
}
export interface OrderListResponse extends CursorPage<OrderListItem> {}
export interface OrderLineItem { id: string; productId: string; productName: string; variantId: string | null; variantName: string | null; quantity: number; unitPriceAtPurchase: string; lineTotal: string; }
export interface OrderDetail {
  order: OrderListItem;
  repayments: { id: string; amount: string; note: string | null; recordedByName: string; createdAt: string }[];
  lineItems: OrderLineItem[];
}
export interface PosSaleRequest {
  items: { productId: string; variantId?: string; quantity: number }[];
  branchId?: string; customerId?: string; paymentMethod: PaymentMethod;
  discountId?: string; discountCode?: string; amountPaid?: string; email?: string;
}
export interface PosSaleResponse {
  order: { id: string; status: OrderStatus; total: string; discountAmount: string; discountId: string | null; amountPaid: string | null; balanceDue: string; paymentMethod: PaymentMethod; source: OrderSource; createdAt: string };
  payment: { provider: string; reference: string; redirectUrl: string } | null;
}

/* ------------------------------ overview ------------------------------ */

export interface OverviewResponse {
  kpis: { revenue?: string; orders: number; customers: number; avgOrderValue?: string };
  revenueTrend?: { start: string; end: string; totalSales: string; orderCount: number }[];
  topProducts?: { productId: string; name: string; units: number; revenue?: string }[];
  recentOrders: { id: string; status: string; paymentMethod: string; source: string; total: string; customerName: string; lineItemCount: number; createdAt: string }[];
  lowStock: { productId: string; name: string; branchId: string; branchName: string; quantity: number }[];
  expiringSoon: { productId: string; name: string; variantId: string | null; expiryDate: string; quantity: number }[];
  quickStats: { productCount: number; branchCount: number; pendingOrderCount: number; creditOwing: string };
}

/* ------------------------------ settings ------------------------------ */

export interface BusinessSettings { storeId: string; name: string; businessType: string; location: string; currency: string; businessPhone: string; }
export interface NotificationSettings { lowStockAlerts: boolean; paymentAlerts: boolean; expiringSoonAlerts: boolean; }
export interface StorefrontSettings {
  template: string; tagline: string | null; heroTitle: string | null; heroSubtitle: string | null;
  accentColor: string; whatsappButtonEnabled: boolean; whatsappNumber: string | null;
  showPoweredByBadge: boolean; ga4MeasurementId: string | null;
  socialLinks: { instagram: string | null; facebook: string | null; tiktok: string | null };
}
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; confirmPassword: string; }
export interface TwoFactorState { enabled: boolean; pending: boolean; }
export interface TwoFactorSetup { secret: string; otpauthUrl: string; }

/* ------------------------------ reports ------------------------------- */

export interface PnLReport { period: { key: string; start: string; end: string }; revenue: string; cogs: string; expenses: string; netProfit: string; cogsUnpricedLineItems: number; }
export interface ExpenseCategoryReport { period: { key: string; start: string; end: string }; categories: { category: string; count: number; total: string }[]; grandTotal: string; }
export interface InventoryValuation { generatedAt: string; items: { productId: string; sku: string | null; name: string; quantity: number; costPrice: string | null; price: string; valueAtCost: string; valueAtRetail: string }[]; totals: { atCost: string; atRetail: string }; unpricedProducts: number; }

/* --------------------------- notifications --------------------------- */

export interface AlertDispatch { id: string; kind: string; refType: string; refId: string; sentQuantity?: number; snapshot: Record<string, unknown>; sentAt: string; }
export interface NotificationsResponse { dispatches: AlertDispatch[]; nextCursor: string | null; }
export interface TestNotificationResponse { sent: boolean; to: string; }

/* ------------------------------ suppliers ------------------------------ */

export interface Supplier { id: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null; isActive: boolean; notes: string | null; purchaseOrderCount?: number; balanceDue?: string; createdAt: string; updatedAt: string; }
export interface SuppliersResponse { items: Supplier[]; }
export interface CreateSupplierRequest { name: string; contactName?: string; phone?: string; email?: string; address?: string; isActive?: boolean; notes?: string; }
export type UpdateSupplierRequest = CreateSupplierRequest;

/* ---------------------------- purchase orders -------------------------- */

export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
export interface PurchaseOrderListItem {
  id: string; number: string | null; status: PurchaseOrderStatus;
  total: string; amountPaid: string; balanceDue: string;
  expectedDeliveryDate: string | null; itemCount: number;
  supplier: { id: string; name: string }; branch: { id: string; name: string };
  createdAt: string; orderedAt: string | null;
}
export interface PurchaseOrderListResponse extends CursorPage<PurchaseOrderListItem> {}
export interface PurchaseOrderDetail {
  purchaseOrder: { id: string; number: string | null; status: PurchaseOrderStatus; total: string; amountPaid: string; balanceDue: string; notes: string | null; expectedDeliveryDate: string | null; supplier: { id: string; name: string }; branch: { id: string; name: string }; createdAt: string; orderedAt: string | null; receivedAt: string | null; cancelledAt: string | null };
  lineItems: { id: string; productId: string; productName: string; variantId: string | null; variantName: string | null; quantity: number; quantityReceived: number; remainingToReceive: number; unitCostAtOrder: string; lineTotal: string }[];
  receipts: { id: string; note: string | null; recordedByName: string; createdAt: string; lines: { productId: string; productName: string; variantId: string | null; variantName: string | null; quantityReceived: number; unitCostAtReceipt: string }[] }[];
  payments: { id: string; amount: string; note: string | null; recordedByName: string; createdAt: string }[];
}
export interface CreatePurchaseOrderRequest { supplierId: string; branchId: string; expectedDeliveryDate?: string | null; notes?: string; lineItems: { productId: string; variantId?: string; quantity: number; unitCostAtOrder: string }[]; }
export type UpdatePurchaseOrderRequest = Partial<CreatePurchaseOrderRequest>;
export interface ReceivePurchaseOrderRequest { note?: string; lineItems: { lineItemId: string; quantityReceived: number }[]; }
export interface PurchaseOrderPaymentRequest { amount: string; note?: string; }
export interface PurchaseOrderPaymentResponse { amount: string; allocated: string; balanceDue: string; }

/* ------------------------------ campaigns ----------------------------- */

export interface Campaign { id: string; name: string; startsAt: string | null; endsAt: string | null; bannerTitle: string | null; bannerSubtitle: string | null; ctaLabel: string | null; discountId: string | null; discountCode: string | null; isActive: boolean; createdAt: string; updatedAt: string; }
export interface CampaignsResponse extends CursorPage<Campaign> {}
export interface CreateCampaignRequest { name: string; startsAt?: string | null; endsAt?: string | null; bannerTitle?: string | null; bannerSubtitle?: string | null; ctaLabel?: string | null; discountId?: string | null; isActive?: boolean; }
export type UpdateCampaignRequest = Partial<CreateCampaignRequest>;
export interface CampaignStatRow { id: string; name: string; discountCode: string | null; redemptions: number; attributedOrders: number; attributedRevenue: string; }
export interface CampaignStats { totalCampaigns: number; activeCampaigns: number; activeCoupons: number; totalRedemptions: number; campaigns: CampaignStatRow[]; }

/* ------------------------------- discounts ---------------------------- */

export type DiscountType = "PERCENTAGE" | "FIXED";
export interface Discount { id: string; name: string; type: DiscountType; value: string; code: string | null; startsAt: string | null; endsAt: string | null; isActive: boolean; maxUses?: number | null; perCustomerUses?: number | null; minSubtotal?: string | null; firstOrderOnly?: boolean | null; createdAt: string; updatedAt: string; }
export interface DiscountsResponse extends CursorPage<Discount> {}
export interface CreateDiscountRequest { name: string; type: DiscountType; value: string; code?: string; startsAt?: string | null; endsAt?: string | null; isActive?: boolean; maxUses?: number; perCustomerUses?: number; minSubtotal?: string; firstOrderOnly?: boolean; }
export type UpdateDiscountRequest = Partial<CreateDiscountRequest> & { code?: string | null; maxUses?: number | null; minSubtotal?: string | null; };

/* -------------------------------- expenses ---------------------------- */

export type ExpenseCategory = "RENT" | "TRANSPORT" | "PACKAGING" | "SALARIES" | "MARKETING" | "UTILITIES" | "OTHER";
export interface Expense { id: string; category: ExpenseCategory; amount: string; description: string | null; date: string; createdAt: string; updatedAt: string; }
export interface ExpensesResponse { expenses: Expense[]; nextCursor: string | null; }
export interface CreateExpenseRequest { category: ExpenseCategory; amount: string; description?: string | null; date: string; }
export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

/* -------------------------------- invoices ---------------------------- */

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID";
export interface InvoiceListItem { id: string; number: string | null; status: InvoiceStatus; total: string; amountPaid: string; balanceDue: string; dueDate: string | null; itemCount: number; customer: { id: string; name: string; phone: string | null }; createdAt: string; issuedAt: string | null; }
export interface InvoiceListResponse extends CursorPage<InvoiceListItem> {}
export interface InvoicePaymentRow { id: string; amount: string; note: string | null; recordedByName: string; createdAt: string; }
export interface InvoiceLineItem { id: string; productId: string; productName: string; quantity: number; unitPriceAtIssue: string; lineTotal: string; }
export interface InvoiceDetail { invoice: InvoiceListItem; payments: InvoicePaymentRow[]; lineItems: InvoiceLineItem[]; }
export interface InvoiceLineInput { productId: string; quantity: number; unitPriceAtIssue: string; }
export interface CreateInvoiceRequest { customerId: string; dueDate?: string | null; lineItems: InvoiceLineInput[]; }
export type UpdateInvoiceRequest = { dueDate?: string | null; lineItems: InvoiceLineInput[] };
export interface InvoicePaymentRequest { amount: string; note?: string; }
export interface InvoicePaymentResponse { invoiceId: string; status: InvoiceStatus; allocated: string; balanceDue: string; totalOutstanding: string; }

/* --------------------------- customer groups ------------------------- */

export interface CustomerGroup { id: string; name: string; description: string | null; memberCount: number; discount: { id: string; name: string; type: string; value: string } | null; createdAt: string; updatedAt: string; }
export interface CustomerGroupsResponse { items: CustomerGroup[]; }
export interface CustomerGroupDetail { group: CustomerGroup; members: { id: string; name: string; phone: string | null; email: string | null; createdAt: string }[]; }
export interface CreateGroupRequest { name: string; description?: string | null; discountId?: string | null; }
export type UpdateGroupRequest = Partial<CreateGroupRequest>;

/* ------------------------------ customers ---------------------------- */

export type CustomerSource = "POS" | "MANUAL" | "STOREFRONT" | "IMPORTED";
export type CustomerSegment = "NEW" | "REGULAR" | "VIP";
export interface Customer {
  id: string; name: string; phone: string | null; email: string | null;
  group: { id: string; name: string } | null;
  source: CustomerSource; segment: CustomerSegment;
  ordersCount: number; totalSpent: string;
  openCredit: string; hasOutstandingCredit: boolean; createdAt: string;
}
export interface CustomersResponse extends CursorPage<Customer> {}
export interface CustomerDetail {
  customer: Customer;
  repayments: { id: string; orderId: string; amount: string; note: string | null; recordedByName: string; createdAt: string }[];
  recentOrders: { id: string; status: string; paymentMethod: string; source: string; total: string; amountPaid: string; balanceDue: string; createdAt: string }[];
}
export interface CreateCustomerRequest { name: string; phone?: string; email?: string; groupId?: string; }
export interface UpdateCustomerRequest { name?: string; phone?: string | null; email?: string | null; groupId?: string | null; }
export interface RepaymentRequest { amount: string; note?: string; }
export interface RepaymentResponse { allocated: { orderId: string; amount: string }[]; remaining: string; totalOutstanding: string; }
export interface CustomerImportResponse { created: number; skipped: number; errors: string[]; }

/* ------------------------------- activity ---------------------------- */

export interface ActivityEntry { id: string; staffMemberId: string | null; action: string; detail: Record<string, unknown>; createdAt: string; }
export interface ActivityListResponse extends CursorPage<ActivityEntry> { total: number; }

/* ----------------------------- analytics ----------------------------- */

export interface AnalyticsSummary { range: UtcRange; totalSales: string; orderCount: number; bestSellers: { productId: string; name: string; units: number; revenue: string }[]; }
export interface AnalyticsBucket { start: string; end: string; totalSales: string; orderCount: number; }
export interface AnalyticsTimeseries { range: UtcRange; granularity: "daily" | "weekly"; buckets: AnalyticsBucket[]; }
export interface AnalyticsTrends { range: UtcRange; granularity: "daily" | "weekly"; totals: { totalSales: string; orderCount: number }; previousPeriod: { start: string; end: string; totalSales: string; orderCount: number }; changePercent: number | null; buckets: AnalyticsBucket[]; }
export interface StaffPerformanceMember { staffMemberId: string; name: string; sales: { orderCount: number; revenue: string }; inventoryActivity: { entries: number; unitsAdjusted: number }; }
export interface StaffPerformance { range: UtcRange; staff: StaffPerformanceMember[]; }
export interface AnalyticsChannel { source: string; orderCount: number; revenue: string; }
export interface AnalyticsChannels { range: UtcRange; channels: AnalyticsChannel[]; }
export type AnalyticsGranularity = "daily" | "weekly";

/* ---------------------------- public store --------------------------- */

export interface PublicStore { name: string; subdomain: string; whatsapp?: string; phone?: string; city?: string; country?: string; currency: string; template?: string; accent?: string; tagline?: string; heroTitle?: string; heroSubtitle?: string; }
export interface PublicProduct { id: string; name: string; description?: string; category?: string; unit?: string; price: string; discountPrice?: string | null; images: string[]; stock: number; }
export interface CheckoutInitRequest { customer: { name: string; email: string; phone?: string }; items: { productId: string; quantity: number }[]; }
export interface CheckoutInitResponse { order: { id: string; total: string; status: "PENDING" }; payment: { provider: "paystack"; reference: string; redirectUrl: string }; }
export interface HealthResponse { status: string; uptime: number; timestamp: string; }

/* ------------------------------- admin ------------------------------- */

export interface AdminLoginRequest { email: string; password: string; totpToken: string; }
export interface AdminSession { accessToken: string; admin: { id: string; email: string; roleName: string }; }
export interface AdminMe { id: string; email: string; roleName: "SUPER_ADMIN" | "SUPPORT_ADMIN"; permissions: string[]; }
export interface Admin2faRotate { secret: string; otpauthUrl: string; provisioningNotice: string; }
export interface AdminStoreSearchItem { id: string; name: string; subdomain: string | null; businessType: string; ownerEmail: string; tier: string; subscriptionStatus: string | null; createdAt: string; }
export interface AdminStoreSearchResponse extends CursorPage<AdminStoreSearchItem> {}
export interface AdminStoreDetail {
  id: string; name: string; subdomain: string | null; ownerEmail: string; businessType: string; createdAt: string;
  plan: { tier: string; status: string; currentPeriodStart: string; currentPeriodEnd: string; usage: { staff: number; products: number; orders: number }; activeSubscriptionId: string };
  staff: { id: string; role: string; permissions: string[]; name: string }[];
  recentOrders: { id: string; status: string; total: string; createdAt: string }[];
  paymentProvider: { provider: string | null; webhookHealth: { lastSuccessAt: string | null; lastFailureAt: string | null; lastEvents: { id: string; status: string; event: string; createdAt: string }[] } };
}
export interface AdminSignups { range: UtcRange; granularity: "daily" | "weekly"; buckets: { start: string; end: string; count: number }[]; }
export interface AdminActivation { range: UtcRange; createdStores: number; activatedStores: number; activationRate: number | null; }
export interface AdminSubscriptions { byStatus: { status: string; count: number }[]; byTier: { tier: string; count: number; monthlyPrice: number | null }[]; metrics: { activeSubscriptions: number; mrr: number }; computedAt: string; }
export interface AdminChurn { range: UtcRange; activeAtPeriodStart: number; churned: number; churnRate: number | null; }
export interface AdminPricingItem { plan: string; monthlyPrice: number | null; }
export interface AdminPricingResponse { items: AdminPricingItem[]; }
export interface AdminPricingUpdate { plan: string; monthlyPrice: number | null; updatedAt: string; }
export interface AdminAuditEntry { id: string; adminUserId: string; adminEmail: string; action: string; storeId: string | null; detail: Record<string, unknown> | null; createdAt: string; }
export interface AdminAuditResponse extends CursorPage<AdminAuditEntry> {}
export interface AdminAnomaly { storeId: string; storeName: string; productId: string; productName: string; quantity: number; ledgerTotal: number | null; issue: "NEGATIVE_STOCK" | "LEDGER_MISMATCH"; }
export interface AdminOrphanedOrder { orderId: string; storeId: string; storeName: string; status: string; paymentReference: string | null; createdAt: string; }
export interface AdminOrphanedOrders { items: AdminOrphanedOrder[]; windowHours: number; }
export interface AdminFlaggedContent { queue: unknown[]; nextCursor: string | null; reviewPolicy: string; }

/* ------------------------------ templates ------------------------------ */

export interface TemplateCatalogItem { id: string; slug: string; name: string; description: string | null; previewUrl: string | null; }
export interface TemplateCatalogResponse {
  templates: TemplateCatalogItem[]; tier: string; visibleCount: number | null;
  selectedTemplateId: string | null;
  settings: { accentColor: string | null; logoUrl: string | null; heroText: string | null; heroSubtext: string | null; announcementBar: { enabled: boolean; text: string } | null } | null;
}
export interface TemplateCustomizationRequest { accentColor?: string; logoUrl?: string; heroText?: string; heroSubtext?: string; announcementBar?: { enabled: boolean; text: string } | null; }

/* --------------------------- bulk import --------------------------- */

export interface BulkImportPreviewRow {
  rowNumber: number; status: "new" | "duplicate" | "error"; errors: string[];
  existingProductId: string | null; existingName: string | null;
  product: { name: string; price: string; costPrice: string | null; description: string | null; images: string[]; coverImageUrl: string | null; categoryId: string | null; unitId: string | null; initialStock: number | null } | null;
}
export interface BulkImportPreview { importId: string; rows: BulkImportPreviewRow[]; summary: { new: number; duplicates: number; errors: number }; expiresAt: string; }
export interface BulkImportConfirm { importId: string; resolveDuplicates: Record<number, "skip" | "overwrite">; }
export interface BulkImportResult { importId: string; created: unknown[]; overwritten: unknown[]; skipped: number[]; failed: number[]; }
