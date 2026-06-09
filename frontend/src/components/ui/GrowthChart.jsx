import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GrowthChart = ({ data: chartData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#192540',
        titleColor: '#dee5ff',
        bodyColor: '#a3aac4',
        borderColor: '#40485d',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label ? `${context.dataset.label}: ` : '';
            return context.parsed.y !== null ? `${label}${context.parsed.y}` : label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#a3aac4',
          maxRotation: 0,
          minRotation: 0,
          font: { family: "'Inter', sans-serif", size: 9, weight: '600' },
          padding: 8,
          callback: function(val, index) {
            // Show every 5th label to avoid crowding
            return index % 5 === 0 ? this.getLabelForValue(val) : '';
          }
        },
        border: { display: false },
      },
      y: {
        display: false,
        grid: { display: false },
        border: { display: false },
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  const labels = chartData?.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  }) || [];

  const data = {
    labels,
    datasets: [
      {
        label: 'Follows',
        data: chartData?.map(d => d.follows) || [],
        backgroundColor: '#7F77DD',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Shares',
        data: chartData?.map(d => d.shares) || [],
        backgroundColor: '#FF97B2',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  return (
    <div className="w-full h-full min-h-0">
      {chartData && chartData.length > 0 ? (
        <Bar options={options} data={data} />
      ) : (
        <div className="flex items-center justify-center h-full text-on-surface-variant italic text-sm">
          Insufficient data for growth analysis.
        </div>
      )}
    </div>
  );
};

export default GrowthChart;
