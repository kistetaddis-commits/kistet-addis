export interface Event {
  id: string;

  title: string;
  description: string;

  date: string;        // required
  location: string;

  price: number;       // required

  imageUrl?: string;
}