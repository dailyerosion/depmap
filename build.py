"""Build this into a release for depmap-releases.

"""
import os
import sys
import datetime
import subprocess

RELPATH = "/home/akrherz/projects/depmap-releases"
RELEASE = "v%s" % (datetime.datetime.now().strftime("%Y%m%dT%H%M"), )
JSINC = [
    'js/appvars.js',
    'js/nextgen.js',
    'js/start.js'
]


def buildjs():
    """Build (Google Compiler) our javascript release."""
    cmd = (
        "java -jar ~/lib/compiler.jar %s --js_output_file=%s/%s.js"
     ) % (" ".join(["--js=src/%s" % (f, ) for f in JSINC]), RELPATH, RELEASE)
    proc = subprocess.Popen(
        cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    (stdout, stderr) = proc.communicate()
    if stdout != b'' or stderr != b'':
        print("cmd: %s" % (cmd, ))
        print("stdout: %s" % (stdout, ))
        print("stderr: %s" % (stderr, ))
        print("ABORT")
        sys.exit()


def indexhtml():
    """index.html logic."""
    fp = open("%s/index.html" % (RELPATH, ), 'w')
    donework = False
    for line in open("src/index.html"):
        if line.find("<!-- replaceme -->") == -1:
            fp.write(line)
        elif not donework:
            fp.write("<script src=\"%s.js\"></script>\n" % (RELEASE, ))
            donework = True
    fp.close()


def main():
    """Go Main Go."""
    # assemble javascript into release
    buildjs()
    # git tag this repo
    subprocess.call("git tag %s" % (RELEASE, ), shell=True)
    # Edit index.html
    indexhtml()
    # Copy files
    subprocess.call(
        "rsync -av --delete src/css src/images src/lib %s" % (RELPATH, ),
        shell=True)
    # git commit, tag, and push to github
    os.chdir(RELPATH)
    subprocess.call("git add *", shell=True)
    subprocess.call(
        "git commit -m \"depmap release %s\"" % (RELEASE, ), shell=True)
    subprocess.call("git tag %s" % (RELEASE, ), shell=True)
    # Open browser to see what we have
    subprocess.call("gio open http://depmap-releases.local/", shell=True)
    if input("Process with push? y/[n]") == "y":
        subprocess.call("git push --all", shell=True)
    else:
        print("ABORT git push.")


if __name__ == '__main__':
    main()
