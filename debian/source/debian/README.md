# Way of Pi Debian Package

This directory contains the Debian packaging files for Way of Pi, a desktop shell for the Pi Coding Agent.

## Table of Contents

- [Quick Start](#quick-start)
- [Building the Package](#building-the-package)
- [Testing the Package](#testing-the-package)
- [File Structure](#file-structure)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Build the Package

```bash
# Install build dependencies
sudo apt update
sudo apt install -y build-essential debhelper dh-nodejs build-essential jq git

# Build the package
./create-package.sh

# Or manually
cd debian/codedir
debuild -us -uc

# Install the built package
sudo dpkg -i ../wayof-pi_*_amd64.deb
```

## Building the Package

### Prerequisites

- Debian/Ubuntu/Linux distribution
- `apt` package manager
- Build dependencies installed

```bash
# Install build dependencies
sudo apt update
sudo apt install -y

# Required for building
build-essential debhelper dh-nodejs git jq

# Optional (recommended)
dh-python debhelper-compat
```

### Build Instructions

**Option 1: Automated build**

```bash
./create-package.sh
```

**Option 2: Manual build**

```bash
# From the repository root
cd '/home/zerwiz/CodeP/Way of pi'

# Install build dependencies
sudo apt update
sudo apt install -y debhelper dh-nodejs dh-python git build-essential

# Build the package
debuild -us -uc

# This will create .deb files in the debian directory
ls debian/*.deb
```

### Build Output

The build process creates:

- `wayof-pi_*.all.deb` - Architecture-independent package
- `wayof-pi_*.amd64.deb` - Debian-specific package
- `wayof-pi_*.buildinfo` - Build information
- `wayof-pi_*.changes` - Changes log

## Testing the Package

### Create a Test Chroot

```bash
# Install a fresh Debian system
apt-cdrom install debian-standard
```

### Install from .deb

```bash
sudo dpkg -i wayof-pi_*.deb
sudo apt-get install -f  # Fix dependencies
wayofpi  # Test the app
```

### Verify Installation

```bash
which wayofpi
wayofpi --version
```

## File Structure

```
debian/
├── copyright           # Copyright information
├── changelog           # Package changelog
├── control             # Package control file
├── rules               # Build rules script
├── README.md           # This file
└── create-package.sh   # Automated build script
```

### Key Files

- `debian/control` - Package metadata, dependencies, and descriptions
- `debian/rules` - Debian packaging rules
- `debian/changelog` - Package version changes
- `debian/copyright` - License information
- `debian/codedir/` - Complete package source directory

## Dependencies

### Build Dependencies

Required to build the package:

- `debhelper (>= 12)`
- `dh-nodejs`
- `dh-python`
- `git`
- `build-essential`
- `jq`

### Runtime Dependencies

Required after installation:

- `bun (>= 1.3.2)` - JavaScript runtime
- `npm` - Node package manager
- `nodejs` - Node.js runtime
- `just` - Task runner
- `xdg-utils` - Desktop integration
- `libgtk-3-0` - GTK 3 libraries
- `libnotify4` - Desktop notifications

### System Dependencies

Required system packages:

- `debconf`
- `tzdata`
- `xdg-user-dirs`
- `xkb-data`
- `at-spi2-core`
- `libatk-bridge2.0-0`
- `libwayland-client0`
- `libnss3`
- `libdbus-1-3`
- `libssl3`
- `libxkbcommon-x11-0`
- `libxcb-cursor0`

## Installation

### From .deb Package

```bash
# Install from .deb
sudo dpkg -i wayof-pi_*.deb
sudo apt-get install -f  # Fix any dependency issues

# Create .env file (required)
cp ~/.pi/.env.example ~/.pi/.env
# Edit ~/.pi/.env with your API keys
```

### From GitHub Release

Download from: https://github.com/zerwiz/wayofpi/releases

```bash
wget https://github.com/zerwiz/wayofpi/releases/download/v1.0.1/wayof-pi_1.0.1_amd64.deb
sudo dpkg -i wayof-pi_1.0.1_amd64.deb
sudo apt-get install -f
```

## Usage

### Running the App

```bash
# Run Way of Pi
wayofpi

# With Electron (recommended for first time)
./start-wayofpi-electron.sh

# Using just (if available)
just wayofpi-electron
```

### Configuration

After installation, create your configuration:

```bash
# Create directories
mkdir -p ~/.pi ~/.config/wayofpi

# Create .env (required for API keys)
cp ~/.pi/.env.example ~/.pi/.env
# Edit ~/.pi/.env

# Create extensions list
touch ~/.pi/settings.json
echo '[]' > ~/.pi/settings.json
```

## Troubleshooting

### API Keys Missing

Create `~/.pi/.env` with your API keys:

```bash
cp ~/.pi/.env.example ~/.pi/.env
nano ~/.pi/.env
```

### Dependencies Missing

Install missing dependencies:

```bash
apt-get update
apt-get install -y $(apt-cache showpkgs | grep -E 'dep$' | xargs awk -F': ' 'NR==2{print $2}')</p>
```

### Build Issues

If debuild fails:

```bash
# Clean and rebuild
make -f debian/Makefile clean
make -f debian/Makefile build

# Or manually
debuild -us -uc
```

### Package Verification

Check package integrity:

```bash
dpkg-deb -f package.deb
dpkg -I package.deb  # Show package contents
```

## License

- App code: MIT
- Extensions: MIT  
- Documentation: CC-BY-SA
- User data: User choice

## Support

- [GitHub Issues](https://github.com/zerwiz/wayofpi/issues)
- [GitHub Repo](https://github.com/zerwiz/wayofpi)
- [Pi Docs](https://github.com/mariozechner/pi-coding-agent)

## Notes

- **Not a pre-compiled binary**: You need bun, npm, git installed
- **Debian policies**: This package follows Debian packaging standards
- **Security**: Uses damage-control for safe command execution
- **Extensions**: Supports loading custom extensions

## Credits

- Created by Zero <zerwiz@proton.me>
- Based on Pi Coding Agent by Mario Zechner
- Part of Way of Pi project
EOF
