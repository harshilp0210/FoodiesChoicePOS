import { Order } from '@/lib/types';
import { format } from 'date-fns';

interface GuestCheckProps {
    order: Order;
    tableLabel?: string;
}

export default function GuestCheck({ order, tableLabel }: GuestCheckProps) {
    const subtotal = order.total / 1.1; // Assuming total includes 10% tax
    const tax = order.total - subtotal;
    const serviceCharge = 0; // Mock for now, typical in upscale dining

    // Suggest tips based on PRE-TAX subtotal usually? Or Post-tax. Let's use Total.
    const tips = [15, 18, 20].map(pct => ({
        pct,
        val: (order.total * (pct / 100)).toFixed(2)
    }));

    return (
        <div className="w-[80mm] font-sans text-black p-4 bg-white break-after-page">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-2 border-2 border-black rounded-full flex items-center justify-center font-bold text-xl">FC</div>
                <h1 className="font-bold text-xl uppercase tracking-widest mb-1">Foodie&apos;s Choice</h1>
                <p className="text-xs text-slate-600">123 Culinary Ave, Gourmet District</p>
                <p className="text-xs text-slate-600">VAT Reg: G4588219</p>
            </div>

            {/* Meta */}
            <div className="flex justify-between text-sm mb-4 border-b pb-2">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase">Check #</span>
                    <span className="font-bold">{order.id.slice(0, 8)}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-500 uppercase">Table</span>
                    <span className="font-bold text-lg">{tableLabel || '--'}</span>
                </div>
            </div>
            <div className="text-center text-xs mb-4 text-slate-500">
                {format(new Date(), 'dd/MM/yyyy HH:mm')} | Guest Check
            </div>

            {/* Items */}
            <div className="mb-6">
                <div className="flex text-xs font-bold border-b border-black pb-1 mb-2">
                    <span className="w-8">Qty</span>
                    <span className="flex-1">Item</span>
                    <span className="text-right">Price</span>
                </div>
                {order.items.map((item, i) => (
                    <div key={i} className="flex text-sm mb-1 leading-snug">
                        <span className="w-8 font-bold">{item.quantity}</span>
                        <div className="flex-1">
                            <span>{item.name}</span>
                            {/* Show basic modifiers inline if short, or indented */}
                        </div>
                        <span className="text-right font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm border-t border-black pt-4 mb-8">
                <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Tax (10%)</span>
                    <span>£{tax.toFixed(2)}</span>
                </div>
                {serviceCharge > 0 && (
                    <div className="flex justify-between">
                        <span className="text-slate-600">Service Charge</span>
                        <span>£{serviceCharge.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t-2 border-black pt-2 mt-2">
                    <span>TOTAL</span>
                    <span>£{order.total.toFixed(2)}</span>
                </div>
            </div>

            {/* Tip Guide */}
            <div className="border border-slate-300 rounded-lg p-3 mb-6 bg-slate-50">
                <p className="text-center text-xs font-bold uppercase mb-2 text-slate-500">Suggested Gratuity</p>
                <div className="flex justify-between text-xs font-medium">
                    {tips.map(t => (
                        <div key={t.pct} className="text-center">
                            <div className="font-bold">{t.pct}%</div>
                            <div>£{t.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer QR */}
            <div className="text-center">
                <div className="w-24 h-24 bg-slate-200 mx-auto mb-2 flex items-center justify-center text-xs text-slate-400">QR Code</div>
                <p className="text-xs font-bold uppercase">Scan to Pay or Review</p>
                <p className="text-[10px] mt-4 text-slate-400 whitespace-pre-line">We hope you enjoyed your meal!{'\n'}For any feedback, please speak to a manager.</p>
            </div>
        </div>
    );
}
