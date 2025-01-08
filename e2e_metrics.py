#!/usr/bin/env python3
import json
import sys
import argparse
from pathlib import Path
from typing import Dict, Union, List
from datetime import datetime

class TestResultsAnalyzer:
    def __init__(self, json_path: Union[str, Path]):
        self.json_path = Path(json_path)
        self.data = None

    def load_json(self) -> None:
        """Load and validate the JSON file."""
        try:
            with open(self.json_path, 'r') as f:
                self.data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON file - {e}")
            sys.exit(1)
        except FileNotFoundError:
            print(f"Error: File not found - {self.json_path}")
            sys.exit(1)

    def get_test_stats(self) -> Dict:
        """
        Analyze test results and return statistics.
        Returns dictionary with failed, success, and total counts.
        """
        if not self.data:
            return {'failed': 0, 'success': 0, 'total': 0, 'test_details': []}

        failed = 0
        success = 0
        test_details = []
        
        suites = self.data.get('suites', []) or []
        for suite in suites:
            suite_title = suite.get('title', 'Unknown Suite')
            specs = suite.get('specs', []) or []
            for spec in specs:
                spec_title = spec.get('title', 'Unknown Spec')
                tests = spec.get('tests', []) or []
                for test in tests:
                    results = test.get('results', []) or []
                    if results:  # Get last result (handling retries)
                        last_result = results[-1]
                        status = last_result.get('status')
                        if status == 'passed':
                            success += 1
                        elif status in ['failed', 'timedOut']:  # Count timeouts as failures
                            failed += 1
                        
                        # Store detailed test information
                        test_details.append({
                            'suite': suite_title,
                            'spec': spec_title,
                            'status': status,
                            'project_name': test.get('projectName', 'Unknown'),
                            'expected_status': test.get('expectedStatus', 'Unknown')
                        })
        
        return {
            'failed': failed,
            'success': success,
            'total': failed + success,
            'test_details': test_details
        }

    def get_detailed_stats(self) -> Dict:
        """Get additional statistics about the test run."""
        if not self.data:
            return {}

        stats = self.data.get('stats', {})
        return {
            'duration': stats.get('duration', 0),
            'start_time': stats.get('startTime', ''),
            'flaky_tests': stats.get('flaky', 0),
            'skipped_tests': stats.get('skipped', 0)
        }

    def generate_report(self, verbose: bool = False) -> str:
        """Generate a formatted report of the test results."""
        stats = self.get_test_stats()
        detailed = self.get_detailed_stats()
        
        report = [
            "Test Results Analysis",
            "=" * 20,
            f"Analysis Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Input File: {self.json_path}",
            "",
            "Test Execution Summary:",
            f"- Total Tests: {stats['total']}",
            f"- Passed: {stats['success']}",
            f"- Failed: {stats['failed']}",
            f"- Success Rate: {(stats['success']/stats['total']*100 if stats['total'] else 0):.1f}%",
            "",
            "Additional Information:",
            f"- Duration: {detailed.get('duration', 0)/1000:.2f} seconds",
            f"- Start Time: {detailed.get('start_time', 'N/A')}",
            f"- Flaky Tests: {detailed.get('flaky_tests', 0)}",
            f"- Skipped Tests: {detailed.get('skipped_tests', 0)}"
        ]

        if verbose:
            report.extend([
                "",
                "Detailed Test Information:",
                "-" * 20
            ])
            
            # Group tests by suite
            suites = {}
            for test in stats['test_details']:
                suite_name = test['suite']
                if suite_name not in suites:
                    suites[suite_name] = []
                suites[suite_name].append(test)
            
            for suite_name, tests in suites.items():
                report.append(f"\nSuite: {suite_name}")
                for test in tests:
                    report.append(f"  - {test['spec']} ({test['status']}) [Project: {test['project_name']}]")
        
        return "\n".join(report)

def main():
    parser = argparse.ArgumentParser(description='Analyze test results from JSON file')
    parser.add_argument('json_path', help='Path to the JSON file containing test results')
    parser.add_argument('--output', '-o', help='Output file path (optional)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed test information')
    args = parser.parse_args()

    analyzer = TestResultsAnalyzer(args.json_path)
    analyzer.load_json()
    report = analyzer.generate_report(verbose=args.verbose)

    if args.output:
        try:
            with open(args.output, 'w') as f:
                f.write(report)
            print(f"Report written to {args.output}")
        except IOError as e:
            print(f"Error writing to output file: {e}")
            sys.exit(1)
    else:
        print(report)

if __name__ == "__main__":
    main()