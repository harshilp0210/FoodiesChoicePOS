import { Order } from '@/lib/types';
import { format } from 'date-fns';

interface TaxInvoiceProps {
    order: Order;
    tableLabel?: string;
}

export default function TaxInvoice({ order, tableLabel }: TaxInvoiceProps) {
    const subtotal = order.total / 1.1;
    const tax = order.total - subtotal;
    const totalPaid = order.total + (order.tip || 0);

    return (
        <div className="w-[80mm] font-sans text-black p-4 bg-white break-after-page">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="font-bold text-xl uppercase tracking-widest mb-1">Foodie&apos;s Choice</div>
                <h2 className="text-sm font-bold uppercase border-2 border-black inline-block px-2 py-0.5 mb-2">Tax Invoice</h2>
                <p className="text-xs">123 Culinary Ave, Gourmet District</p>
                <p className="text-xs">Tel: +44 20 1234 5678</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 text-xs mb-4 gap-y-1">
                <span className="text-slate-500">Invoice #:</span>
                <span className="font-bold text-right">{order.id.slice(0, 10)}</span>

                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-right">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</span>

                <span className="text-slate-500">Table:</span>
                <span className="font-bold text-right">{tableLabel || 'N/A'}</span>

                <span className="text-slate-500">Server:</span>
                <span className="font-bold text-right">Staff</span>
            </div>

            {/* Items */}
            <div className="mb-4 border-t border-b border-black py-2">
                {order.items.map((item, i) => (
                    <div key={i} className="flex text-sm mb-1 leading-snug justify-between">
                        <div className="flex gap-2">
                            <span className="font-bold">{item.quantity}</span>
                            <span>{item.name}</span>
                        </div>
                        <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm text-right">
                <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">VAT (10%)</span>
                    <span>£{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-black border-t border-slate-300 pt-1 mt-1">
                    <span>Total Bill</span>
                    <span>£{order.total.toFixed(2)}</span>
                </div>
                {order.tip && order.tip > 0 && (
                    <div className="flex justify-between text-slate-600">
                        <span>Gratuity</span>
                        <span>£{order.tip.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Payment */}
            <div className="mt-4 border border-black p-2 text-center bg-slate-50">
                <p className="text-xs uppercase text-slate-500 mb-1">Paid With</p>
                <p className="font-bold uppercase text-lg">{order.payment_method}</p>
                <p className="text-xl font-extrabold mt-1">£{totalPaid.toFixed(2)}</p>
            </div>

            <div className="text-center text-xs mt-6 font-medium">
                Thank you for your business!
            </div>
        </div>
    );
}
