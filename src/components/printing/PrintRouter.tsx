import KOT from './KOT';
import GuestCheck from './GuestCheck';
import TaxInvoice from './TaxInvoice';
import { Order, CartItem, Table } from '@/lib/types';

export type PrintJob =
    | { type: 'KOT'; items: CartItem[]; orderId: string; timestamp: Date; department: 'KITCHEN' | 'BAR'; tableLabel: string }
    | { type: 'GUEST_CHECK'; order: Order; tableLabel: string }
    | { type: 'TAX_INVOICE'; order: Order; tableLabel: string };

interface PrintRouterProps {
    job: PrintJob | null;
}

export default function PrintRouter({ job }: PrintRouterProps) {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white text-black flex items-start justify-center overflow-auto print:block print:overflow-visible">
            {/* Screen Preview Wrapper */}
            <div className="print:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 text-center">
                <p className="font-bold animate-pulse">Printing {job.type.replace('_', ' ')}...</p>
                <p className="text-xs opacity-70">Please wait for print dialog</p>
            </div>

            <div className="mt-16 print:mt-0">
                {job.type === 'KOT' && (
                    <KOT
                        items={job.items}
                        orderId={job.orderId}
                        timestamp={job.timestamp}
                        department={job.department}
                        tableLabel={job.tableLabel}
                    />
                )}
                {job.type === 'GUEST_CHECK' && (
                    <GuestCheck order={job.order} tableLabel={job.tableLabel} />
                )}
                {job.type === 'TAX_INVOICE' && (
                    <TaxInvoice order={job.order} tableLabel={job.tableLabel} />
                )}
            </div>
        </div>
    );
}
