import { Order, CartItem } from '@/lib/types';
import { format } from 'date-fns';

interface KOTProps {
    tableLabel?: string;
    items: CartItem[];
    orderId: string;
    timestamp: Date;
    department: 'KITCHEN' | 'BAR';
}

export default function KOT({ tableLabel, items, orderId, timestamp, department }: KOTProps) {
    if (items.length === 0) return null;

    return (
        <div className="w-[80mm] font-mono text-black p-2 bg-white break-after-page">
            <div className="border-b-4 border-black pb-2 mb-2">
                <div className="flex justify-between items-end">
                    <h1 className="text-4xl font-extrabold">Tb {tableLabel || '??'}</h1>
                    <span className="text-xl font-bold">{department}</span>
                </div>
                <div className="flex justify-between mt-1 text-sm font-bold">
                    <span>#{orderId.slice(-4)}</span>
                    <span>{format(timestamp, 'HH:mm')}</span>
                </div>
            </div>

            <div className="space-y-4">
                {items.map((item, i) => (
                    <div key={i} className="leading-tight">
                        <div className="flex gap-2 text-lg font-bold">
                            <span className="w-8 text-right">{item.quantity}</span>
                            <span className="uppercase">{item.name}</span>
                        </div>

                        {/* Modifiers */}
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <div className="pl-10 mt-1 space-y-0.5">
                                {item.selectedModifiers.map((mod, j) => (
                                    <div key={j} className="flex items-center text-sm font-semibold uppercase">
                                        <span className="mr-1">Original</span> {/* Mock modifier text if just price */}
                                        <span className="text-black">» {mod.name}</span>
                                        {/* In real impact printer, color might not work, but ">>" symbols do */}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                            <div className="pl-10 mt-1 text-sm font-bold uppercase border-l-4 border-black pl-2">
                                * {item.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-2 border-t-2 border-dashed border-black text-center text-xs font-bold">
                END OF TICKET
            </div>
        </div>
    );
}
