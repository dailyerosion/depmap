#!/usr/bin/env python3
"""
Deployment script for depmap project.

This script follows the deployment procedure outlined in DEPLOY.md:
1. Generate version info
2. Build the project
3. Sync to depmap-releases
4. Commit and tag both repositories
5. Push to production
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR
RELEASE_PATH = Path("/home/akrherz/projects/depmap-releases")


class DeploymentError(Exception):
    """Custom exception for deployment errors."""


def run_command(cmd: list, check=True, capture_output=False, cwd=None):
    """Run a command with error handling and logging."""
    cmd_str = " ".join(cmd)
    print(f"📝 Running: {cmd_str}")

    try:
        result = subprocess.run(
            cmd,
            check=check,
            capture_output=capture_output,
            text=True,
            cwd=cwd,
        )

        if capture_output and result.stdout:
            print(f"   Output: {result.stdout.strip()}")

        return result.stdout.strip() if capture_output else None

    except subprocess.CalledProcessError as e:
        error_msg = f"Command failed: {cmd_str}"
        if e.stderr:
            error_msg += f"\nError: {e.stderr}"
        raise DeploymentError(error_msg) from e


def check_git_status():
    """Ensure working directory is clean."""
    print("🔍 Checking git status...")

    try:
        status = run_command(
            ["git", "status", "--porcelain"], capture_output=True
        )
        if status:
            print("⚠️  Working directory has uncommitted changes:")
            print(status)
            response = input("Continue anyway? [y/N]: ").strip().lower()
            if response != "y":
                print("❌ Deployment cancelled")
                sys.exit(1)
        else:
            print("✅ Working directory is clean")
    except DeploymentError:
        print("⚠️  Could not check git status - continuing anyway")


def generate_version() -> Dict[str, Any]:
    """Generate fresh version information."""
    print("🏷️  Generating version information...")

    try:
        run_command(["npm", "run", "version:generate"])

        version_file = PROJECT_DIR / "version.json"
        if not version_file.exists():
            raise DeploymentError("version.json not found after generation")

        with open(version_file) as f:
            version_info = json.load(f)

        print(f"✅ Version: {version_info['display']}")
        print(f"   Full: {version_info['full']}")

        return version_info

    except (FileNotFoundError, json.JSONDecodeError) as e:
        raise DeploymentError(f"Failed to generate version: {e}") from e


def build_project():
    """Build the project using Vite."""
    print("🔨 Building project...")

    try:
        run_command(["npm", "run", "build"])

        dist_dir = PROJECT_DIR / "dist"
        if not dist_dir.exists():
            raise DeploymentError("Build failed - dist directory not found")

        # Check if dist has content
        if not any(dist_dir.iterdir()):
            raise DeploymentError("Build failed - dist directory is empty")

        print("✅ Build completed successfully")
        return dist_dir

    except subprocess.CalledProcessError as e:
        raise DeploymentError(f"Build failed: {e}") from e


def sync_to_releases(dist_dir: Path):
    """Sync built files to depmap-releases directory."""
    print("📦 Syncing files to release directory...")

    if not RELEASE_PATH.exists():
        print(f"   Creating release directory: {RELEASE_PATH}")
        RELEASE_PATH.mkdir(parents=True, exist_ok=True)

    try:
        # Use rsync to copy files
        run_command(
            ["rsync", "-av", "--delete", f"{dist_dir}/", f"{RELEASE_PATH}/"]
        )

        print("✅ Files synced successfully")

    except subprocess.CalledProcessError as e:
        raise DeploymentError(f"Failed to sync files: {e}") from e


def tag_source_repo(version: str):
    """Tag the source repository."""
    print("🏷️  Tagging source repository...")

    try:
        # Check if tag already exists
        existing_tags = run_command(["git", "tag"], capture_output=True)
        if version in existing_tags.split("\n"):
            print(f"   Tag {version} already exists in source repo")
            response = (
                input("   Replace existing tag? [y/N]: ").strip().lower()
            )
            if response == "y":
                run_command(["git", "tag", "-d", version])
            else:
                print("   Keeping existing tag")
                return

        run_command(["git", "tag", version])
        print(f"✅ Tagged source repo with {version}")

    except subprocess.CalledProcessError as e:
        raise DeploymentError(f"Failed to tag source repo: {e}") from e


def commit_and_tag_releases(version: str):
    """Commit and tag the release repository."""
    print("📝 Committing to release repository...")

    try:
        # Change to release directory
        os.chdir(RELEASE_PATH)

        # Check if there are changes to commit
        status = run_command(
            ["git", "status", "--porcelain"], capture_output=True
        )

        if status.strip():
            # Add all files
            run_command(["git", "add", "."])

            # Commit with version message
            commit_msg = f"Release {version}"
            run_command(["git", "commit", "-m", commit_msg])

            # Remove existing tag if it exists
            try:
                run_command(["git", "tag", "-d", version], check=False)
            except subprocess.CalledProcessError:
                pass  # Tag might not exist

            # Create new tag
            run_command(["git", "tag", version])

            print(f"✅ Committed and tagged release repo with {version}")
        else:
            print("   No changes to commit in release repository")

    except subprocess.CalledProcessError as e:
        raise DeploymentError(f"Failed to commit release repo: {e}") from e
    finally:
        # Change back to project directory
        os.chdir(PROJECT_DIR)


def push_repositories():
    """Push both repositories to remote."""
    print("🚀 Ready to push to production...")

    response = input("Push to remote repositories? [y/N]: ").strip().lower()

    if response != "y":
        print("❌ Push cancelled - you can push manually later:")
        print(f"   Source: cd {PROJECT_DIR} && git push --tags")
        release_cmd = f"cd {RELEASE_PATH} && git push --all && git push --tags"
        print(f"   Release: {release_cmd}")
        return

    try:
        # Push source repository tags
        print("   Pushing source repository tags...")
        run_command(["git", "push", "--tags"], cwd=PROJECT_DIR)

        # Push release repository
        print("   Pushing release repository...")
        run_command(["git", "push", "--all"], cwd=RELEASE_PATH)
        run_command(["git", "push", "--tags"], cwd=RELEASE_PATH)

        print("✅ Successfully pushed to production!")

    except subprocess.CalledProcessError as e:
        raise DeploymentError(f"Failed to push repositories: {e}") from e


def open_preview():
    """Open browser preview of the deployment."""
    try:
        print("🌐 Opening browser preview...")
        run_command(
            ["gio", "open", "http://depmap-releases.local/"], check=False
        )
    except subprocess.CalledProcessError:
        print("   Could not open browser preview")


def main():
    """Main deployment workflow."""
    print("🚀 Starting depmap deployment...")
    print("=" * 50)

    try:
        # Step 1: Check git status
        check_git_status()

        # Step 2: Generate version
        version_info = generate_version()
        version = version_info["full"]

        # Step 3: Build project
        dist_dir = build_project()

        # Step 4: Sync to releases
        sync_to_releases(dist_dir)

        # Step 5: Tag source repo
        tag_source_repo(version)

        # Step 6: Commit and tag releases
        commit_and_tag_releases(version)

        # Step 7: Open preview
        open_preview()

        # Step 8: Push to production
        push_repositories()

        print("\n" + "=" * 50)
        print("🎉 Deployment completed successfully!")
        print(f"   Version: {version_info['display']}")
        print(f"   Full version: {version}")

    except DeploymentError as e:
        print(f"\n❌ Deployment failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  Deployment interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
