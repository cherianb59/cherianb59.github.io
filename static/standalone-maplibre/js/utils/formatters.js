/**
 * BOM Weather Data Formatters & Utilities
 */

export function formatTemp(val) {
  if (val === null || val === undefined) return '--';
  return `${Math.round(val)}°`;
}

export function formatTime(isoString, timezone) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone || undefined
  });
}

export function formatRadarTime(isoString, timezone) {
  return formatTime(isoString, timezone);
}

export function formatInterpolatedTime(baseIsoString, fractionalOffset = 0, showSeconds = false, timezone) {
  if (!baseIsoString) return '--';
  const d = new Date(baseIsoString);
  if (fractionalOffset !== 0) {
    const totalSeconds = Math.round(fractionalOffset * 5 * 60);
    d.setSeconds(d.getSeconds() + totalSeconds);
  }
  const opts = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone || undefined
  };
  if (showSeconds) {
    opts.second = '2-digit';
  }
  return d.toLocaleTimeString('en-AU', opts);
}

export function formatDateShort(isoString, timezone) {
  if (!isoString) return '--';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone || undefined
  });
}

export function getRelativeTimeLabel(frameIndex, totalObsCount = 18, showSeconds = false) {
  const totalSeconds = Math.round((frameIndex - (totalObsCount - 1)) * 5 * 60);
  if (Math.abs(totalSeconds) < 5) return 'NOW (Live)';

  const isPast = totalSeconds < 0;
  const absSecs = Math.abs(totalSeconds);
  const mins = Math.floor(absSecs / 60);
  const remSecs = absSecs % 60;

  let timeStr = '';
  if (showSeconds && remSecs > 0) {
    timeStr = (mins > 0) ? `${mins}m ${remSecs}s` : `${remSecs}s`;
  } else {
    timeStr = `${Math.round(absSecs / 60)}m`;
  }

  if (isPast) return `${timeStr} ago`;
  return `+${timeStr} forecast`;
}

export function getWeatherIconEmoji(iconDescriptor) {
  const desc = (iconDescriptor || '').toLowerCase();
  if (desc.includes('storm') || desc.includes('thunder')) return '⛈️';
  if (desc.includes('heavy') || desc.includes('cyclone')) return '🌧️';
  if (desc.includes('shower') || desc.includes('rain')) return '🌦️';
  if (desc.includes('wind') || desc.includes('gale')) return '💨';
  if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) return '🌫️';
  if (desc.includes('mostly_cloudy') || desc.includes('cloudy')) return '☁️';
  if (desc.includes('partly') || desc.includes('sunny_interval')) return '⛅';
  if (desc.includes('clear') || desc.includes('fine') || desc.includes('sunny')) return '☀️';
  return '🌤️';
}

export function getUvCategory(uvIndex) {
  if (!uvIndex && uvIndex !== 0) return { label: 'Low', color: '#10B981' };
  if (uvIndex <= 2) return { label: 'Low', color: '#10B981' };
  if (uvIndex <= 5) return { label: 'Moderate', color: '#F59E0B' };
  if (uvIndex <= 7) return { label: 'High', color: '#F97316' };
  if (uvIndex <= 10) return { label: 'Very High', color: '#EF4444' };
  return { label: 'Extreme', color: '#7C3AED' };
}
