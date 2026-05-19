import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import {
  formatWindDirection,
  type WeatherSnapshot,
  weatherCodeLabel,
} from "@/lib/weather";

type Props = {
  weather: WeatherSnapshot;
};

function WeatherIcon({ code }: { code: number }) {
  const className = "size-10 text-muted-foreground";
  if (code === 0) return <Sun className={className} aria-hidden />;
  if (code <= 3) return <CloudSun className={className} aria-hidden />;
  if (code === 45 || code === 48) return <CloudFog className={className} aria-hidden />;
  if (code >= 51 && code <= 67) return <CloudRain className={className} aria-hidden />;
  if (code >= 71 && code <= 86) return <CloudSnow className={className} aria-hidden />;
  if (code >= 95) return <CloudLightning className={className} aria-hidden />;
  return <Cloud className={className} aria-hidden />;
}

function formatTemp(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}°`;
}

export function WeatherCard({ weather }: Props) {
  const label = weatherCodeLabel(weather.weatherCode);
  const wind =
    weather.windSpeed > 0
      ? `${Math.round(weather.windSpeed)} км/ч, ${formatWindDirection(weather.windDirection)}`
      : "штиль";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Погода · Минск, Беларусь
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <WeatherIcon code={weather.weatherCode} />
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {formatTemp(weather.temperature)}
            </p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        <ul className="grid gap-2 text-sm">
          <li className="flex justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Ощущается</span>
            <span className="font-medium tabular-nums">
              {formatTemp(weather.apparentTemperature)}
            </span>
          </li>
          <li className="flex justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Влажность</span>
            <span className="font-medium tabular-nums">{weather.humidity}%</span>
          </li>
          <li className="flex justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Ветер</span>
            <span className="font-medium">{wind}</span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Наблюдение: {formatDateTime(weather.observedAt)} (Минск). Обновление каждый
          час ·{" "}
          <a
            href="https://open-meteo.com/"
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
