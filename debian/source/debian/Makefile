# Build Makefile for Way of Pi .deb package

# Build dependencies:
#   - debhelper (>= 12)
#   - dh-nodejs
#   - git
#   - build-essential

.PHONY: all
all:
	@echo "Building Way of Pi .deb package..."
	dh_testdir
	dh_update
	dh_missing
	dh_installdeb
	dh_installdocs
	dh_installchangelogs debian/changelog
	dh_gencontrol
	dh_md5sums
	dh_builddeb

.PHONY: dist
dist:
	mkdir -p dist
	cpio -ovH1 --owner="$(USER):$(USER)" --verbose -R 'u+rwX,g-w,o-k,0755,0024,0257,/usr/share/doc' -R 0755 --root . dist/$(version).tar.gz

# To build from source:
#   debuild -us -uc
# To rebuild with existing source:
#   dh_clean
#   debuild
