import './style.css';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { GetData } from '../wailsjs/go/main/App';

const GET_DATA_INTERVAL_MS = 1000*10 //10 second

const verticalLinePlugin = {
  id: 'verticalLine',
  afterDraw(chart) {
    const active = chart.getActiveElements();
    if (active.length) {
      const ctx = chart.ctx;
      const x = active[0].element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
      ctx.restore();
    }
  }
};

const horizontalLinePlugin = {
  id: 'horizontalLine',
  afterDraw(chart) {
    const dataset = chart.data.datasets[0];
    const firstValue = dataset.data[0];
    if (firstValue == null) return;
    const ctx = chart.ctx;
    const y = chart.scales.y.getPixelForValue(firstValue);
    const left = chart.chartArea.left;
    const right = chart.chartArea.right;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.restore();
  }
};

Chart.register(
  LineController, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend,
  verticalLinePlugin, horizontalLinePlugin
);

const calcCumulativeAvg = (prices) => {
  let sum = 0;
  return prices.map((v, i) => {
    sum += v;
    return sum / (i + 1);
  });
};

const setData = async (c) => {
  let stockData = [];
  try {
    stockData = await GetData();
  } catch (error) {
    console.error('呼叫後端發生錯誤:', error);
    return;
  }
  const prices = stockData.map(d => d.price);
  c.data.labels = stockData.map(d => d.time);
  c.data.datasets[0].data = prices;
  c.data.datasets[1].data = calcCumulativeAvg(prices);
  c.update();
};

const ctx = document.getElementById('chart');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: '價格',
        data: [],
        borderColor: 'blue',
        pointRadius: 2,
        pointHoverRadius: 2
      },
      {
        label: '均線',
        data: [],
        borderColor: 'orange',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  },
  options: {
    interaction: { mode: 'index', intersect: false },
    plugins: {
      tooltip: { mode: 'index', intersect: false, position: 'nearest' },
      legend: { display: true }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false, grid: { display: false } },
      y: { display: false, grid: { display: false } }
    },
    layout: {
      padding: { left: 20, right: 20 }
    }
  }
});

setData(chart);

window.addEventListener('resize', () => chart.resize());

setInterval(() => setData(chart), GET_DATA_INTERVAL_MS);
