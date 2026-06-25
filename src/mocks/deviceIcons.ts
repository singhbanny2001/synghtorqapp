export type VehicleIconVariant =
  | 'person_tracker'
  | 'baby_tracker'
  | 'pet_tracker'
  | 'asset_tracker'
  | 'bike'
  | 'motorcycle'
  | 'sport_bike'
  | 'ebike'
  | 'scooter'
  | 'moped'
  | 'hatchback'
  | 'sedan'
  | 'coupe'
  | 'wagon'
  | 'suv'
  | 'jeep'
  | 'van'
  | 'minivan'
  | 'pickup'
  | 'box_truck'
  | 'ambulance'
  | 'canter'
  | 'truck'
  | 'dump_truck'
  | 'tanker'
  | 'bus'
  | 'coach'
  | 'trailer';

export interface IconOption {
  id: VehicleIconVariant;
  label: string;
  category: 'personal' | 'two-wheeler' | 'car' | 'heavy' | 'commercial';
  description: string;
}

export interface DeviceConfig {
  vehicleId: string;
  iconVariant: VehicleIconVariant;
  displayName: string;
  plateNumber: string;
  odometer: number;
  heading: number;
  category: 'personal' | 'two-wheeler' | 'car' | 'heavy' | 'commercial';
}

export const iconOptions: IconOption[] = [
  { id: 'person_tracker', label: 'Person', category: 'personal', description: 'GPS tracker for people and staff safety' },
  { id: 'baby_tracker', label: 'Child', category: 'personal', description: 'Child safety GPS tracker' },
  { id: 'pet_tracker', label: 'Pet', category: 'personal', description: 'Pet GPS tracker' },
  { id: 'bike', label: 'Bike', category: 'two-wheeler', description: 'Slim bike profile for light delivery tracking' },
  { id: 'motorcycle', label: 'Motorcycle', category: 'two-wheeler', description: 'Standard motorcycle for riders and couriers' },
  { id: 'sedan', label: 'Sedan', category: 'car', description: 'Mid-size sedan, balanced proportions' },
  { id: 'suv', label: 'SUV', category: 'car', description: 'Large SUV, commanding road presence' },
  { id: 'van', label: 'Van', category: 'commercial', description: 'Cargo/passenger van, enclosed body' },
  { id: 'pickup', label: 'Pickup', category: 'commercial', description: 'Pickup truck with open cargo bed' },
  { id: 'truck', label: 'Truck', category: 'heavy', description: 'Heavy-duty truck with long trailer' },
  { id: 'trailer', label: 'Trailer', category: 'heavy', description: 'Semi-trailer, cargo container' },
];

export function getIconsByCategory(category: 'personal' | 'two-wheeler' | 'car' | 'heavy' | 'commercial'): IconOption[] {
  return iconOptions.filter((o) => o.category === category);
}

export const categoryLabels: Record<string, string> = {
  personal: 'Personal/Pet',
  'two-wheeler': 'Two-Wheelers',
  car: 'Cars',
  commercial: 'Commercial',
  heavy: 'Heavy Vehicles',
};
