# build-system.mk - Complete Debian build system for Way of Pi
# ======================================

# Package information
PACKAGE = wayof-pi
VERSION = 1.0.1
MAINTAINER = Zero <zerwiz@proton.me>

# Build directory
BUILD_DIR = $(CURDIR)

# Output directory
OUTPUT_DIR = $(BUILD_DIR)/packages

# Dependencies
BUILD_DEPENDS = \
    debhelper (>= 12)

RUN_DEPENDS = \
    nodejs

# Build rules
.PHONY: build help clean dist

all: help

help:
	@echo "Way of Pi Debian Build System"
	@echo "=============================="
	@echo ""
	@echo "Package: $(PACKAGE)"
	@echo "Version: $(VERSION)"
	@echo ""
	@echo "Commands:"
	@echo "  make build    - Build the package"
	@echo "  make dist     - Create distribution tarball"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make install  - Install dependencies"
	@echo "  make check    - Run tests"
	@echo "  make help     - Show this help"
	@echo ""

# Build the package (default target)
build: check
	@echo "=== Building $(PACKAGE) $(VERSION) ==="
	cd $(BUILD_DIR) && debuild -b -us -uc
	@echo ""
	@echo "=== Build Complete ==="
	@echo "Package files in: $(OUTPUT_DIR)"
	@ls $(OUTPUT_DIR)

# Create distribution tarball for upload
dist: help
	@echo "Creating distribution tarball..."
	@tar czvf $(PACKAGE)_$(VERSION).orig.tar.gz -C $(BUILD_DIR)/.. .
	@echo "Done"

# Clean build artifacts
clean: help
	@echo "Cleaning build artifacts..."
	rm -rf debian/*/usr/share/doc
	rm -rf debian/*/usr/share/doc/wayof-pi
	rm -rf .debhelper
	rm -rf debian-source-build
	@echo "Build cleaned"

# Check dependencies
check: install
	@echo "Checking dependencies..."
	@which dh_builddeb || (echo "dh_builddeb not found. Install with: apt install debhelper" && exit 1)
	@which debuild || (echo "debuild not found. Install with: apt install devtools" && exit 1)
	@echo "Dependencies OK"

# Install build dependencies
install-dependencies: help
	@echo "Installing build dependencies..."
	@echo "sudo apt update"
	@echo "sudo apt install -y debhelper dh-nodejs dh-python git build-essential jq"
	@echo "sudo apt install -y devscripts dh-make"

# List package files
list-files:
	@echo "=== Package Contents ==="
	@cd $(BUILD_DIR) && find debian -type f | sort | head -100

# Display changelog
show-changes:
	@cat $(BUILD_DIR)/debian/changelog

# Install the package
install: build
	@echo "=== Installation ==="
	@dpkg -i $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb

# Create .deb files
make-debs: build

# Verify package integrity
verify: build
	@echo "=== Verifying Package ==="
	@ls -la $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb
	@dpkg-deb -f $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb Package
	@dpkg-deb -f $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb Version
	@dpkg-deb -f $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb Architecture
	@dpkg-deb -f $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb Maintainer
	@echo ""
	@echo "Package verified successfully"

# Show package information
info:
	@echo "=== Package Information ==="
	@dpkg -I $(OUTPUT_DIR)/$(PACKAGE)_$(VERSION)_amd64.deb 2>/dev/null || true
	@echo ""
	@echo "Changelog:"
	@cat $(BUILD_DIR)/debian/changelog

# Create copyright files
create-copyright:
	@echo "Creating copyright file..."
	@mkdir -p $(BUILD_DIR)/copyright
	@echo "Files: ." > $(BUILD_DIR)/copyright/copyright
	@echo "Copyright: $(MAINTAINER)" >> $(BUILD_DIR)/copyright/copyright
	@ls -la

# Create .deb for testing
test-deb: clean build
