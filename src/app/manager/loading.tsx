
export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded-lg mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 bg-slate-200 rounded-xl" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-slate-200 rounded-xl" />
                <div className="h-96 bg-slate-200 rounded-xl" />
            </div>
        </div>
    );
}
