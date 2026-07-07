import { ValueTransformer } from 'typeorm';

// TypeORM's ValueTransformer methods are typed `(value: any) => any`, so an inline
// `{ to, from }` literal at each @Column infers its params as `any`. Typing these
// once here keeps every decimal column's to/from parameters and return values sound.
export const decimalTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => parseFloat(value),
};

export const nullableDecimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value: string | null) => (value == null ? value : parseFloat(value)),
};
