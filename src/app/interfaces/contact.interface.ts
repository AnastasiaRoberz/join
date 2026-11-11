/** A contact as stored in the `contacts` table. */
export interface ContactInterface {
  id: number;
  title?: string | null; // null if no title
  firstname: string;
  surname: string;
  mail: string;
  phone: string;
  /** HSL background color of the avatar badge. */
  badge_color: string;
  /** Id of the linked Supabase auth user (only for registered users). */
  user_uid?: string;
}
