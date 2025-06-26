"""Test runner script for easy test execution."""
import subprocess
import sys
import os


def run_tests():
    """Run all tests with appropriate options."""
    print("Installing test dependencies...")
    subprocess.run([sys.executable, "-m", "uv", "sync", "--extra", "test"], check=True)
    
    print("\nRunning unit tests...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/unit/", 
        "-v", 
        "--tb=short",
        "-m", "unit"
    ])
    
    if result.returncode != 0:
        print("Unit tests failed!")
        return False
    
    print("\nRunning integration tests (requires test database)...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/integration/", 
        "-v", 
        "--tb=short",
        "-m", "integration"
    ])
    
    if result.returncode != 0:
        print("Integration tests failed or test database not available!")
        print("To run integration tests, ensure you have a test PostgreSQL database running.")
        return False
    
    print("\nAll tests passed!")
    return True


def run_unit_tests_only():
    """Run only unit tests."""
    print("Installing test dependencies...")
    subprocess.run([sys.executable, "-m", "uv", "sync", "--extra", "test"], check=True)
    
    print("\nRunning unit tests...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/unit/", 
        "-v", 
        "--tb=short",
        "-m", "unit"
    ])
    
    return result.returncode == 0


def run_with_coverage():
    """Run tests with coverage report."""
    print("Installing test dependencies...")
    subprocess.run([sys.executable, "-m", "uv", "sync", "--extra", "test"], check=True)
    
    print("\nRunning tests with coverage...")
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/unit/", 
        "--cov=server",
        "--cov-report=term-missing",
        "--cov-report=html",
        "-v"
    ])
    
    if result.returncode == 0:
        print("\nCoverage report generated in htmlcov/index.html")
    
    return result.returncode == 0


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "unit":
            success = run_unit_tests_only()
        elif sys.argv[1] == "coverage":
            success = run_with_coverage()
        else:
            print("Usage: python test_runner.py [unit|coverage]")
            sys.exit(1)
    else:
        success = run_tests()
    
    sys.exit(0 if success else 1)