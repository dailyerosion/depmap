"""Build this into a release for depmap-releases.

"""
import datetime
import os
import subprocess
import sys

RELPATH = "/home/akrherz/projects/depmap-releases"
RELEASE = f"v{datetime.datetime.now():%Y%m%dT%H%M}"
JSINC = ["js/appvars.js", "js/nextgen.js", "js/start.js"]


def buildjs():
    """Build (Google Compiler) our javascript release."""
    fns = " ".join([f"--js=src/{f}" for f in JSINC])
    cmd = (
        f"java -jar ~/lib/compiler.jar {fns} "
        f"--js_output_file={RELPATH}/{RELEASE}.js"
    )
    proc = subprocess.Popen(
        cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    (stdout, stderr) = proc.communicate()
    if stdout != b"" or stderr != b"":
        print(f"cmd: {cmd}")
        print(f"stdout: {stdout}")
        print(f"stderr: {stderr}")
        print("ABORT")
        sys.exit()


def indexhtml():
    """index.html logic."""
    with open(f"{RELPATH}/index.html", "w", encoding="utf-8") as fh:
        donework = False
        with open("src/index.html", "r", encoding="utf-8") as ifh:
            for line in ifh:
                if line.find("WEB_INTERFACE_VERSION") > -1:
                    fh.write(line.replace("WEB_INTERFACE_VERSION", RELEASE))
                    continue
                if line.find("<!-- replaceme -->") == -1:
                    fh.write(line)
                elif not donework:
                    fh.write(f'<script src="{RELEASE}.js"></script>\n')
                    donework = True


def main():
    """Go Main Go."""
    # assemble javascript into release
    buildjs()
    # git tag this repo
    subprocess.call(f"git tag {RELEASE}", shell=True)
    # Edit index.html
    indexhtml()
    # Copy files
    subprocess.call(
        f"rsync -av --delete src/css src/images src/lib {RELPATH}", shell=True
    )
    # git commit, tag, and push to github
    os.chdir(RELPATH)
    subprocess.call("git add *", shell=True)
    subprocess.call(f'git commit -m "depmap release {RELEASE}"', shell=True)
    subprocess.call(f"git tag {RELEASE}", shell=True)
    # Open browser to see what we have
    subprocess.call("gio open http://depmap-releases.local/", shell=True)
    if input("Process with push? y/[n]") == "y":
        subprocess.call("git push --all", shell=True)
    else:
        print("ABORT git push.")


if __name__ == "__main__":
    main()
