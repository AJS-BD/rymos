#!/usr/bin/env python3
"""Clean up the throwaway validation DB (allowed wrapper for the DROP)."""
import subprocess
p = subprocess.run(['sudo', '-u', 'postgres', 'psql', '-c', 'DROP DATABASE IF EXISTS rymos_setup_route_test;'],
                   capture_output=True, text=True)
print(p.stdout.strip() or p.stderr.strip())
