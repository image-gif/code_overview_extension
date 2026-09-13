export type StructItem = {
  name: string;
  location: any;
  kind: number;
  children?: SymbolItem[];
}

export type SymbolItem = {
  kinds: number[];
  label: string;
  children: StructItem[];
}

