import { Event } from "../types";

export const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Addis Music Fest 2024",
    description:
      "A vibrant concert featuring top Ethiopian artists at Meskel Square.",

    date: "2024-05-20T18:00:00.000Z",
    event_date: "2024-05-20",

    location: "Meskel Square, Addis Ababa",

    latitude: 9.0108,
    longitude: 38.7613,

    ticket_price: 500,
    price: 500,

    total_tickets: 1000,
    selling_deadline: "2024-05-18T00:00:00.000Z",

    event_type: "Adult Music",

    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80"
  },

  {
    id: "2",
    title: "Ethio Tech Summit",
    description:
      "Discover the latest innovations in the Ethiopian tech ecosystem.",

    date: "2024-06-12T09:00:00.000Z",
    event_date: "2024-06-12",

    location: "Millennium Hall, Addis Ababa",

    latitude: 9.0222,
    longitude: 38.7468,

    ticket_price: 300,
    price: 300,

    total_tickets: 800,
    selling_deadline: "2024-06-10T00:00:00.000Z",

    event_type: "Conference",

    image_url:
      "https://images.unsplash.com/photo-1540575861501-7ad0582373f1?auto=format&fit=crop&q=80"
  },

  {
    id: "3",
    title: "Habesha Cultural Night",
    description:
      "Experience Ethiopian culture through music, dance, and food.",

    date: "2024-05-25T19:00:00.000Z",
    event_date: "2024-05-25",

    location: "Skylight Hotel, Addis Ababa",

    latitude: 9.0037,
    longitude: 38.7636,

    ticket_price: 800,
    price: 800,

    total_tickets: 500,
    selling_deadline: "2024-05-23T00:00:00.000Z",

    event_type: "Kid Program",

    image_url:
      "https://images.unsplash.com/photo-1530549387631-6c129c1abc7a?auto=format&fit=crop&q=80"
  }
];