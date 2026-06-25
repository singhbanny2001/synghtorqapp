import type { VehicleIconVariant } from '@/mocks/deviceIcons';

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  status: 'moving' | 'stopped' | 'idle';
  ignition: boolean;
  heading: number;
  odometer: number;
  fuelLevel: number;
}

export interface PlaybackVehicle {
  id: string;
  name: string;
  plateNumber: string;
  driver: string;
  image: string;
  vehicleType: VehicleIconVariant;
  trail: GPSPoint[];
}

export type EventType =
  | 'start'
  | 'stop'
  | 'idle'
  | 'ignition_on'
  | 'ignition_off'
  | 'overspeed'
  | 'geofence_enter'
  | 'geofence_exit'
  | 'fuel_refill'
  | 'theft'
  | 'immobilization'
  | 'fuel_level'
  | 'alert';

export interface PlaybackEvent {
  trailIndex: number;
  type: EventType;
  label: string;
  detail?: string;
  lat: number;
  lng: number;
  time: string;
}

function generateTrail(
  startLat: number,
  startLng: number,
  waypoints: Array<[number, number]>,
  baseTime: Date,
  speeds: number[]
): GPSPoint[] {
  const points: GPSPoint[] = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let odometer = 8746;
  let time = new Date(baseTime);
  let fuelLevel = 45;

  for (let i = 0; i < waypoints.length; i++) {
    const [targetLat, targetLng] = waypoints[i];
    const steps = 8 + Math.floor(Math.random() * 6);
    const latStep = (targetLat - currentLat) / steps;
    const lngStep = (targetLng - currentLng) / steps;

    for (let s = 0; s <= steps; s++) {
      const lat = currentLat + latStep * s;
      const lng = currentLng + lngStep * s;
      const speed = s === steps && i < waypoints.length - 1 ? speeds[i] : s === 0 && i > 0 ? 0 : speeds[i] + (Math.random() * 10 - 5);
      const status = speed > 5 ? 'moving' : speed === 0 ? 'stopped' : 'idle';
      const ignition = status !== 'stopped' || Math.random() > 0.3;

      // Simulate fuel burn (~8-12 km/L)
      const kmDriven = speed * 0.001;
      fuelLevel = Math.max(0, fuelLevel - kmDriven / 10);

      points.push({
        lat,
        lng,
        timestamp: time.toISOString(),
        speed: Math.max(0, Math.round(speed)),
        status,
        ignition,
        heading: Math.round(Math.atan2(lngStep, latStep) * (180 / Math.PI)),
        odometer: Math.round(odometer + (speed * 0.0001) * 100) / 100,
        fuelLevel: Math.round(fuelLevel * 10) / 10,
      });

      time = new Date(time.getTime() + 3 * 60000 + Math.floor(Math.random() * 120000));
    }

    currentLat = targetLat;
    currentLng = targetLng;
  }

  // Inject fuel refills at roughly quarter and two-thirds through the trail
  const refillIndices = [Math.floor(points.length / 4), Math.floor((points.length * 2) / 3)];
  for (const idx of refillIndices) {
    if (idx > 0 && idx < points.length) {
      for (let j = idx; j < points.length; j++) {
        points[j].fuelLevel = Math.min(60, points[j].fuelLevel + (j === idx ? 20 : 0));
      }
    }
  }

  return points;
}

function formatTrailTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const todayBase = new Date('2026-05-24T06:00:00');

const v1Trail = generateTrail(
  40.7357, -74.1724,
  [
    [40.7500, -74.1500],
    [40.7600, -74.1200],
    [40.7400, -74.0800],
    [40.7200, -74.0500],
    [40.7000, -74.0400],
    [40.6800, -74.0600],
    [40.6700, -74.1000],
    [40.6900, -74.1300],
    [40.7100, -74.1500],
    [40.7357, -74.1724],
  ],
  todayBase,
  [65, 72, 68, 70, 55, 45, 60, 58, 62, 50]
);

const v2Trail = generateTrail(
  40.3573, -74.6672,
  [
    [40.3800, -74.6500],
    [40.4000, -74.6200],
    [40.4200, -74.5800],
    [40.4100, -74.5400],
    [40.3900, -74.5200],
    [40.3700, -74.5500],
    [40.3600, -74.6000],
    [40.3500, -74.6400],
    [40.3573, -74.6672],
  ],
  todayBase,
  [55, 60, 58, 62, 50, 48, 52, 55, 45]
);

const v3Trail = generateTrail(
  40.2206, -74.7597,
  [
    [40.2300, -74.7400],
    [40.2400, -74.7100],
    [40.2500, -74.6800],
    [40.2450, -74.6500],
    [40.2350, -74.6300],
    [40.2250, -74.6600],
    [40.2200, -74.7000],
    [40.2150, -74.7300],
    [40.2206, -74.7597],
  ],
  todayBase,
  [40, 35, 38, 30, 25, 32, 28, 35, 30]
);

const v4Trail = generateTrail(
  40.6368, -74.9153,
  [
    [40.6500, -74.8900],
    [40.6600, -74.8500],
    [40.6550, -74.8100],
    [40.6400, -74.7800],
    [40.6300, -74.8000],
    [40.6250, -74.8400],
    [40.6300, -74.8800],
    [40.6368, -74.9153],
  ],
  todayBase,
  [50, 55, 48, 52, 45, 50, 55, 48]
);

const v5Trail = generateTrail(
  40.2000, -74.0200,
  [
    [40.2200, -74.0000],
    [40.2400, -73.9800],
    [40.2600, -73.9600],
    [40.2500, -73.9400],
    [40.2300, -73.9300],
    [40.2100, -73.9500],
    [40.2000, -73.9800],
    [40.1900, -74.0000],
    [40.2000, -74.0200],
  ],
  todayBase,
  [80, 85, 82, 88, 75, 78, 80, 72, 70]
);

const v6Trail = generateTrail(
  40.5073, -74.6400,
  [
    [40.5100, -74.6200],
    [40.5200, -74.6000],
    [40.5300, -74.5800],
    [40.5250, -74.5600],
    [40.5150, -74.5700],
    [40.5050, -74.5900],
    [40.5000, -74.6100],
    [40.5073, -74.6400],
  ],
  todayBase,
  [45, 50, 48, 42, 38, 40, 44, 46]
);

export const playbackVehicles: PlaybackVehicle[] = [
  {
    id: 'v1',
    name: 'TK-101',
    plateNumber: 'FL-2024-01',
    driver: 'Marcus Johnson',
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20red%20Mercedes-Benz%20Sprinter%20commercial%20delivery%20van%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=128&height=128&seq=latest-playback-v101&orientation=squarish',
    vehicleType: 'van',
    trail: v1Trail,
  },
  {
    id: 'v2',
    name: 'ISABELA 04',
    plateNumber: 'TK-102',
    driver: 'Sarah Chen',
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20dark%20blue%20Ford%20Transit%20350%20cargo%20van%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=128&height=128&seq=latest-playback-v102&orientation=squarish',
    vehicleType: 'van',
    trail: v2Trail,
  },
  {
    id: 'v3',
    name: 'TK-103',
    plateNumber: 'FL-2024-03',
    driver: 'David Park',
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20vibrant%20green%20Volvo%20FM%20heavy%20duty%20semi%20truck%20tractor%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=128&height=128&seq=latest-playback-v103&orientation=squarish',
    vehicleType: 'truck',
    trail: v3Trail,
  },
  {
    id: 'v4',
    name: 'TK-104',
    plateNumber: 'FL-2024-04',
    driver: 'Robert Miller',
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20orange%20Mercedes-Benz%20Actros%201845%20heavy%20duty%20tractor%20truck%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=128&height=128&seq=latest-playback-v104&orientation=squarish',
    vehicleType: 'truck',
    trail: v4Trail,
  },
  {
    id: 'v5',
    name: 'TK-105',
    plateNumber: 'FL-2024-05',
    driver: 'Lisa Wang',
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20deep%20metallic%20red%20Tesla%20Model%203%20sedan%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=128&height=128&seq=latest-playback-v105&orientation=squarish',
    vehicleType: 'sedan',
    trail: v5Trail,
  },
  {
    id: 'v6',
    name: 'TK-106',
    plateNumber: 'FL-2024-06',
    driver: 'James Wilson',
    image: 'https://readdy.ai/api/search-image?query=2026%20premium%203D%20fleet%20vehicle%20render%20of%20a%20bright%20yellow%20Rivian%20R1T%20electric%20pickup%20truck%2C%20three-quarter%20front%20view%2C%20clean%20white%20studio%20background%2C%20soft%20floor%20shadow%2C%20modern%20enterprise%20fleet%20management%20SaaS%20visual%2C%20ultra%20sharp%2C%20high-end%20automotive%20CGI&width=128&height=128&seq=latest-playback-v106&orientation=squarish',
    vehicleType: 'pickup',
    trail: v6Trail,
  },
];

function buildTelemetryEvents(trail: GPSPoint[]): PlaybackEvent[] {
  const events: PlaybackEvent[] = [];
  let lastStatus = '';
  let lastIgnition = true;

  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const timeStr = formatTrailTime(p.timestamp);

    if (i === 0) {
      events.push({
        trailIndex: i,
        time: timeStr,
        type: 'start',
        label: 'Trip started',
        lat: p.lat,
        lng: p.lng,
      });
    }

    if (p.status !== lastStatus) {
      if (p.status === 'stopped' && lastStatus === 'moving') {
        events.push({
          trailIndex: i,
          time: timeStr,
          type: 'stop',
          label: 'Vehicle stopped',
          lat: p.lat,
          lng: p.lng,
        });
      } else if (p.status === 'moving' && (lastStatus === 'stopped' || lastStatus === 'idle')) {
        events.push({
          trailIndex: i,
          time: timeStr,
          type: 'start',
          label: 'Vehicle resumed',
          lat: p.lat,
          lng: p.lng,
        });
      } else if (p.status === 'idle' && lastStatus === 'moving') {
        events.push({
          trailIndex: i,
          time: timeStr,
          type: 'idle',
          label: 'Vehicle idling',
          lat: p.lat,
          lng: p.lng,
        });
      }
      lastStatus = p.status;
    }

    if (p.ignition !== lastIgnition) {
      events.push({
        trailIndex: i,
        time: timeStr,
        type: p.ignition ? 'ignition_on' : 'ignition_off',
        label: p.ignition ? 'Ignition ON' : 'Ignition OFF',
        lat: p.lat,
        lng: p.lng,
      });
      lastIgnition = p.ignition;
    }

    if (p.speed > 80) {
      events.push({
        trailIndex: i,
        time: timeStr,
        type: 'overspeed',
        label: `Overspeed: ${p.speed} km/h`,
        lat: p.lat,
        lng: p.lng,
      });
    }

    if (i === trail.length - 1) {
      events.push({
        trailIndex: i,
        time: timeStr,
        type: 'stop',
        label: 'Trip ended',
        lat: p.lat,
        lng: p.lng,
      });
    }
  }

  return events;
}

function addSpecialEvents(trail: GPSPoint[], baseEvents: PlaybackEvent[]): PlaybackEvent[] {
  const events = [...baseEvents];
  const used = new Set(events.map((e) => e.trailIndex));

  const injectAt = (index: number, evt: Omit<PlaybackEvent, 'trailIndex' | 'time' | 'lat' | 'lng'>) => {
    if (index >= 0 && index < trail.length && !used.has(index)) {
      const p = trail[index];
      used.add(index);
      events.push({
        trailIndex: index,
        time: formatTrailTime(p.timestamp),
        lat: p.lat,
        lng: p.lng,
        ...evt,
      });
    }
  };

  const mid = Math.floor(trail.length / 2);
  const quarter = Math.floor(trail.length / 4);
  const third = Math.floor(trail.length / 3);
  const twoThirds = Math.floor((trail.length * 2) / 3);

  // Fuel refill
  injectAt(quarter, {
    type: 'fuel_refill',
    label: 'Fuel Refilled',
    detail: '+35 L',
  });

  // Fuel level drop
  injectAt(mid, {
    type: 'fuel_level',
    label: 'Fuel Level Low',
    detail: '12 L remaining',
  });

  // Theft alert
  injectAt(third + 3, {
    type: 'theft',
    label: 'Theft Detected',
    detail: '-8.5 L fuel',
  });

  // Immobilization
  injectAt(twoThirds, {
    type: 'immobilization',
    label: 'Immobilized',
    detail: 'Engine cut off remotely',
  });

  // General alert (overspeed area)
  injectAt(quarter + 5, {
    type: 'alert',
    label: 'Alert',
    detail: 'Harsh braking detected',
  });

  // Another fuel refill near end
  injectAt(twoThirds + 4, {
    type: 'fuel_refill',
    label: 'Fuel Refilled',
    detail: '+20 L',
  });

  // Geofence enter
  injectAt(8, {
    type: 'geofence_enter',
    label: 'Entered Geofence',
    detail: 'Warehouse Zone A',
  });

  // Geofence exit
  injectAt(trail.length - 8, {
    type: 'geofence_exit',
    label: 'Exited Geofence',
    detail: 'Warehouse Zone A',
  });

  return events.sort((a, b) => a.trailIndex - b.trailIndex);
}

export function getVehicleEvents(trail: GPSPoint[]): PlaybackEvent[] {
  const base = buildTelemetryEvents(trail);
  return addSpecialEvents(trail, base);
}

export function getTrailStats(trail: GPSPoint[]) {
  const totalDistance = trail.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = trail[i - 1];
    const dLat = (p.lat - prev.lat) * 111;
    const dLng = (p.lng - prev.lng) * 111 * Math.cos((p.lat * Math.PI) / 180);
    return sum + Math.sqrt(dLat * dLat + dLng * dLng);
  }, 0);

  const startTime = new Date(trail[0].timestamp);
  const endTime = new Date(trail[trail.length - 1].timestamp);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  const avgSpeed = trail.reduce((sum, p) => sum + p.speed, 0) / trail.length;
  const maxSpeed = Math.max(...trail.map((p) => p.speed));
  const stops = trail.filter((p) => p.status === 'stopped').length;

  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    durationHours: Math.round(durationHours * 10) / 10,
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    maxSpeed,
    stops,
    pointCount: trail.length,
  };
}
