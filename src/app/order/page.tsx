"use client";

import { useEffect, useState } from 'react';
import { Category, MenuItem } from '@/lib/types';
import MenuGrid from '@/components/pos/MenuGrid';
import CategoryTabs from '@/components/pos/CategoryTabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

export default function OrderPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/menu')
            .then(res => res.json())
            .then((data: Category[]) => {
                setCategories(data);
                setIsLoading(false);
            });
    }, []);

    // Filter items based on category
    const allItems = categories.flatMap(c => c.items);
    const filteredItems = selectedCategory === "All"
        ? allItems
        : categories.find(c => c.name === selectedCategory)?.items || [];

    // Pagination logic
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when category changes
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const categoryNames = ["All", ...categories.map(c => c.name)];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-purple-600/80 mix-blend-multiply opacity-80" />
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Craving Something Delicious?</h1>
                    <p className="text-slate-100 text-lg mb-6">Order fresh, hot meals directly from your phone. Pickup in 15 mins.</p>
                    <button className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg">
                        Browse Menu ↓
                    </button>
                </div>
            </div>

            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl font-bold text-slate-900 px-2">Our Menu</h2>

                    {/* Category Tabs */}
                    <div className="w-full md:w-auto overflow-x-auto">
                        <CategoryTabs
                            categories={categoryNames}
                            activeCategory={selectedCategory}
                            onSelect={handleCategoryChange}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {paginatedItems.length > 0 ? (
                            <MenuGrid items={paginatedItems} />
                        ) : (
                            <div className="text-center py-20 text-slate-500">
                                No items found in this category.
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-12 gap-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <span className="text-sm font-medium text-slate-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Next Page"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
