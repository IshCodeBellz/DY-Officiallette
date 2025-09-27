export interface ProductSummary {
  productId: string;
  name: string;
  priceCents: number; // canonical integer minor units
  image: string;
  size?: string;
}

export interface CartItem extends ProductSummary {
  id: string; // unique line id (productId + size or nanoid)
  qty: number;
}

export interface WishlistItem extends ProductSummary {
  id: string; // productId(+size)
}

export interface CartState {
  items: CartItem[];
}

export interface WishlistState {
  items: WishlistItem[];
}

export interface CartContextValue extends CartState {
  addItem: (item: ProductSummary, qty?: number) => void;
  updateQty: (lineId: string, qty: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  subtotal: number;
  totalQuantity: number;
}

export interface WishlistContextValue extends WishlistState {
  add: (item: ProductSummary) => void;
  remove: (id: string) => void;
  toggle: (item: ProductSummary) => void;
  moveToCart: (
    id: string,
    addToCart: (item: ProductSummary, qty?: number) => void
  ) => void;
  has: (id: string) => boolean;
}

export function lineIdFor(productId: string, size?: string) {
  return size ? `${productId}__${size}` : productId;
}
