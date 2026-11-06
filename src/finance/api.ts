import { apiRequest } from '../lib/api'

export interface FinanceSummary {
  income: number
  expenses: number
  incomeCash: number
  incomeTransfer: number
  expenseCash: number
  expenseTransfer: number
  net: number
  netCash: number
  netTransfer: number
}

export interface FinanceExpense {
  id: string
  category: string
  paymentMethod: 'Efectivo' | 'Transferencia'
  amount: number
  reference: string | null
  notes: string | null
  occurredAt: string
}

export interface InventoryItem {
  id: string
  sku: string | null
  name: string
  description: string | null
  unit: string
  reorderLevel: number
  stock: number
}

export const loadFinanceSummary = async () => {
  const response = await apiRequest<{ summary: FinanceSummary }>('/finance/summary')
  return response.summary
}

export const loadFinanceExpenses = async () => {
  const response = await apiRequest<{ expenses: FinanceExpense[] }>('/finance/expenses')
  return response.expenses
}

export const loadInventory = async () => {
  const response = await apiRequest<{ items: InventoryItem[] }>('/inventory')
  return response.items
}

export const createExpense = async (data: {
  amount: number
  category: string
  paymentMethod: 'Efectivo' | 'Transferencia'
  notes: string
}) => {
  await apiRequest('/finance/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createInventoryEntry = async (data: {
  itemId?: string
  itemName?: string
  unit?: string
  quantity: number
  amount: number
  paymentMethod: 'Efectivo' | 'Transferencia'
  notes: string
}) => {
  await apiRequest('/inventory/entries', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
