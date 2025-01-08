#!/usr/bin/env python3
import json
from pathlib import Path
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from e2e_metrics import TestResultsAnalyzer

class TestStatsVisualizer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.iterations = ['i1', 'i2']
        self.colors = ['#2ecc71', '#e74c3c']  # Green for i1, Red for i2
        
    def load_run_data(self, iteration: str) -> List[Dict]:
        """Load all run data from a specific iteration folder."""
        iteration_path = self.base_path / iteration
        run_data = []
        
        for run_file in sorted(iteration_path.glob('run_*.json')):
            try:
                analyzer = TestResultsAnalyzer(str(run_file))
                analyzer.load_json()
                stats = analyzer.get_test_stats()
                detailed = analyzer.get_detailed_stats()
                
                stats.update(detailed)
                stats['run_number'] = int(run_file.stem.split('_')[1])
                run_data.append(stats)
            except Exception as e:
                print(f"Error loading {run_file}: {e}")
                
        return sorted(run_data, key=lambda x: x['run_number'])

    def create_dashboard(self, data_i1: List[Dict], data_i2: List[Dict]) -> go.Figure:
        """Create an interactive dashboard using plotly."""
        fig = make_subplots(
            rows=3, cols=1,
            subplot_titles=('Success Rate Comparison', 'Test Duration Comparison', 'Test Counts Comparison'),
            vertical_spacing=0.1
        )

        # Success Rate Plot
        for data, name, color in [(data_i1, 'Iteration 1', self.colors[0]), 
                                (data_i2, 'Iteration 2', self.colors[1])]:
            rates = [d['success'] / d['total'] * 100 for d in data]
            runs = [d['run_number'] for d in data]
            
            fig.add_trace(
                go.Scatter(x=runs, y=rates, name=f"{name} - Success Rate",
                          line=dict(color=color), mode='lines+markers'),
                row=1, col=1
            )

        # Duration Plot
        for data, name, color in [(data_i1, 'Iteration 1', self.colors[0]), 
                                (data_i2, 'Iteration 2', self.colors[1])]:
            durations = [d['duration'] / 1000 for d in data]
            runs = [d['run_number'] for d in data]
            
            fig.add_trace(
                go.Scatter(x=runs, y=durations, name=f"{name} - Duration",
                          line=dict(color=color), mode='lines+markers'),
                row=2, col=1
            )

        # Test Counts Plot
        for idx, (data, name, color) in enumerate([(data_i1, 'Iteration 1', self.colors[0]), 
                                                 (data_i2, 'Iteration 2', self.colors[1])]):
            runs = [d['run_number'] for d in data]
            success = [d['success'] for d in data]
            failed = [d['failed'] for d in data]
            
            # Passed tests
            fig.add_trace(
                go.Bar(x=runs, y=success, name=f"{name} - Passed",
                      marker_color=color, opacity=0.6,
                      offsetgroup=idx),
                row=3, col=1
            )
            
            # Failed tests (stacked)
            fig.add_trace(
                go.Bar(x=runs, y=failed, name=f"{name} - Failed",
                      marker_color=color, opacity=0.3,
                      base=success, offsetgroup=idx),
                row=3, col=1
            )

        # Update layout
        fig.update_layout(
            height=1200,
            title_text="Test Results Comparison Between Iterations",
            showlegend=True,
            barmode='group'
        )

        # Update axes labels
        fig.update_yaxes(title_text="Success Rate (%)", row=1, col=1)
        fig.update_yaxes(title_text="Duration (seconds)", row=2, col=1)
        fig.update_yaxes(title_text="Number of Tests", row=3, col=1)
        
        for i in range(1, 4):
            fig.update_xaxes(title_text="Run Number", row=i, col=1)

        return fig

    def generate_html_report(self, output_path: str = 'test_dashboard.html'):
        """Generate an HTML dashboard with interactive plots."""
        data_i1 = self.load_run_data('i1')
        data_i2 = self.load_run_data('i2')
        
        if not data_i1 or not data_i2:
            print("Error: No data found for one or both iterations")
            return
            
        # Create the dashboard
        fig = self.create_dashboard(data_i1, data_i2)
        
        # Generate summary statistics
        i1_stats = self.calc_stats(data_i1)
        i2_stats = self.calc_stats(data_i2)
        
        # Create HTML with both plot and statistics
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Results Dashboard</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .container {{ max-width: 1200px; margin: 0 auto; }}
                .stats {{ 
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                    border-radius: 8px;
                }}
                .stats-section {{
                    padding: 15px;
                    background-color: white;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                h1, h2 {{ color: #333; }}
                .comparison {{
                    margin-top: 20px;
                    padding: 15px;
                    background-color: #e8f4f8;
                    border-radius: 4px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Test Results Dashboard</h1>
                <div id="dashboard"></div>
                
                <div class="stats">
                    <div class="stats-section">
                        <h2>Iteration 1 Statistics</h2>
                        <p>Average Success Rate: {i1_stats['avg_success_rate']:.2f}%</p>
                        <p>Success Rate Range: {i1_stats['min_success_rate']:.2f}% - {i1_stats['max_success_rate']:.2f}%</p>
                        <p>Average Duration: {i1_stats['avg_duration']:.2f} seconds</p>
                        <p>Duration Range: {i1_stats['min_duration']:.2f} - {i1_stats['max_duration']:.2f} seconds</p>
                        <p>Average Tests per Run: {i1_stats['avg_tests']:.1f}</p>
                        <p>Total Failed Tests: {i1_stats['total_failed']}</p>
                        <p>Number of Runs: {i1_stats['total_runs']}</p>
                    </div>
                    
                    <div class="stats-section">
                        <h2>Iteration 2 Statistics</h2>
                        <p>Average Success Rate: {i2_stats['avg_success_rate']:.2f}%</p>
                        <p>Success Rate Range: {i2_stats['min_success_rate']:.2f}% - {i2_stats['max_success_rate']:.2f}%</p>
                        <p>Average Duration: {i2_stats['avg_duration']:.2f} seconds</p>
                        <p>Duration Range: {i2_stats['min_duration']:.2f} - {i2_stats['max_duration']:.2f} seconds</p>
                        <p>Average Tests per Run: {i2_stats['avg_tests']:.1f}</p>
                        <p>Total Failed Tests: {i2_stats['total_failed']}</p>
                        <p>Number of Runs: {i2_stats['total_runs']}</p>
                    </div>
                </div>

                <div class="comparison">
                    <h2>Comparison (Iteration 2 vs Iteration 1)</h2>
                    <p>Success Rate Change: {i2_stats['avg_success_rate'] - i1_stats['avg_success_rate']:.2f}%</p>
                    <p>Duration Change: {i2_stats['avg_duration'] - i1_stats['avg_duration']:.2f} seconds</p>
                    <p>Failed Tests Change: {i2_stats['total_failed'] - i1_stats['total_failed']}</p>
                </div>
            </div>
            
            <script>
                var plotData = {fig.to_json()};
                Plotly.newPlot('dashboard', plotData.data, plotData.layout);
            </script>
        </body>
        </html>
        """
        
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        return output_path

    def calc_stats(self, data: List[Dict]) -> Dict:
        """Calculate summary statistics for a dataset."""
        success_rates = [d['success'] / d['total'] * 100 for d in data]
        durations = [d['duration'] / 1000 for d in data]
        return {
            'avg_success_rate': np.mean(success_rates),
            'min_success_rate': np.min(success_rates),
            'max_success_rate': np.max(success_rates),
            'avg_duration': np.mean(durations),
            'min_duration': np.min(durations),
            'max_duration': np.max(durations),
            'total_failed': sum(d['failed'] for d in data),
            'total_runs': len(data),
            'avg_tests': np.mean([d['total'] for d in data])
        }

def start_server(port=8000):
    """Start a simple HTTP server in a separate thread."""
    server = HTTPServer(('localhost', port), SimpleHTTPRequestHandler)
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    return server

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Generate test statistics visualizations')
    parser.add_argument('base_path', help='Base path containing i1 and i2 folders')
    parser.add_argument('--port', '-p', type=int, default=8000,
                       help='Port for the HTTP server (default: 8000)')
    parser.add_argument('--output', '-o', default='test_dashboard.html',
                       help='Output path for the HTML dashboard (default: test_dashboard.html)')
    args = parser.parse_args()
    
    visualizer = TestStatsVisualizer(args.base_path)
    dashboard_path = visualizer.generate_html_report(args.output)
    
    # Start HTTP server and open browser
    server = start_server(args.port)
    webbrowser.open(f'http://localhost:{args.port}/{dashboard_path}')
    
    print(f"Dashboard is being served at http://localhost:{args.port}/{dashboard_path}")
    print("Press Ctrl+C to stop the server")
    
    try:
        while True:
            input()
    except KeyboardInterrupt:
        server.shutdown()
        print("\nServer stopped")

if __name__ == "__main__":
    main()