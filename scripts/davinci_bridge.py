import os
import sys
from dotenv import load_dotenv

load_dotenv()

def get_resolve():
    """
    Connects to the DaVinci Resolve instance using the fusionscript library.
    """
    # 1. Set environment variables for the API
    lib_path = os.getenv("RESOLVE_SCRIPT_LIB")
    api_path = os.getenv("RESOLVE_SCRIPT_API")
    
    if not lib_path or not os.path.exists(lib_path):
        print("[ERROR] RESOLVE_SCRIPT_LIB path not found in .env")
        return None

    # Enable fusionscript binding
    try:
        import fusionscript
        resolve = fusionscript.get_resolve()
        if resolve:
            print("[SUCCESS] Successfully connected to DaVinci Resolve.")
            return resolve
    except ImportError:
        # If not in path, try manual import via sys.path
        if api_path and os.path.exists(api_path):
            sys.path.append(api_path)
            try:
                import DaVinciResolveScript as bmd
                resolve = bmd.scriptapp("Resolve")
                if resolve:
                    print("[SUCCESS] Successfully connected to DaVinci Resolve (via BMD module).")
                    return resolve
            except ImportError:
                print("[ERROR] Could not find DaVinciResolveScript module.")
        
    print("[ERROR] Could not connect to DaVinci Resolve. Is it running?")
    return None

def trigger_render(project_name=None):
    """
    Finds the active project and triggers the first render job in the render queue.
    """
    resolve = get_resolve()
    if not resolve: return False

    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    
    if not project:
        print("[ERROR] no active project found.")
        return False
        
    print(f"[INFO] Active Project: {project.GetName()}")
    
    project.StartRendering() 
    print("[INFO] Render sequence started.")
    
    return True

if __name__ == "__main__":
    print("--- circle.d.flow - DaVinci Bridge Testing ---")
    trigger_render()
