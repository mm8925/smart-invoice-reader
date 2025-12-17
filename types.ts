export enum ExpenseCategory {
  OFFICE_SUPPLIES = 'Office Supplies',
  TRAVEL = 'Travel',
  FOOD_ENTERTAINMENT = 'Food & Entertainment',
  UTILITIES = 'Utilities',
  INVENTORY = 'Inventory',
  MISCELLANEOUS = 'Miscellaneous',
  UNCATEGORIZED = 'Uncategorized'
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  vendorName: string;
  invoiceNumber: string;
  date: string; // ISO Date string YYYY-MM-DD
  currency: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  category: ExpenseCategory;
  lineItems: LineItem[];
  confidenceLevel: 'High' | 'Medium' | 'Low';
  aiNotes: string; // Reasoning or warnings
}

export interface InvoiceRecord {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  data?: InvoiceData;
  errorMsg?: string;
  uploadedAt: number;
}

export interface DashboardStats {
  totalSpend: number;
  categoryBreakdown: { name: string; value: number }[];
  monthlySpend: { month: string; amount: number }[];
}
