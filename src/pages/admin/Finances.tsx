import { useCallback, useEffect, useState, type FC, type FormEvent } from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import {
  createExpense,
  createInventoryEntry,
  loadFinanceExpenses,
  loadFinanceSummary,
  loadInventory,
  type FinanceExpense,
  type FinanceSummary,
  type InventoryItem,
} from '../../finance/api'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const paymentMethodOptions = ['Efectivo', 'Transferencia'] as const
const isPaymentMethod = (
  value: string,
): value is (typeof paymentMethodOptions)[number] =>
  paymentMethodOptions.some((method) => method === value)

const fetchFinanceData = () =>
  Promise.all([loadFinanceSummary(), loadFinanceExpenses(), loadInventory()])

export const Finances: FC = () => {
  const [currentMonth] = useState(() => monthKey(new Date()))
  const monthLabel = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${currentMonth}-15T12:00:00`))
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [expenses, setExpenses] = useState<FinanceExpense[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [submitting, setSubmitting] = useState<'expense' | 'inventory' | null>(null)

  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('')
  const [expenseMethod, setExpenseMethod] =
    useState<(typeof paymentMethodOptions)[number]>('Efectivo')
  const [expenseNotes, setExpenseNotes] = useState('')

  const [selectedItem, setSelectedItem] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('Pieza')
  const [entryQuantity, setEntryQuantity] = useState('')
  const [entryAmount, setEntryAmount] = useState('')
  const [entryMethod, setEntryMethod] =
    useState<(typeof paymentMethodOptions)[number]>('Efectivo')
  const [entryNotes, setEntryNotes] = useState('')

  const refreshData = useCallback(async () => {
    setLoadError('')
    try {
      const [loadedSummary, loadedExpenses, loadedInventory] = await fetchFinanceData()
      setSummary(loadedSummary)
      setExpenses(loadedExpenses)
      setInventory(loadedInventory)
      setLoadError('')
    } catch (loadFailure: unknown) {
      setLoadError(
        loadFailure instanceof Error
          ? loadFailure.message
          : 'No fue posible cargar las finanzas y el inventario.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchFinanceData()
      .then(([loadedSummary, loadedExpenses, loadedInventory]) => {
        if (!cancelled) {
          setSummary(loadedSummary)
          setExpenses(loadedExpenses)
          setInventory(loadedInventory)
        }
      })
      .catch((loadFailure: unknown) => {
        if (!cancelled) {
          setLoadError(
            loadFailure instanceof Error
              ? loadFailure.message
              : 'No fue posible cargar las finanzas y el inventario.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleExpenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting('expense')
    setActionError('')
    setActionMessage('')
    try {
      await createExpense({
        amount: Number(expenseAmount),
        category: expenseCategory.trim(),
        paymentMethod: expenseMethod,
        notes: expenseNotes.trim(),
      })
      setExpenseAmount('')
      setExpenseCategory('')
      setExpenseNotes('')
      setActionMessage('Egreso registrado; ya se refleja en el balance del mes.')
      setIsLoading(true)
      await refreshData()
    } catch (failure: unknown) {
      setActionError(
        failure instanceof Error ? failure.message : 'No fue posible registrar el egreso.',
      )
    } finally {
      setSubmitting(null)
    }
  }

  const handleInventorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting('inventory')
    setActionError('')
    setActionMessage('')
    try {
      const itemData =
        selectedItem === 'new'
          ? { itemName: newItemName.trim(), unit: newItemUnit.trim() }
          : { itemId: selectedItem }
      await createInventoryEntry({
        ...itemData,
        quantity: Number(entryQuantity),
        amount: Number(entryAmount),
        paymentMethod: entryMethod,
        notes: entryNotes.trim(),
      })
      setSelectedItem('')
      setNewItemName('')
      setNewItemUnit('Pieza')
      setEntryQuantity('')
      setEntryAmount('')
      setEntryNotes('')
      setActionMessage('Entrada de inventario y egreso de compra registrados.')
      setIsLoading(true)
      await refreshData()
    } catch (failure: unknown) {
      setActionError(
        failure instanceof Error
          ? failure.message
          : 'No fue posible registrar la entrada de inventario.',
      )
    } finally {
      setSubmitting(null)
    }
  }

  const total = summary?.net ?? 0

  return (
    <div className="w-full space-y-8">
      <PageHeader
        description={`Balance de ${monthLabel}: ingresos cobrados menos egresos registrados.`}
        eyebrow="Administración"
        title="Finanzas e insumos"
      />

      {loadError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          No se pudieron cargar los datos: {loadError}
        </p>
      )}
      {actionError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}
      {actionMessage && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {actionMessage}
        </p>
      )}

      <section
        aria-label="Balance del mes"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <article className="rounded-2xl bg-[#402b35] p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-rose-100">Ganancia neta · {monthLabel}</p>
          <p className="mt-3 text-3xl font-semibold">
            {isLoading ? '—' : money.format(total)}
          </p>
          <p className="mt-2 text-xs text-rose-100">Ingresos menos egresos</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">Ingresos cobrados</p>
          <p className="mt-3 text-3xl font-semibold text-[#402b35]">
            {isLoading ? '—' : money.format(summary?.income ?? 0)}
          </p>
          <p className="mt-2 text-xs text-stone-500">Solo citas completadas</p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-rose-800">Egresos</p>
          <p className="mt-3 text-3xl font-semibold text-[#402b35]">
            {isLoading ? '—' : money.format(summary?.expenses ?? 0)}
          </p>
          <p className="mt-2 text-xs text-stone-500">Incluye compras de insumos</p>
        </article>
        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-700">Disponible en caja</p>
          <p className="mt-3 text-3xl font-semibold text-[#402b35]">
            {isLoading ? '—' : money.format(summary?.netCash ?? 0)}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Efectivo recibido menos egresos en efectivo
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-sky-800">Disponible en transferencias</p>
          <p className="mt-3 text-3xl font-semibold text-[#402b35]">
            {isLoading ? '—' : money.format(summary?.netTransfer ?? 0)}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Transferencias recibidas menos egresos
          </p>
        </article>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-2">
        <form
          className="responsive-form-card space-y-5 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm sm:p-7"
          onSubmit={handleExpenseSubmit}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-800">
              Salida de dinero
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#402b35]">
              Registrar egreso
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Los egresos restan del balance del mes al guardarse.
            </p>
          </div>
          <div className="responsive-form-grid grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Monto (MXN)
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                min="0.01"
                onChange={(event) => setExpenseAmount(event.target.value)}
                required
                step="0.01"
                type="number"
                value={expenseAmount}
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Categoría
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                maxLength={100}
                onChange={(event) => setExpenseCategory(event.target.value)}
                placeholder="Ej. Renta, luz, agua, publicidad"
                required
                value={expenseCategory}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-stone-700">
            Método de pago
            <select
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-normal outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              onChange={(event) => {
                if (isPaymentMethod(event.target.value)) {
                  setExpenseMethod(event.target.value)
                }
              }}
              value={expenseMethod}
            >
              {paymentMethodOptions.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Detalle (opcional)
            <textarea
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              maxLength={1000}
              onChange={(event) => setExpenseNotes(event.target.value)}
              rows={2}
              value={expenseNotes}
            />
          </label>
          <button
            className="rounded-full bg-rose-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-950 disabled:cursor-wait disabled:opacity-60"
            disabled={submitting !== null}
            type="submit"
          >
            {submitting === 'expense' ? 'Guardando…' : 'Registrar egreso'}
          </button>
        </form>

        <form
          className="responsive-form-card space-y-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7"
          onSubmit={handleInventorySubmit}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
              Entrada y compra
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#402b35]">
              Aumentar inventario
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Registra las piezas compradas y su costo. Se guarda también como egreso.
            </p>
          </div>
          <label className="block text-sm font-medium text-stone-700">
            Insumo
            <select
              className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              onChange={(event) => setSelectedItem(event.target.value)}
              required
              value={selectedItem}
            >
              <option value="">Selecciona un insumo</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · stock {item.stock} {item.unit}
                </option>
              ))}
              <option value="new">+ Registrar un insumo nuevo</option>
            </select>
          </label>
          {selectedItem === 'new' && (
            <div className="responsive-form-grid grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Nombre del insumo
                <input
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  maxLength={160}
                  onChange={(event) => setNewItemName(event.target.value)}
                  required
                  value={newItemName}
                />
              </label>
              <label className="text-sm font-medium text-stone-700">
                Unidad
                <input
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  maxLength={60}
                  onChange={(event) => setNewItemUnit(event.target.value)}
                  placeholder="Pieza, ml, g…"
                  required
                  value={newItemUnit}
                />
              </label>
            </div>
          )}
          <div className="responsive-form-grid grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Cantidad que entra
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                min="0.001"
                onChange={(event) => setEntryQuantity(event.target.value)}
                required
                step="0.001"
                type="number"
                value={entryQuantity}
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Costo total (MXN)
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                min="0.01"
                onChange={(event) => setEntryAmount(event.target.value)}
                required
                step="0.01"
                type="number"
                value={entryAmount}
              />
            </label>
          </div>
          <div className="responsive-form-grid grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Pagado con
              <select
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                onChange={(event) => {
                  if (isPaymentMethod(event.target.value)) {
                    setEntryMethod(event.target.value)
                  }
                }}
                value={entryMethod}
              >
                {paymentMethodOptions.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-stone-700">
              Nota (opcional)
              <input
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-normal outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                maxLength={500}
                onChange={(event) => setEntryNotes(event.target.value)}
                value={entryNotes}
              />
            </label>
          </div>
          <button
            className="rounded-full bg-[#54306e] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-950/30 transition hover:bg-[#684085] disabled:cursor-wait disabled:opacity-60"
            disabled={submitting !== null}
            type="submit"
          >
            {submitting === 'inventory' ? 'Guardando…' : 'Registrar entrada y egreso'}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-5 sm:px-7">
          <h2 className="font-serif text-2xl text-[#402b35]">Inventario disponible</h2>
          <p className="mt-1 text-sm text-stone-500">
            Existencias calculadas con las entradas y salidas registradas.
          </p>
        </div>
        {isLoading ? (
          <p className="px-6 py-8 text-center text-sm text-stone-500">Cargando inventario…</p>
        ) : inventory.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-stone-500">
            Aún no hay insumos. Registra una compra para crear el primer artículo.
          </p>
        ) : (
          <>
            <div className="desktop-data-table overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#f5fbf7] text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Insumo</th>
                  <th className="px-5 py-4 font-semibold">Unidad</th>
                  <th className="px-5 py-4 text-right font-semibold">Existencia</th>
                  <th className="px-5 py-4 text-right font-semibold">Nivel de reorden</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventory.map((item) => {
                  const lowStock = item.stock <= item.reorderLevel
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-medium text-stone-800">{item.name}</td>
                      <td className="px-5 py-4 text-stone-600">{item.unit}</td>
                      <td className="px-5 py-4 text-right font-semibold text-stone-800">
                        {item.stock}
                      </td>
                      <td className="px-5 py-4 text-right text-stone-600">
                        {item.reorderLevel}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lowStock ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                          {lowStock ? 'Stock bajo' : 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            <div className="mobile-data-list">
            {inventory.map((item) => {
              const lowStock = item.stock <= item.reorderLevel
              return (
                <article
                  className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="break-words font-semibold text-stone-900">
                      {item.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${lowStock ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}
                    >
                      {lowStock ? 'Stock bajo' : 'Disponible'}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-stone-500">Existencia</dt>
                      <dd className="mt-0.5 font-semibold text-stone-800">
                        {item.stock} {item.unit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-stone-500">Nivel de reorden</dt>
                      <dd className="mt-0.5 text-stone-800">
                        {item.reorderLevel} {item.unit}
                      </dd>
                    </div>
                  </dl>
                </article>
              )
            })}
            </div>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-5 sm:px-7">
          <h2 className="font-serif text-2xl text-[#402b35]">Egresos recientes</h2>
          <p className="mt-1 text-sm text-stone-500">
            Se muestran hasta los últimos 200 movimientos de salida registrados.
          </p>
        </div>
        {isLoading ? (
          <p className="px-6 py-8 text-center text-sm text-stone-500">Cargando egresos…</p>
        ) : expenses.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-stone-500">
            Aún no hay egresos registrados.
          </p>
        ) : (
          <>
            <div className="desktop-data-table overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#fff8f6] text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Fecha</th>
                  <th className="px-5 py-4 font-semibold">Categoría</th>
                  <th className="px-5 py-4 font-semibold">Detalle</th>
                  <th className="px-5 py-4 font-semibold">Método</th>
                  <th className="px-5 py-4 text-right font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                      {new Intl.DateTimeFormat('es-MX', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(expense.occurredAt.replace(' ', 'T')))}
                    </td>
                    <td className="px-5 py-4 font-medium text-stone-800">{expense.category}</td>
                    <td className="max-w-sm px-5 py-4 text-stone-600">
                      {expense.notes || expense.reference || '—'}
                    </td>
                    <td className="px-5 py-4 text-stone-600">{expense.paymentMethod}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-rose-800">
                      −{money.format(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="mobile-data-list">
            {expenses.map((expense) => (
              <article
                className="min-w-0 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                key={expense.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="break-words font-semibold text-stone-900">
                    {expense.category}
                  </h3>
                  <span className="shrink-0 font-semibold text-rose-800">
                    −{money.format(expense.amount)}
                  </span>
                </div>
                <p className="mt-2 break-words text-sm text-stone-600">
                  {expense.notes || expense.reference || 'Sin detalle adicional'}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  {new Intl.DateTimeFormat('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(expense.occurredAt.replace(' ', 'T')))}
                  {' · '}
                  {expense.paymentMethod}
                </p>
              </article>
            ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
