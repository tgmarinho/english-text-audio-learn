export type Item = {
  id: string;
  title: string;
  mdPath: string;
  audioPath: string | null;
};

export type Collection = {
  slug: string;
  title: string;
  count: number;
  items: Item[];
};

export type Catalog = {
  collections: Collection[];
};
