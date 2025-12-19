"use client";

import { cn } from "@/lib/utils";

interface CategoryTabsProps {
    categories: string[];
    activeCategory: string;
    onSelect: (category: string) => void;
}

export default function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat)}
                    className={cn(
                        "px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                        activeCategory === cat
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                            : "bg-background border hover:bg-muted text-muted-foreground"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
