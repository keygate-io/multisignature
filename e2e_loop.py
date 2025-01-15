import os
import subprocess
from pathlib import Path

def run_playwright_tests(outer_iterations=3, inner_iterations=5):
    """
    Run Playwright tests with nested iterations.
    
    Args:
        outer_iterations (int): Number of outer iteration folders
        inner_iterations (int): Number of test runs per iteration
    """
    # Base command for running playwright tests
    base_command = "npx playwright test --project=chromium --reporter=json"
    
    for iteration in range(1, outer_iterations + 1):
        # Create iteration directory
        iteration_dir = Path(f"i{iteration}")
        iteration_dir.mkdir(exist_ok=True)
        
        print(f"\nStarting iteration {iteration}/{outer_iterations}")
        
        # Run tests multiple times within each iteration
        for run in range(1, inner_iterations + 1):
            output_file = iteration_dir / f"run_{run}.json"
            full_command = f"{base_command} > {output_file}"
            
            print(f"  Running test {run}/{inner_iterations}")
            
            try:
                # Run the command and capture output
                subprocess.run(
                    full_command,
                    shell=True,
                    check=True,
                    stderr=subprocess.PIPE,
                    universal_newlines=True
                )
                print(f"  ✓ Test {run} completed successfully")
                
            except subprocess.CalledProcessError as e:
                print(f"  ✗ Error in test {run}: {e.stderr}")
                continue

if __name__ == "__main__":
    # You can modify these values as needed
    OUTER_ITERATIONS = 5
    INNER_ITERATIONS = 3
    
    run_playwright_tests(OUTER_ITERATIONS, INNER_ITERATIONS)