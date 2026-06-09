import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const AudienceChart = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#192540', // surface-container-highest
        titleColor: '#dee5ff', // on-surface
        bodyColor: '#a3aac4', // on-surface-variant
        borderColor: '#40485d', // outline-variant
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#a3aac4', // on-surface-variant
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
        },
        border: {
            display: false,
        }
      },
      y: {
        grid: {
          color: '#40485d', // outline-variant
          drawBorder: false,
        },
        border: {
            display: false,
            dash: [4, 4],
        },
        ticks: {
          color: '#a3aac4', // on-surface-variant
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          stepSize: 50,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'New Followers',
        data: [120, 190, 150, 220, 280, 250, 310],
        borderColor: '#bd9dff', // primary
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(189, 157, 255, 0.4)'); // primary with opacity
          gradient.addColorStop(1, 'rgba(189, 157, 255, 0.0)');
          return gradient;
        },
        borderWidth: 2,
        tension: 0.4, // Smooth curve
        pointBackgroundColor: '#bd9dff',
        pointBorderColor: '#060e20',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <Line options={options} data={data} />
    </div>
  );
};

export default AudienceChart;
