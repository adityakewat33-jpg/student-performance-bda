import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line, Scatter } from 'react-chartjs-2';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);
ChartJS.defaults.font.family = "'Pretendard', system-ui, -apple-system, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#475569';
export const INDIGO = '#4338CA';
export const INDIGO_SOFT = 'rgba(67, 56, 202, 0.75)';
export const TEAL = '#0E7490';
export const TEAL_SOFT = 'rgba(14, 116, 144, 0.75)';
export const GREEN = '#15803D';
export const RED = '#B91C1C';
export const SLATE_GRID = '#E2E8F0';
export const legendStyle = {
  display: true,
  position: 'bottom',
  labels: {
    usePointStyle: true,
    pointStyle: 'circle',
    boxWidth: 8,
    padding: 16,
    color: '#475569',
  },
};
export const tooltipStyle = {
  backgroundColor: '#1E1B4B',
  titleColor: '#FFFFFF',
  bodyColor: '#E0E7FF',
  padding: 12,
  cornerRadius: 8,
  displayColors: true,
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
};
export function axisOptions(extra) {
  return Object.assign(
    {
      grid: { color: SLATE_GRID, drawBorder: false },
      border: { display: false },
      ticks: { color: '#64748b', padding: 6 },
    },
    extra || {}
  );
}
export function baseOptions(overrides) {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legendStyle,
      tooltip: tooltipStyle,
    },
    scales: {
      x: axisOptions({ grid: { display: false, drawBorder: false } }),
      y: axisOptions(),
    },
  };
  return Object.assign({}, base, overrides || {});
}
export { Bar, Doughnut, Line, Scatter };