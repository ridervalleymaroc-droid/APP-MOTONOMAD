export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'ACCOUNTING';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  country: string;
  passportNumber: string;
  passportExpiry: string;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpiry: string;
  licenseCategory: string; // e.g. "A", "A2"
  emergencyContact: string;
  notes?: string;
  passportUrl?: string;
  licenseUrl?: string;
  totalSpent: number;
  bookingsCount: number;
  avgBookingValue: number;
  lifetimeValue: number;
  damageHistory?: { date: string; motorcycleId: string; description: string; cost: number }[];
  createdAt: string;
  createdBy: string;
}

export type MotorcycleStatus = 
  | 'Available' 
  | 'Reserved' 
  | 'Rented' 
  | 'Maintenance' 
  | 'Damaged' 
  | 'Out of service' 
  | 'Sold';

export type MotorcycleCategory = 'Adventure' | 'Enduro' | 'Touring' | 'Scrambler' | 'Trail';

export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  registrationNumber: string;
  vin: string;
  color: string;
  category: MotorcycleCategory;
  engineSize: number; // cc
  purchaseDate: string;
  purchasePrice: number;
  residualValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'Straight-line' | 'Declining Balance';
  currentMileage: number;
  currentStatus: MotorcycleStatus;
  currentLocation: string;
  supplier: string;
  insuranceCompany: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  techInspectionExpiry: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  depositAmount: number;
  notes?: string;
  photos: string[];
  totalRevenue: number;
  totalMaintenanceCost: number;
  currentBookValue: number;
  estimatedMarketValue: number;
  createdAt: string;
}

export type ReservationStatus = 
  | 'Inquiry' 
  | 'Quote' 
  | 'Pending' 
  | 'Confirmed' 
  | 'Ready' 
  | 'Active' 
  | 'Returned' 
  | 'Closed' 
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Partial' | 'Paid' | 'Refunded';

export type BookingSource = 'Direct' | 'Website' | 'Agency' | 'WhatsApp' | 'Walk-in';

export interface HandoverDetails {
  date: string;
  mileage: number;
  fuelLevelPercentage: number;
  conditionNotes: string;
  tiresOk: boolean;
  brakesOk: boolean;
  lightsOk: boolean;
  chainOk: boolean;
  scratchesDamage: string;
  equipmentIncluded: string[];
  photosUrl?: string[];
  customerSignature?: string;
  employeeSignature?: string;
  additionalCharges?: number;
  notes?: string;
}

export interface Reservation {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  motorcycleId: string;
  motorcycleName: string;
  regNumber: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  rentalDays: number;
  pickupLocation: string;
  dropoffLocation: string;
  basePrice: number;
  extrasPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
  depositAmount: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  bookingSource: BookingSource;
  responsibleEmployee: string;
  status: ReservationStatus;
  notes?: string;
  contractUrl?: string;
  checkoutInfo?: HandoverDetails;
  checkinInfo?: HandoverDetails;
  createdAt: string;
}

export type RevenueCategory = 'Rental' | 'Tour' | 'Equipment' | 'Delivery' | 'Damage' | 'Other';

export interface Revenue {
  id: string;
  date: string;
  category: RevenueCategory;
  amount: number;
  currency: 'MAD' | 'EUR' | 'USD';
  description: string;
  relatedMotorcycleId?: string;
  relatedReservationId?: string;
  relatedTourId?: string;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'WhatsApp Pay';
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Maintenance' 
  | 'Fuel' 
  | 'Insurance' 
  | 'Salaries' 
  | 'Marketing' 
  | 'Office' 
  | 'Transportation' 
  | 'Hotels' 
  | 'Guides' 
  | 'Suppliers' 
  | 'Equipment' 
  | 'Other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  currency: 'MAD' | 'EUR' | 'USD';
  description: string;
  relatedMotorcycleId?: string;
  relatedReservationId?: string;
  relatedTourId?: string;
  supplier?: string;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Company Card';
  invoiceUrl?: string;
  createdBy: string;
  createdAt: string;
}

export type ServiceType = 
  | 'Oil Service' 
  | 'Tires' 
  | 'Brakes' 
  | 'Chain' 
  | 'Battery' 
  | 'Filters' 
  | 'Major Service' 
  | 'Repair' 
  | 'Accident' 
  | 'Other';

export interface MaintenanceRecord {
  id: string;
  motorcycleId: string;
  motorcycleName: string;
  regNumber: string;
  serviceDate: string;
  mileage: number;
  serviceType: ServiceType;
  description: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  workshopSupplier: string;
  nextServiceDate: string;
  nextServiceMileage: number;
  documents?: string[];
  notes?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  createdAt: string;
}

export type InvestmentType = 'Motorcycle' | 'Equipment' | 'Infrastructure' | 'Marketing' | 'Technology' | 'Other';

export interface Investment {
  id: string;
  title: string;
  investmentType: InvestmentType;
  date: string;
  supplier: string;
  purchasePrice: number;
  additionalCosts: number;
  totalInvestment: number;
  expectedUsefulLifeYears: number;
  expectedRevenuePerMonth: number;
  actualRevenue: number;
  operatingCosts: number;
  currentEstimatedValue: number;
  status: 'Active' | 'Under Review' | 'Completed' | 'Sold';
  notes?: string;
  createdAt: string;
}

export type TourStatus = 'Draft' | 'Open' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Tour {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  route: string;
  durationDays: number;
  maxRiders: number;
  minRiders: number;
  pricePerRider: number;
  guideName: string;
  status: TourStatus;
  notes?: string;
  itinerary: { day: number; title: string; distanceKm: number; description: string; accommodation: string }[];
  coverPhoto?: string;
  createdAt: string;
}

export interface TourParticipant {
  id: string;
  tourId: string;
  tourName: string;
  clientId: string;
  clientName: string;
  motorcycleId?: string;
  motorcycleName?: string;
  price: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  emergencyContact: string;
  ridingGearAssigned?: string;
  status: 'Inquired' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export type EquipmentType = 
  | 'Helmet' 
  | 'Phone Holder' 
  | 'Wireless Charger' 
  | 'Top Case' 
  | 'Side Cases' 
  | 'GPS' 
  | 'Intercom' 
  | 'Riding Jacket' 
  | 'Riding Pants' 
  | 'Gloves' 
  | 'Boots' 
  | 'Other';

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  brand: string;
  model: string;
  serialNumber: string;
  purchasePrice: number;
  purchaseDate: string;
  condition: 'New' | 'Good' | 'Fair' | 'Needs Repair' | 'Retired';
  status: 'Available' | 'Assigned Customer' | 'Assigned Motorcycle' | 'Maintenance' | 'Lost';
  assignedMotorcycleId?: string;
  assignedClientId?: string;
  dailyPrice: number;
  createdAt: string;
}

export interface Agency {
  id: string;
  agencyName: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsapp: string;
  commissionPercentage: number;
  contractUrl?: string;
  paymentTerms: string;
  totalBookings: number;
  totalRevenue: number;
  outstandingPayments: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  category: 'Parts & Workshop' | 'Hotels & Lodging' | 'Equipment & Gear' | 'Insurance' | 'Fuel & Logistics' | 'Marketing' | 'Other';
  contactPerson: string;
  phone: string;
  email: string;
  productsServices: string;
  totalPurchases: number;
  outstandingPayments: number;
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  type: 'reservation_start' | 'reservation_return' | 'maintenance_due' | 'insurance_expiring' | 'inspection_expiring' | 'payment_due' | 'tour_min_riders' | 'low_roi';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordId: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export type AuditLog = AuditLogItem;

export interface BusinessSettings {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  defaultCurrency: 'MAD' | 'EUR' | 'USD';
  EURToMADRate: number; // e.g. 10.8
  USDToMADRate: number; // e.g. 9.8
  taxRate: number; // e.g. 20%
  depositPolicy: string;
  rentalTerms: string;
  defaultUsefulLifeYears: number;
  defaultResidualValuePercent: number;
  updatedAt: string;
}

export type DateFilterRange = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all' | 'custom';
