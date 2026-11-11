/** A selectable task category with its badge color. */
export interface CategoryOption {
  name: string;
  color: string;
}

/** All task categories (name shown in the UI and background color of the category tag). */
export const CATEGORIES: CategoryOption[] = [
  {
    name: 'User Story',
    color: '#0038FF',
  },
  {
    name: 'Technical Task',
    color: '#1FD7C1',
  },
];
