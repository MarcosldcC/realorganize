export interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  code: string
  totalMeters: number
  pricePerMeter: number
  createdAt: Date
  updatedAt: Date
}

export interface Accessory {
  id: string
  name: string
  code: string
  totalQty: number
  pricePerUnit: number
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  document?: string
  company?: string
  logoUrl?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}



export interface Booking {
  id: string
  clientId: string
  userId: string
  client: Client
  user: User
  startDate: Date
  endDate: Date
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'HOLD' | 'RETURNED'
  eventTitle: string
  eventAddress: string
  totalPrice: number
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  notes?: string
  createdAt: Date
  updatedAt: Date
  items: BookingItem[]
  accessories: BookingAccessory[]
}

export interface BookingItem {
  id: string
  bookingId: string
  productId: string
  meters: number
  price: number
  product: Product
}

export interface BookingAccessory {
  id: string
  bookingId: string
  accessoryId: string
  qty: number
  price: number
  accessory: Accessory
}



export interface CompanySetting {
  id: string
  name: string
  document: string
  email: string
  phone: string
  address: string
  logoUrl?: string
}

export interface AvailabilityData {
  day: string
  productCode: string
  productName: string
  metersBooked: number
  metersAvailable: number
}

export interface AccessoryAvailabilityData {
  day: string
  accessoryCode: string
  accessoryName: string
  qtyBooked: number
  qtyAvailable: number
}

export interface FinancialReport {
  month: string
  totalRevenue: number
  totalReceived: number
  totalBookings: number
  pendingAmount: number
  overdueAmount: number
}

export interface DashboardKPIs {
  totalBookings: number
  futureBookings: number
  confirmedBookings: number
  holdBookings: number
  totalRevenue: number
  receivedAmount: number
  pendingAmount: number
  overdueAmount: number
}
