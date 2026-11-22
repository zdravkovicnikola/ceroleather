import { ProductCategory, ProductCategoryId } from '../models/product.model';

/** Catalog filters (in this order, after "Svi modeli"). */
export const CATEGORIES: ProductCategory[] = [
  {
    id: 'muski',
    label: 'Muški prsluci',
    intro: 'Klasični bajkerski prsluci, ručno krojeni i šiveni po meri.',
  },
  {
    id: 'zenski',
    label: 'Ženski prsluci',
  },
  {
    id: 'custom',
    label: 'Custom modeli',
    intro: 'Unikatni komadi — vaš detalj, vaš kroj, vaša priča.',
  },
];

export function categoryLabel(id: ProductCategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
