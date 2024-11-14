import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import '../styles/TrainingVisuals.css';

function TrainingVisuals({ sessionId }) {
  const [chartData, setChartData] = useState({
    loss: {
      labels: [],
      datasets: [
        {
          label: 'Model 1 Loss',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Model 2 Loss',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    },
    accuracy: {
      labels: [],
      datasets: [
        {
          label: 'Model 1 Accuracy',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Model 2 Accuracy',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    }
  });

  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    wsRef.current = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        updateCharts(data);
      } catch (err) {
        setError('Failed to process training data');
      }
    };

    wsRef.current.onerror = () => {
      setError('WebSocket connection error');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  const updateCharts = (data) => {
    setChartData(prevData => {
      const newData = { ...prevData };
      
      // Update loss data
      newData.loss.labels.push(data.epoch);
      newData.loss.datasets[0].data.push(data.model1.loss);
      newData.loss.datasets[1].data.push(data.model2.loss);
      
      // Update accuracy data
      newData.accuracy.labels.push(data.epoch);
      newData.accuracy.datasets[0].data.push(data.model1.accuracy);
      newData.accuracy.datasets[1].data.push(data.model2.accuracy);
      
      return newData;
    });
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    animation: {
      duration: 0
    }
  };

  return (
    <div className="training-visuals">
      {error && <div className="error-message">{error}</div>}
      
      <div className="charts-container">
        <div className="chart-column">
          <div className="chart-wrapper">
            <h3>Training Loss</h3>
            <Line data={chartData.loss} options={chartOptions} />
          </div>
        </div>
        
        <div className="chart-column">
          <div className="chart-wrapper">
            <h3>Training Accuracy</h3>
            <Line data={chartData.accuracy} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainingVisuals; 