import { Order } from '@/lib/types';
import { format } from 'date-fns';

interface ReceiptProps {
    order: Order | null;
    isBill?: boolean; // [NEW] If true, shows signature lines instead of payment details
}

export default function Receipt({ order, isBill = false }: ReceiptProps) {
    if (!order) return null;

    return (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-mono">
            <div className="max-w-[80mm] mx-auto text-center space-y-4">
                {/* Header */}
                <div className="border-b border-black pb-4 mb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Foodie&apos;s Choice</h1>
                    <p className="text-sm">123 Culinary Ave, Foodtown</p>
                    <p className="text-sm">Tel: +44 20 1234 5678</p>
                </div>

                {/* Order Info */}
                <div className="text-left text-sm space-y-1 pb-4 border-b border-black mb-4 border-dashed">
                    <div className="flex justify-between">
                        <span>Order #:</span>
                        <span>{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Pay Method:</span>
                        <span className="uppercase">{order.payment_method}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="text-left text-sm space-y-2 pb-4 border-b border-black mb-4 border-dashed">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 font-bold mb-2 border-b border-black pb-1">
                        <span>Qty</span>
                        <span>Item</span>
                        <span>Price</span>
                    </div>
                    {order.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-[auto_1fr_auto] gap-2">
                            <span>{item.quantity}</span>
                            <span>{item.name}</span>
                            <span>£{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="text-right space-y-1 pb-4 border-b border-black mb-4">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>£{(order.total / 1.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax (10%):</span>
                        <span>£{(order.total - (order.total / 1.1)).toFixed(2)}</span>
                    </div>
                    {isBill ? (
                        <>
                            <div className="flex justify-between text-lg font-bold border-t border-black pt-4 mt-2">
                                <span>Total:</span>
                                <span>£{order.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-8">
                                <span>Tip:</span>
                                <span className="border-b border-black w-24 inline-block"></span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-4">
                                <span>Grand Total:</span>
                                <span className="border-b border-black w-24 inline-block"></span>
                            </div>
                            <div className="text-left pt-12 mt-4">
                                <p className="text-sm font-bold mb-8">Signature:</p>
                                <div className="border-b border-black w-full"></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between text-lg font-bold border-t border-black pt-2 mt-2">
                                <span>TOTAL:</span>
                                <span>£{order.total.toFixed(2)}</span>
                            </div>
                            {/* [NEW] Tip Line */}
                            {order.tip && order.tip > 0 && (
                                <div className="flex justify-between text-sm mt-1 border-b border-black pb-2 mb-2 border-dashed">
                                    <span>Tip:</span>
                                    <span>£{order.tip.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-1">
                                <span>PAID:</span>
                                <span>£{(order.total + (order.tip || 0)).toFixed(2)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-sm pt-4">
                    <p className="font-bold">Thank you for dining with us!</p>
                    <p className="text-xs mt-2">Please retain this receipt for your records.</p>
                </div>
            </div>
        </div>
    );
}
