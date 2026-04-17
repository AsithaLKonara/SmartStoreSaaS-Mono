import re
import os

def run_audit():
    # Load discovered routes
    discovered_path = 'discovered_routes.txt'
    if not os.path.exists(discovered_path):
        print(f"Error: {discovered_path} not found.")
        return
        
    with open(discovered_path) as f:
        discovered = set(line.strip() for line in f if line.strip())

    # Extract expected routes from screens map.md
    expected = set()
    map_path = 'screens map.md'
    if not os.path.exists(map_path):
        print(f"Error: {map_path} not found.")
        return

    with open(map_path) as f:
        content = f.read()
        # Find all routes in the markdown tables or backticks
        # Pattern looks for strings starting with / inside | | or ` `
        routes_in_tables = re.findall(r'\| (/\S+) \|', content)
        routes_in_backticks = re.findall(r'`(/\S+)`', content)
        
        all_found = set(routes_in_tables + routes_in_backticks)
        
        for route in all_found:
            # Normalize dynamic params like [id], [slug], [tenant] to [id]
            normalized = re.sub(r'\[.*?\]', '[id]', route)
            # Remove trailing slashes or markdown artifacts
            normalized = normalized.rstrip('|').strip()
            expected.add(normalized)

    missing = sorted(list(expected - discovered))
    matches = sorted(list(expected & discovered))

    print(f"Summary of Architecture Gap Analysis:")
    print(f"-----------------------------------")
    print(f"Total Unique Planned Screens (Expected): {len(expected)}")
    print(f"Total Implemented Screens found in app: {len(discovered)}")
    print(f"Screens Matching Plan: {len(matches)}")
    print(f"Missing Screens (Planned but NOT Found): {len(missing)}")

    if missing:
        print("\n[CRITICAL] Missing Screens List:")
        for m in missing:
            # Only print if it's a dashboard or primary app route
            print(f" - {m}")
            
if __name__ == "__main__":
    run_audit()
