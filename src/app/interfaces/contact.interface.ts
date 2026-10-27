export interface ContactInterface {
  id: number;
  title?: string | null; // null if no title
  firstname: string;
  surname: string;
  mail: string;
  phone: string;
  badge_color: string;
}
