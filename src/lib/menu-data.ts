import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { MenuItem, Category } from './types';

// Simple in-memory cache
let cachedMenu: Category[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000 * 5; // 5 minutes

export const getMenuData = async (): Promise<Category[]> => {
    const now = Date.now();
    if (cachedMenu && (now - lastFetch < CACHE_TTL)) {
        // return cachedMenu; // Disable cache for dev
    }

    const filePath = path.join(process.cwd(), 'public', 'menu.csv');
    const fileContent = await fsPromises.readFile(filePath, 'utf8');

    const { data } = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    const categories: Record<string, MenuItem[]> = {};

    data.forEach((row: any, index: number) => {
        const categoryName = row['Category']?.trim();
        if (!categoryName) return;

        if (!categories[categoryName]) {
            categories[categoryName] = [];
        }

        let price = row['Price_GBP'];
        if (typeof price === 'string') {
            price = parseFloat(price.replace(/[^0-9.]/g, ''));
        }

        let image = '/images/main_course.png'; // Fallback
        const catLower = categoryName.toLowerCase();

        if (catLower.includes('starter')) image = '/images/starters.png';
        else if (catLower.includes('soup') || catLower.includes('salad')) image = '/images/starters.png'; // Reuse for now
        else if (catLower.includes('street')) image = '/images/street_food.png';
        else if (catLower.includes('main')) image = '/images/main_course.png';
        else if (catLower.includes('south')) image = '/images/south_indian.png';
        else if (catLower.includes('chinese')) image = '/images/indo_chinese.png';
        else if (catLower.includes('bread') || catLower.includes('roti') || catLower.includes('naan')) image = '/images/main_course.png'; // Bread usually with curry
        else if (catLower.includes('dessert') || catLower.includes('ice cream')) image = '/images/dessert.png';
        // else if (catLower.includes('juice') || catLower.includes('drink') || catLower.includes('lassi')) image = '/images/drinks.png'; 

        // [NEW] Mock Modifiers based on category/name
        let modifierGroups: any[] = [];

        // Example: Pizza Modifiers
        if (catLower.includes('pizza') || row['Item']?.toLowerCase().includes('pizza')) {
            modifierGroups.push({
                id: 'mod-crust',
                name: 'Crust Type',
                minSelection: 1,
                maxSelection: 1,
                modifiers: [
                    { id: 'thin', name: 'Thin Crust', price: 0 },
                    { id: 'thick', name: 'Thick Crust', price: 0 },
                    { id: 'gf', name: 'Gluten Free', price: 2.00 },
                ]
            });
            modifierGroups.push({
                id: 'mod-toppings',
                name: 'Extra Toppings',
                minSelection: 0,
                maxSelection: 5,
                modifiers: [
                    { id: 'top-cheese', name: 'Extra Cheese', price: 1.50 },
                    { id: 'top-bo', name: 'Black Olives', price: 0.75 },
                    { id: 'top-mush', name: 'Mushrooms', price: 0.75 },
                    { id: 'top-pep', name: 'Pepperoni', price: 1.50 },
                ]
            });
        }

        // Example: Burger/Steak Temp
        if (row['Item']?.toLowerCase().includes('burger') || row['Item']?.toLowerCase().includes('steak')) {
            modifierGroups.push({
                id: 'mod-temp',
                name: 'Cooking Temperature',
                minSelection: 1,
                maxSelection: 1,
                modifiers: [
                    { id: 'temp-r', name: 'Rare', price: 0 },
                    { id: 'temp-mr', name: 'Medium Rare', price: 0 },
                    { id: 'temp-m', name: 'Medium', price: 0 },
                    { id: 'temp-mw', name: 'Medium Well', price: 0 },
                    { id: 'temp-w', name: 'Well Done', price: 0 },
                ]
            });
        }

        // [NEW] Spice Levels for ALL items except Drinks/Desserts
        const isDessertOrDrink =
            catLower.includes('dessert') ||
            catLower.includes('ice cream') ||
            catLower.includes('drink') ||
            catLower.includes('beverage') ||
            catLower.includes('lassi') ||
            catLower.includes('juice');

        if (!isDessertOrDrink) {
            modifierGroups.push({
                id: 'mod-spice',
                name: 'Spice Level',
                minSelection: 1,
                maxSelection: 1,
                modifiers: [
                    { id: 'spice-mild', name: 'Mild', price: 0 },
                    { id: 'spice-med', name: 'Medium', price: 0 },
                    { id: 'spice-hot', name: 'Hot', price: 0 },
                    { id: 'spice-extra', name: 'Extra Hot', price: 0 },
                    { id: 'spice-phall', name: 'Phall (Extreme)', price: 0 },
                ]
            });
        }

        categories[categoryName].push({
            id: `item-${index}`,
            category: categoryName,
            name: row['Item']?.trim(),
            price: price || 0,
            description: row['Notes']?.trim() || '',
            image,
            available: true,
            modifierGroups, // [NEW]
        });
    });

    // [NEW] Add "Tiffin" Category manually if not in CSV
    if (!categories["Tiffin Service"]) {
        categories["Tiffin Service"] = [
            { id: 'tiff-1', category: 'Tiffin Service', name: 'Veg Tiffin (Daily)', price: 12.00, description: '3 Roti, Rice, Dal, 2 Sabzi, Salad, Sweet', image: '/images/south_indian.png', available: true, modifierGroups: [] },
            { id: 'tiff-2', category: 'Tiffin Service', name: 'Non-Veg Tiffin (Daily)', price: 14.00, description: '3 Roti, Rice, Chicken Curry, 1 Sabzi, Salad', image: '/images/main_course.png', available: true, modifierGroups: [] },
            { id: 'tiff-3', category: 'Tiffin Service', name: 'Student Budget Tiffin', price: 9.99, description: 'Rice, Dal, 1 Sabzi', image: '/images/south_indian.png', available: true, modifierGroups: [] },
        ];
    }

    cachedMenu = Object.entries(categories).map(([name, items]) => ({
        name,
        items,
    }));
    lastFetch = now;

    return cachedMenu;
};
