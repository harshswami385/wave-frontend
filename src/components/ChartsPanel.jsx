import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#dce8ee',
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#bdd2dd' },
      grid: { color: 'rgba(255,255,255,0.08)' },
      title: {
        display: true,
        text: 'Depth d (m)',
        color: '#bdd2dd',
      },
    },
    y: {
      ticks: { color: '#bdd2dd' },
      grid: { color: 'rgba(255,255,255,0.08)' },
    },
  },
};

function ChartsPanel({ result }) {
  if (!result) {
    return <p className="placeholder">Charts appear after running the calculation.</p>;
  }

  const depths = result.chart_data.map((p) => p.depth);
  const wavelengths = result.chart_data.map((p) => p.wavelength);
  const celerities = result.chart_data.map((p) => p.celerity);
  const heights = result.chart_data.map((p) => p.wave_height);

  const lVsD = {
    labels: depths,
    datasets: [
      {
        label: 'Wavelength L (m)',
        data: wavelengths,
        borderColor: '#6fe3ff',
        backgroundColor: 'rgba(111, 227, 255, 0.2)',
        tension: 0.25,
        fill: true,
      },
    ],
  };

  const cVsD = {
    labels: depths,
    datasets: [
      {
        label: 'Celerity C (m/s)',
        data: celerities,
        borderColor: '#f7cf7a',
        backgroundColor: 'rgba(247, 207, 122, 0.2)',
        tension: 0.25,
        fill: true,
      },
    ],
  };

  const breakIndex = heights.findIndex((value) => value >= result.Hb);
  const breakDepth = breakIndex >= 0 ? depths[breakIndex] : result.hb;

  const hVsD = {
    labels: depths,
    datasets: [
      {
        label: 'Wave Height H (m)',
        data: heights,
        borderColor: '#ff9c8b',
        backgroundColor: 'rgba(255, 156, 139, 0.18)',
        tension: 0.25,
        fill: true,
      },
      {
        label: 'Breaking Point',
        data: depths.map((d) => (Math.abs(d - breakDepth) < 1e-6 ? result.Hb : null)),
        borderColor: '#e73f3f',
        backgroundColor: '#e73f3f',
        pointRadius: 6,
        pointHoverRadius: 7,
        showLine: false,
      },
    ],
  };

  return (
    <div className="chart-grid">
      <article className="chart-card">
        <h3>L vs d</h3>
        <div className="chart-box">
          <Line data={lVsD} options={baseOptions} />
        </div>
      </article>

      <article className="chart-card">
        <h3>C vs d</h3>
        <div className="chart-box">
          <Line data={cVsD} options={baseOptions} />
        </div>
      </article>

      <article className="chart-card full-chart">
        <h3>H vs d with Breaking Point</h3>
        <div className="chart-box">
          <Line data={hVsD} options={baseOptions} />
        </div>
      </article>
    </div>
  );
}

export default ChartsPanel;
