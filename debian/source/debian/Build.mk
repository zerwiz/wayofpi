# Build.mk - Way of Pi Debian Package Build Rules

# Build this file to create the .deb package
.PHONY: all dist rebuild packages

all: build

# Main build target
build:
	@echo "=== Building Way of Pi Debian Package ==="
	debuild -us -uc
	@echo "=== .deb packages created ==="

# Rebuild with clean
rebuild: clean build

# Clean temporary files
clean:
	rm -rf debian/*.deb
	rm -rf debian/*.dsc
	rm -rf debian/*.changes
	rm -rf debian/*.orig.tar.gz
	rm -rf debian/*.debian.tar.gz
	@echo ".deb packages cleaned"

# Create packages
packages: build

# Package names
PACKAGE_NAME = wayof-pi
DEB_FILE = $(PACKAGE_NAME)_amd64.deb

# Show package names
show-packages:
	@echo "Package:" $(PACKAGE_NAME)
	@echo "Version:" $(VERSION)
	@echo "Deb file:" $(DEB_FILE)

# Display build status
status:
	@echo "=== Build Status ==="
	@echo "Source directory: $(CURDIR)"
	@echo "Package: $(PACKAGE_NAME)"
	@echo "Version: $(VERSION)"

# Help menu
help:
	@echo ""
	@echo "Way of Pi Debian Package Build"
	@echo "==============================="
	@echo ""
	@echo "Commands:"
	@echo "  make build       - Build the package"
	@echo "  make rebuild     - Clean and rebuild"
	@echo "  make clean       - Clean temporary files"
	@echo "  make packages    - List packages"
	@echo "  make help        - Show this help"
	@echo ""
	@echo "After building, the .deb file will be in:"
	@echo "  debian/source/"

# Install dependencies
install-deps:
	@echo "=== Installing Build Dependencies ==="
	@echo ""
	@echo "Install these packages first:"
	@echo ""
	@echo "  sudo apt update"
	@echo "  sudo apt install build-essential debhelper dh-nodejs git jq"
	@echo ""
	@echo "Then build:"
	@echo "  make build"
	@echo ""
