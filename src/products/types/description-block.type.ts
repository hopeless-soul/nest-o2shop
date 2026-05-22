export type DescriptionBlock =
  | { type: 'text'; content: string }
  | { type: 'points'; items: string[] };

export interface ProductDescription {
  blocks: DescriptionBlock[];
}
