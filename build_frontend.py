import os
import shutil
import subprocess

def build():
    # Directories
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(workspace_dir, "dist")
    templates_dir = os.path.join(workspace_dir, "templates")
    static_dir = os.path.join(workspace_dir, "static")

    # Clean existing directories
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    if os.path.exists(templates_dir):
        shutil.rmtree(templates_dir)
    if os.path.exists(static_dir):
        shutil.rmtree(static_dir)

    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(static_dir, exist_ok=True)

    # Set Node.js memory limit to 512MB to force aggressive garbage collection in constrained environments
    os.environ["NODE_OPTIONS"] = "--max-old-space-size=512"

    print("Step 1: Running Vite build...")
    # Try pnpm, fallback to npm
    try:
        subprocess.run("pnpm run build", shell=True, check=True, cwd=workspace_dir)
    except Exception as e:
        print(f"pnpm build failed: {e}. Trying npm...")
        subprocess.run("npm run build", shell=True, check=True, cwd=workspace_dir)

    print("Step 2: Copying build assets to Flask folders...")
    if not os.path.exists(dist_dir):
        print("Error: Build directory 'dist' was not created.")
        return

    # Copy index.html to templates
    index_src = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_src):
        shutil.copy(index_src, os.path.join(templates_dir, "index.html"))
        print("Copied index.html to templates/")

    # Copy other files to static
    for item in os.listdir(dist_dir):
        if item == "index.html":
            continue
        src = os.path.join(dist_dir, item)
        dst = os.path.join(static_dir, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy(src, dst)
        print(f"Copied {item} to static/")

    print("\nFrontend build processed and integrated with Flask successfully!")

if __name__ == "__main__":
    build()
