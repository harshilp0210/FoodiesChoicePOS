
export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Hero Skeleton */}
            <div className="bg-slate-200/50 rounded-2xl h-[300px] w-full" />

            {/* Content Skeleton */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-32 bg-slate-200 rounded-lg" />
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-slate-200 rounded-lg" />
                        <div className="h-10 w-24 bg-slate-200 rounded-lg" />
                        <div className="h-10 w-24 bg-slate-200 rounded-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="bg-slate-100 rounded-xl h-64 border border-slate-200" />
                    ))}
                </div>
            </div>
        </div>
    );
}
