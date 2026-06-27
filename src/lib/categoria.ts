// Categorías de producto. El `value` coincide con el enum del backend; el
// `label` es lo que ve el usuario. Única fuente de verdad para selects y badges.
export const CATEGORIA_OPTIONS = [
  { value: 'ZAPATILLAS', label: 'Zapatillas' },
  { value: 'PRENDAS',    label: 'Prendas' },
  { value: 'GORRAS',     label: 'Gorras' },
  { value: 'MOCHILAS',   label: 'Mochilas y bolsos' },
] as const;

const LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIA_OPTIONS.map((c) => [c.value, c.label]),
);

/** Etiqueta legible de una categoría; si no matchea el enum, devuelve el valor crudo. */
export function categoriaLabel(value?: string | null): string {
  if (!value) return '';
  return LABELS[value] ?? value;
}
