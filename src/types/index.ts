export type RequestStatus = "PENDING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface Truck {
  id: string;
  plate: string;
  maxCapacity: number;
  fuelConsumption: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransportRequest {
  id: string;
  requesterName: string;
  requesterPhone: string | null;
  cattleCount: number;
  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  status: RequestStatus;
  assignedTruckId: string | null;
  assignedTruck: Truck | null;
  distanceKm: number | null;
  fuelCost: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
