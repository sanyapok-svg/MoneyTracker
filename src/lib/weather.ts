const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const MINSK_LAT = 53.9;
const MINSK_LON = 27.56;
export const WEATHER_REVALIDATE_SECONDS = 3600;

export type WeatherSnapshot = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  observedAt: string;
  fetchedAt: string;
};

type OpenMeteoResponse = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
};

export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Ясно";
  if (code <= 3) return "Облачно";
  if (code === 45 || code === 48) return "Туман";
  if (code >= 51 && code <= 57) return "Морось";
  if (code >= 61 && code <= 67) return "Дождь";
  if (code === 71 || code === 73 || code === 75 || code === 77) return "Снег";
  if (code >= 80 && code <= 82) return "Ливень";
  if (code === 85 || code === 86) return "Снегопад";
  if (code === 95) return "Гроза";
  if (code === 96 || code === 99) return "Гроза с градом";
  return "Переменная погода";
}

export function formatWindDirection(degrees: number): string {
  const dirs = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"] as const;
  const idx = Math.round(degrees / 45) % 8;
  return dirs[idx];
}

export async function fetchMinskWeather(): Promise<WeatherSnapshot> {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(MINSK_LAT));
  url.searchParams.set("longitude", String(MINSK_LON));
  url.searchParams.set("timezone", "Europe/Minsk");
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  );
  url.searchParams.set("forecast_days", "1");

  const res = await fetch(url.toString(), {
    next: { revalidate: WEATHER_REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo: HTTP ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const current = data.current;
  if (!current?.time) {
    throw new Error("Open-Meteo: нет текущих данных");
  }

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    observedAt: toMinskIso(current.time),
    fetchedAt: new Date().toISOString(),
  };
}

/** Open-Meteo returns local wall time without offset; Belarus is UTC+3 year-round. */
function toMinskIso(time: string): string {
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(time)) return time;
  const normalized = time.length === 16 ? `${time}:00` : time;
  return `${normalized}+03:00`;
}

export async function getMinskWeather(): Promise<WeatherSnapshot> {
  return fetchMinskWeather();
}
