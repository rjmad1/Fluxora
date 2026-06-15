import os
import sys
import json
import urllib.request
import urllib.parse
import subprocess
from pathlib import Path

# Config
DEFAULT_SKILLS_DIR = Path(os.environ.get("USERPROFILE", "C:\\Users\\rajaj")) / "AppData" / "Local" / "hermes" / "skills"

# ANSI Colors for premium terminal UI
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
UNDERLINE = "\033[4m"
RESET = "\033[0m"

def print_banner():
    banner = f"""
{BLUE}{BOLD}███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
███████╗█████╔╝ ██║██║     ██║     ███████╗
╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
███████║██║  ██╗██║███████╗███████╗███████║
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝{RESET}
            {BOLD}Skills.sh Manager & Importer{RESET}
"""
    try:
        print(banner)
    except UnicodeEncodeError:
        ascii_banner = f"""
{BLUE}{BOLD}================================================
  Skills.sh Manager & Importer
================================================{RESET}
"""
        print(ascii_banner)

def print_error(msg):
    print(f"{RED}{BOLD}Error:{RESET} {msg}", file=sys.stderr)

def print_success(msg):
    print(f"{GREEN}{BOLD}Success:{RESET} {msg}")

def print_info(msg):
    print(f"{BLUE}{BOLD}Info:{RESET} {msg}")

def print_warning(msg):
    print(f"{YELLOW}{BOLD}Warning:{RESET} {msg}")

def fetch_json(url):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print_error(f"HTTP request failed: {e}")
        return None

def search_skills(query):
    print_info(f"Searching skills.sh for '{query}' using CLI...")
    sys.stdout.flush()
    sys.stderr.flush()
    try:
        subprocess.run(["npx", "skills", "find", query], shell=True)
    except Exception as e:
        print_error(f"Failed to run CLI search: {e}")

def list_installed_skills():
    print_info("Listing installed global skills...")
    try:
        # Try running npx skills list
        result = subprocess.run(
            ["npx", "skills", "list", "-g", "--json"],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.returncode == 0:
            skills_data = json.loads(result.stdout)
            for agent, skills in skills_data.items():
                print(f"\n{BOLD}Agent: {agent} ({len(skills)} skills installed){RESET}")
                print("-" * 80)
                for idx, skill in enumerate(skills, start=1):
                    print(f"{BOLD}{idx}. {skill['name']}{RESET}")
                    print(f"   Package: {BLUE}{skill['package']}{RESET}")
                    print(f"   Path:    {skill['path']}")
                    print("-" * 80)
        else:
            # Fallback to local directory listing
            print_warning("Could not run CLI list command, listing directory directly...")
            list_local_directory()
    except Exception as e:
        print_warning(f"Error checking CLI: {e}. Listing directory directly...")
        list_local_directory()

def list_local_directory():
    if not DEFAULT_SKILLS_DIR.exists():
        print_warning(f"Skills directory does not exist: {DEFAULT_SKILLS_DIR}")
        return
        
    print(f"\n{BOLD}Local Skills Directory: {DEFAULT_SKILLS_DIR}{RESET}")
    print("-" * 80)
    count = 0
    for pkg_dir in DEFAULT_SKILLS_DIR.iterdir():
        if pkg_dir.is_dir() and not pkg_dir.name.startswith('.'):
            for skill_dir in pkg_dir.iterdir():
                if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                    count += 1
                    print(f"{BOLD}{count}. {skill_dir.name}{RESET}")
                    print(f"   Package: {BLUE}{pkg_dir.name}{RESET}")
                    print(f"   Path:    {skill_dir}")
                    print("-" * 80)

def install_via_cli(package, skill_name=None):
    cmd = ["npx", "skills", "add", package]
    if skill_name:
        cmd.extend(["--skill", skill_name])
    cmd.extend(["-g", "--all"])
    
    print_info(f"Running command: {' '.join(cmd)}")
    sys.stdout.flush()
    sys.stderr.flush()
    try:
        result = subprocess.run(cmd, shell=True)
        if result.returncode == 0:
            print_success(f"Successfully installed skill package: {package}")
            return True
        else:
            print_error(f"CLI installation exited with code {result.returncode}")
            return False
    except Exception as e:
        print_error(f"Failed to run CLI command: {e}")
        return False

def import_via_api(skill_id):
    """
    Directly fetches files from skills.sh API and saves them locally.
    skill_id: e.g. 'vercel-labs/skills/find-skills'
    """
    parts = skill_id.split('/')
    if len(parts) < 3:
        print_error("Invalid skill ID format. Expected 'owner/repo/slug' (e.g. vercel-labs/skills/find-skills)")
        return False
        
    owner = parts[0]
    repo = parts[1]
    slug = parts[-1]
    
    print_info(f"Fetching details for skill '{slug}' from {owner}/{repo}...")
    url = f"https://skills.sh/api/v1/skills/{owner}/{repo}/{slug}"
    
    skill_data = fetch_json(url)
    if not skill_data:
        print_error("Failed to retrieve skill data from API.")
        return False
        
    files = skill_data.get('files')
    if not files:
        print_error("No files found in the skill package.")
        return False
        
    # Determine local package folder name (using repo name)
    # E.g. C:\Users\rajaj\AppData\Local\hermes\skills\skills\find-skills
    dest_dir = DEFAULT_SKILLS_DIR / repo / slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    print_info(f"Writing skill files to {dest_dir}...")
    for f in files:
        file_path = dest_dir / f['path']
        # Create subdirectories if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as file_out:
            file_out.write(f['contents'])
        print(f"  {GREEN}✓{RESET} Wrote {f['path']}")
        
    print_success(f"Imported '{slug}' successfully into {dest_dir}")
    return True

def print_help():
    print("""
Usage:
  python copy_skills.py <owner>/<repo>/<slug>   - Import a specific skill directly using the API
  python copy_skills.py <owner>/<repo>          - Install package via CLI (npx skills add)
  python copy_skills.py --search <query>        - Search skills on skills.sh
  python copy_skills.py --list                  - List installed global skills
  python copy_skills.py --help                  - Show this help message
""")

def main():
    print_banner()
    
    if len(sys.argv) < 2:
        print_help()
        return

    arg1 = sys.argv[1]
    
    if arg1 in ("--help", "-h"):
        print_help()
    elif arg1 in ("--list", "-l"):
        list_installed_skills()
    elif arg1 in ("--search", "-s"):
        if len(sys.argv) < 3:
            print_error("Search query missing. Example: python copy_skills.py --search design")
            return
        query = " ".join(sys.argv[2:])
        search_skills(query)
    elif "/" in arg1:
        # Check if it's a specific skill (3 parts: owner/repo/slug)
        parts = arg1.split('/')
        if len(parts) >= 3:
            # Import directly via API
            success = import_via_api(arg1)
            if not success:
                print_info("Trying fallback to CLI install...")
                package = f"{parts[0]}/{parts[1]}"
                skill = parts[-1]
                install_via_cli(package, skill)
        else:
            # Install package via CLI
            install_via_cli(arg1)
    else:
        print_error(f"Unknown command or format: {arg1}")
        print_help()

if __name__ == "__main__":
    # Enable ANSI colors on Windows CMD/PowerShell if needed
    os.system("")
    main()
