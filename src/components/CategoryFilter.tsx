'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categoryName.toLowerCase() === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryName);
    }

    router.push(`/?${params.toString()}`);
  };

  const allList = ['All', ...categories];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {allList.map((cat) => {
        const isActive =
          (cat === 'All' && (!selectedCategory || selectedCategory.toLowerCase() === 'all')) ||
          selectedCategory.toLowerCase() === cat.toLowerCase();

        return (
          <button
            key={cat}
            onClick={() => handleSelect(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}