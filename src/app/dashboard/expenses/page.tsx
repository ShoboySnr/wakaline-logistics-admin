"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { FileText, Plus, Printer, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { ExpenseFilters, useCreateExpense, useDeleteExpense, useExpenseFormOptions, useExpenses, useStatement } from "@/src/api/expenses";
import { formatDate, formatNaira, statusLabel } from "@/src/helpers/format";
import { errorMessage } from "@/src/helpers/request";
import useNotify from "@/src/hooks/useNotify";
import DocumentTitle from "@/src/components/atoms/DocumentTitle";
import LoadingSpinner from "@/src/components/atoms/LoadingSpinner";
import Modal from "@/src/components/atoms/Modal";
import Pagination from "@/src/components/molecules/Pagination";
import StatCard from "@/src/components/molecules/StatCard";

interface ExpenseFormValues {
  category: string;
  description: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  receipt_number: string;
  vendor_name: string;
  notes: string;
}

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notify = useNotify();
  const { data: options } = useExpenseFormOptions();
  const createExpense = useCreateExpense();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    defaultValues: { expense_date: new Date().toISOString().slice(0, 10) } as ExpenseFormValues,
  });

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      await createExpense.mutateAsync({ ...values, amount: Number(values.amount) });
      notify.success("Expense added successfully");
      reset({ expense_date: new Date().toISOString().slice(0, 10) } as ExpenseFormValues);
      onClose();
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Expense"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="expense-form" className="btn-primary" disabled={createExpense.isPending}>
            {createExpense.isPending ? "Saving..." : "Add Expense"}
          </button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Category <span className="text-red-500">*</span></label>
          <select className="input" {...register("category", { required: true })}>
            <option value="">Select category</option>
            {options?.categories.map((c) => (
              <option key={c} value={c}>{statusLabel(c)}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-600">Category is required</p>}
        </div>
        <div>
          <label className="label">Amount (₦) <span className="text-red-500">*</span></label>
          <input type="number" step="0.01" className="input" {...register("amount", { required: true })} />
          {errors.amount && <p className="mt-1 text-xs text-red-600">Amount is required</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description <span className="text-red-500">*</span></label>
          <input className="input" {...register("description", { required: true })} />
          {errors.description && <p className="mt-1 text-xs text-red-600">Description is required</p>}
        </div>
        <div>
          <label className="label">Date <span className="text-red-500">*</span></label>
          <input type="date" className="input" {...register("expense_date", { required: true })} />
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" {...register("payment_method")}>
            <option value="">Select method</option>
            {options?.payment_methods.map((m) => (
              <option key={m} value={m}>{statusLabel(m)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Vendor Name</label>
          <input className="input" {...register("vendor_name")} />
        </div>
        <div>
          <label className="label">Receipt Number</label>
          <input className="input" {...register("receipt_number")} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea rows={2} className="input" {...register("notes")} />
        </div>
      </form>
    </Modal>
  );
}

const STATEMENT_PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all_time", label: "All Time" },
];

function StatementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [period, setPeriod] = useState("this_month");
  const { data, isFetching } = useStatement({ period }, open);

  return (
    <Modal open={open} onClose={onClose} title="Profit & Loss Statement" size="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <select className="input max-w-xs print:hidden" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {STATEMENT_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button onClick={() => window.print()} className="btn-primary print:hidden" disabled={!data}><Printer className="w-4 h-4" /> Print / Save PDF</button>
        </div>
      }>
      <div className="p-6" id="statement-print">
        {isFetching || !data ? <LoadingSpinner fullScreen={false} /> : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Waka Line Logistics</h3>
              <p className="text-sm text-gray-500">{data.period}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3"><p className="text-xs text-gray-500">Revenue</p><p className="text-lg font-bold text-green-700 dark:text-green-400">{formatNaira(data.total_revenue)}</p></div>
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3"><p className="text-xs text-gray-500">Expenses</p><p className="text-lg font-bold text-red-700 dark:text-red-400">{formatNaira(data.total_expenses)}</p></div>
              <div className="rounded-lg bg-primary/10 p-3"><p className="text-xs text-gray-500">Profit</p><p className="text-lg font-bold text-primary">{formatNaira(data.profit)}</p></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Revenue ({data.revenue.length})</h4>
              <table className="min-w-full text-xs"><tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.revenue.map((r, i) => (<tr key={i}><td className="py-1 text-gray-500">{r.date}</td><td className="py-1">{r.order_number}</td><td className="py-1">{r.customer_name}</td><td className="py-1 text-right font-medium">{formatNaira(r.amount)}</td></tr>))}
                {data.revenue.length === 0 && <tr><td className="py-2 text-gray-400">No delivered orders in this period.</td></tr>}
              </tbody></table>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Expenses ({data.expenses.length})</h4>
              <table className="min-w-full text-xs"><tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.expenses.map((e, i) => (<tr key={i}><td className="py-1 text-gray-500">{e.date}</td><td className="py-1">{e.category}</td><td className="py-1">{e.description}</td><td className="py-1 text-right font-medium">{formatNaira(e.amount)}</td></tr>))}
                {data.expenses.length === 0 && <tr><td className="py-2 text-gray-400">No expenses in this period.</td></tr>}
              </tbody></table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ExpensesContent() {
  const notify = useNotify();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);

  const filters: ExpenseFilters = { page, category: category || undefined, start_date: startDate || undefined, end_date: endDate || undefined };
  const { data, isLoading, isFetching } = useExpenses(filters);
  const { data: options } = useExpenseFormOptions();
  const deleteExpense = useDeleteExpense();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await deleteExpense.mutateAsync(id);
      notify.success(res.message);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <DocumentTitle title="Expenses" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Operating costs, and how they weigh against revenue.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStatementOpen(true)} className="btn-secondary">
            <FileText className="w-4 h-4" /> Statement
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Profit" value={formatNaira(data.stats.total_profit)} icon={Wallet} gradient="from-blue-500 to-blue-600" />
            <StatCard label="Today's Profit" value={formatNaira(data.stats.today_profit)} icon={Wallet} gradient="from-indigo-500 to-purple-600" />
            <StatCard label="This Week's Profit" value={formatNaira(data.stats.week_profit)} icon={Wallet} gradient="from-violet-500 to-fuchsia-600" />
            <StatCard label="This Month's Profit" value={formatNaira(data.stats.month_profit)} icon={Wallet} gradient="from-sky-500 to-blue-600" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={formatNaira(data.stats.total_revenue)} icon={TrendingUp} gradient="from-emerald-500 to-green-600" />
            <StatCard label="Today's Revenue" value={formatNaira(data.stats.today_revenue)} icon={TrendingUp} gradient="from-green-500 to-emerald-600" />
            <StatCard label="This Week's Revenue" value={formatNaira(data.stats.week_revenue)} icon={TrendingUp} gradient="from-teal-500 to-green-600" />
            <StatCard label="This Month's Revenue" value={formatNaira(data.stats.month_revenue)} icon={TrendingUp} gradient="from-emerald-600 to-teal-700" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Expenses" value={formatNaira(data.stats.total_expenses)} icon={TrendingDown} gradient="from-rose-400 to-primary" />
            <StatCard label="Today's Expenses" value={formatNaira(data.stats.today_expenses)} icon={TrendingDown} gradient="from-red-400 to-rose-600" />
            <StatCard label="This Week's Expenses" value={formatNaira(data.stats.week_expenses)} icon={TrendingDown} gradient="from-rose-500 to-pink-600" />
            <StatCard label="This Month's Expenses" value={formatNaira(data.stats.month_expenses)} icon={TrendingDown} gradient="from-pink-500 to-rose-600" />
          </div>
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {options?.categories.map((c) => (
              <option key={c} value={c}>{statusLabel(c)}</option>
            ))}
          </select>
          <input type="date" className="input" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          <input type="date" className="input" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          {(category || startDate || endDate) && (
            <button onClick={() => { setCategory(""); setStartDate(""); setEndDate(""); setPage(1); }} className="btn-secondary">Clear filters</button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen={false} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isFetching ? "opacity-60" : ""}`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  {["Date", "Category", "Description", "Vendor", "Amount", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data?.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(expense.expense_date)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary">{statusLabel(expense.category)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {expense.description}
                      {expense.notes && <p className="text-xs text-gray-500">{expense.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{expense.vendor_name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatNaira(expense.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(expense.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No expenses recorded for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && <Pagination meta={data.meta} onChange={setPage} />}
      </div>

      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <StatementModal open={statementOpen} onClose={() => setStatementOpen(false)} />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExpensesContent />
    </Suspense>
  );
}
