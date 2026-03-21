/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';

interface MetricRow {
  global_step: number;
  fidelity: number | null;
  loss: number | null;
  lr: number | null;
}

export default function App() {
  const [data, setData] = useState<MetricRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/metrics/stream');

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Connection to metrics server lost. Retrying...');
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Training Metrics</h1>
              <p className="text-sm text-zinc-500">Real-time model performance monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="text-sm font-medium text-zinc-600">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </header>

        {error && (
          <div className="flex items-center space-x-2 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h2 className="text-lg font-medium mb-6">Fidelity over Time</h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis 
                    dataKey="global_step" 
                    stroke="#a1a1aa" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="fidelity" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h2 className="text-lg font-medium mb-6">Loss</h2>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="global_step" hide />
                    <YAxis 
                      stroke="#a1a1aa" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e4e4e7',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      stroke="#f43f5e" 
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h2 className="text-lg font-medium mb-6">Learning Rate</h2>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="global_step" hide />
                    <YAxis 
                      stroke="#a1a1aa" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 'auto']}
                      width={40}
                      tickFormatter={(val) => val.toExponential(1)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e4e4e7',
                        fontSize: '12px'
                      }}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="lr" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="text-sm font-medium text-zinc-700">Recent Data Points</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Global Step</th>
                  <th className="px-6 py-3 font-medium">Fidelity</th>
                  <th className="px-6 py-3 font-medium">Loss</th>
                  <th className="px-6 py-3 font-medium">Learning Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.slice(-5).reverse().map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-zinc-600">{row.global_step}</td>
                    <td className="px-6 py-3 font-mono text-zinc-900">{row.fidelity !== null ? row.fidelity.toFixed(6) : 'NaN'}</td>
                    <td className="px-6 py-3 font-mono text-zinc-600">{row.loss !== null ? row.loss.toFixed(6) : 'NaN'}</td>
                    <td className="px-6 py-3 font-mono text-zinc-600">{row.lr !== null ? row.lr.toExponential(6) : 'NaN'}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                      Waiting for metrics data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
