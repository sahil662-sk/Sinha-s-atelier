import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image?: string | null;
  stock: number;
  category?: { name: string } | string | null;
}

interface WishlistState {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (item) => {
        const currentItems = get().items;
        const exists = currentItems.some((i) => i.id === item.id);

        if (exists) {
          set({ items: currentItems.filter((i) => i.id !== item.id) });
        } else {
          set({ items: [...currentItems, item] });
        }
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id);
      },

      removeFromWishlist: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'sinhas_wishlist_storage',
    }
  )
);