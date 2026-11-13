import { auth } from "@/lib/auth/server";
import type { AddressFieldsValue } from "@/lib/format/address";
import { addressSignature, destinationsSignature, routable, type RouteEstimate } from "@/lib/trips/route";

// Portado do serviço de estimativa do Nodus. Os serviços públicos do
// OpenStreetMap são de demonstração; numa instalação própria configure
// GEOCODER_BASE_URL, GEOCODER_USER_AGENT e ROUTING_BASE_URL.
type Point = { lat: number; lon: number };
const coordinates = new Map<string, { point: Point; expires: number }>();
let geocodeQueue: Promise<unknown> = Promise.resolve();
let nextGeocodeAt = 0;
const addressKeys = ["postalCode", "street", "number", "complement", "neighborhood", "city", "state"] as const;

function geocoderRequest(url: string) {
  // Nominatim pede no máximo uma requisição por segundo.
  const request = geocodeQueue.then(async () => {
    const delay = Math.max(0, nextGeocodeAt - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    nextGeocodeAt = Date.now() + 1100;
    return fetch(url, {
      headers: { "User-Agent": process.env.GEOCODER_USER_AGENT || "TravelEstimate/1.0 (trip planning)", "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(10_000),
    });
  });
  geocodeQueue = request.catch(() => undefined);
  return request;
}

async function geocode(address: AddressFieldsValue): Promise<Point> {
  const signature = addressSignature(address);
  const cached = coordinates.get(signature);
  if (cached && cached.expires > Date.now()) return cached.point;
  const url = new URL(`${(process.env.GEOCODER_BASE_URL || "https://nominatim.openstreetmap.org").replace(/\/$/, "")}/search`);
  url.searchParams.set("format", "jsonv2"); url.searchParams.set("limit", "1"); url.searchParams.set("countrycodes", "br");
  url.searchParams.set("q", [address.street, address.number, address.neighborhood, address.city, address.state, address.postalCode, "Brasil"].filter(Boolean).join(", "));
  const response = await geocoderRequest(url.href);
  if (!response.ok) throw new Error("Serviço de localização indisponível.");
  const results = await response.json() as { lat?: string; lon?: string }[];
  const point = { lat: Number(results[0]?.lat), lon: Number(results[0]?.lon) };
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) throw new Error("Não foi possível localizar um dos endereços. Confira CEP, rua e cidade.");
  coordinates.set(signature, { point, expires: Date.now() + 30 * 86400000 });
  return point;
}

function straightLineKm(a: Point, b: Point) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitude = radians(b.lat - a.lat); const longitude = radians(b.lon - a.lon);
  const arc = Math.sin(latitude / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

function cleanAddress(value: unknown): AddressFieldsValue | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(addressKeys.map(key => [key, typeof source[key] === "string" ? (source[key] as string).slice(0, 300) : ""]));
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response("Sua sessão expirou. Entre novamente.", { status: 401 });
  let body: { origin?: unknown; destinations?: unknown; transport?: unknown; roundTrip?: unknown };
  try { body = await request.json(); } catch { return new Response("Dados inválidos.", { status: 400 }); }
  const origin = cleanAddress(body.origin);
  const destinations = Array.isArray(body.destinations) ? body.destinations.slice(0, 20).map(cleanAddress) : [];
  const transport = typeof body.transport === "string" ? body.transport : "car";
  const roundTrip = body.roundTrip === true;
  if (!origin || !routable(origin)) return new Response("Cadastre o endereço de origem em Configurações › Empresa.", { status: 400 });
  if (!destinations.length || destinations.some(item => !item || !routable(item))) return new Response("Informe cidade e rua ou CEP em cada visita.", { status: 400 });
  const stops = destinations as AddressFieldsValue[];
  try {
    const points = await Promise.all([origin, ...stops].map(geocode));
    const route = roundTrip ? [...points, points[0]] : points;
    let distanceKm = route.slice(1).reduce((total, point, index) => total + straightLineKm(route[index], point), 0);
    let durationMinutes: number;
    let method: RouteEstimate["method"] = "approximate";
    if (transport !== "plane" && transport !== "ship") {
      try {
        const url = new URL(`${(process.env.ROUTING_BASE_URL || "https://router.project-osrm.org").replace(/\/$/, "")}/route/v1/driving/${route.map(point => `${point.lon},${point.lat}`).join(";")}`);
        url.searchParams.set("overview", "false");
        const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        const result = await response.json() as { code?: string; routes?: { distance?: number; duration?: number }[] };
        const best = result.routes?.[0];
        if (!response.ok || result.code !== "Ok" || !Number.isFinite(best?.distance) || !Number.isFinite(best?.duration)) throw new Error("Rota indisponível.");
        distanceKm = best!.distance! / 1000; durationMinutes = best!.duration! / 60; method = "road";
      } catch {
        distanceKm *= 1.3;
        durationMinutes = distanceKm / (transport === "bus" || transport === "truck" ? 45 : 55) * 60;
      }
    } else durationMinutes = distanceKm / (transport === "plane" ? 650 : 30) * 60;
    const estimate: RouteEstimate = {
      originSignature: addressSignature(origin), destinationSignature: destinationsSignature(stops), transport, roundTrip,
      distanceKm: Math.round(distanceKm * 10) / 10, durationMinutes: Math.max(1, Math.round(durationMinutes)), method, calculatedAt: new Date().toISOString(),
    };
    return Response.json(estimate);
  } catch (cause) {
    return new Response(cause instanceof Error ? cause.message : "Não foi possível calcular a rota.", { status: 502 });
  }
}
