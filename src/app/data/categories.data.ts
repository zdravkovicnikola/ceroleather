import { ProductCategory, ProductCategoryId } from '../models/product.model';

export const CATEGORIES: ProductCategory[] = [
  {
    id: 'prsluci',
    label: 'Kožni prsluci',
    intro: 'Klasični bajkerski prsluci, ručno krojeni i šiveni po meri.',
  },
  {
    id: 'jakne',
    label: 'Kožne jakne',
    intro: 'Kožne jakne izrađene po vašim merama i vašoj ideji.',
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
