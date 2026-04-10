import { Event, Ticket, User, PaymentSetting, Payment } from '../types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Addis Music Festival 2024',
    description: 'The biggest music event in the heart of Addis Ababa featuring top local and international artists.',
    date: '2024-12-15',
    event_date: '2024-12-15',
    location: 'Millennium Hall, Addis Ababa',
    ticket_price: 500,
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
    latitude: 9.02497,
    longitude: 38.74689,
    total_tickets: 5000,
    selling_deadline: '2024-12-14T23:59:59Z',
    event_type: 'Music',
    organizer_id: 'admin1',
    created_by: 'admin1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Ethio Tech Summit',
    description: 'Join industry leaders and innovators for a two-day summit exploring the future of technology in Ethiopia.',
    date: '2024-11-20',
    event_date: '2024-11-20',
    location: 'Skylight Hotel, Addis Ababa',
    ticket_price: 1200,
    image_url: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f1?auto=format&fit=crop&q=80',
    latitude: 9.0105,
    longitude: 38.7615,
    total_tickets: 1000,
    selling_deadline: '2024-11-19T23:59:59Z',
    event_type: 'Technology',
    organizer_id: 'admin1',
    created_by: 'admin1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Great Ethiopian Run',
    description: 'Participate in the legendary Great Ethiopian Run, a celebration of fitness and culture.',
    date: '2024-11-17',
    event_date: '2024-11-17',
    location: 'Meskel Square, Addis Ababa',
    ticket_price: 300,
    image_url: 'https://images.unsplash.com/photo-1530549387631-6c129c1abc7a?auto=format&fit=crop&q=80',
    latitude: 9.0105,
    longitude: 38.7615,
    total_tickets: 30000,
    selling_deadline: '2024-11-16T23:59:59Z',
    event_type: 'Sports',
    organizer_id: 'admin1',
    created_by: 'admin1',
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    user_id: 'u1',
    event_id: '1',
    eventId: '1',
    userName: 'Abebe Bikila',
    userPhone: '+251911223344',
    quantity: 2,
    status: 'active',
    transactionId: 'TX123456',
    paymentMethod: 'telebirr',
    qrCodeData: 'KISTET-T1-APPROVED',
    purchaseDate: '2024-10-01',
    payment_id: 'p1'
  },
  {
    id: 't2',
    user_id: 'u2',
    event_id: '1',
    eventId: '1',
    userName: 'Almaz Ayana',
    userPhone: '+251922334455',
    quantity: 1,
    status: 'pending',
    transactionId: 'TX789012',
    paymentMethod: 'cbe',
    qrCodeData: 'KISTET-T2-PENDING',
    purchaseDate: '2024-10-02',
    payment_id: 'p2'
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'p1',
    user_id: 'u1',
    event_id: '1',
    amount: 1000,
    method: 'telebirr',
    transaction_id: 'TX123456',
    status: 'approved',
    created_at: '2024-10-01T10:00:00Z'
  },
  {
    id: 'p2',
    user_id: 'u2',
    event_id: '1',
    amount: 500,
    method: 'cbe',
    transaction_id: 'TX789012',
    status: 'pending',
    created_at: '2024-10-02T11:00:00Z'
  }
];

export const MOCK_PAYMENT_SETTINGS: PaymentSetting[] = [
  {
    id: 's1',
    method: 'telebirr',
    account_name: 'Kistet Event Management',
    account_number: '0911223344',
    instructions: 'Please include your phone number in the reason field.',
    is_active: true,
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 's2',
    method: 'cbe',
    account_name: 'Kistet Event Management PLC',
    account_number: '1000123456789',
    instructions: 'Transfer to our CBE account and submit the transaction ID.',
    is_active: true,
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 's3',
    method: 'mpesa',
    account_name: 'Kistet Events',
    account_number: '0711223344',
    instructions: 'Pay via M-PESA merchant till number 123456.',
    is_active: true,
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'KistetAddis',
    username: 'kistetaddis',
    role: 'admin'
  },
  {
    id: 'org1',
    name: 'organizer_one',
    username: 'organizer1',
    role: 'organizer',
    assignedEventIds: ['1', '3']
  }
];