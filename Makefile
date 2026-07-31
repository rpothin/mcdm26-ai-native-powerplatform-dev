# Makefile — local developer tooling for Power Apps code apps and Power Platform solutions.
# Targets operate on directories discovered at runtime so no file changes are needed when
# new apps/solutions are added.

# Discover all first-level subdirectories of code-apps/ (each is one Code App workspace).
CODE_APPS := $(shell find code-apps -maxdepth 1 -mindepth 1 -type d 2>/dev/null)

# Discover all first-level subdirectories of solutions/ (each is one unpacked solution).
SOLUTIONS := $(shell find solutions -maxdepth 1 -mindepth 1 -type d 2>/dev/null)

.PHONY: help lint test build validate

## help: list available targets with descriptions (default)
help:
	@echo ""
	@echo "Available targets:"
	@echo "  lint      Run ESLint for every code app (or APP=<name> for one app)"
	@echo "  test      Run unit tests for every code app (or APP=<name> for one app)"
	@echo "  build     Build every code app (or APP=<name> for one app)"
	@echo "  validate  Run lint + pac solution pack (structural check) for every solution"
	@echo ""

## lint: run 'npm run lint' inside each code app directory
lint:
	@if [ -n "$(APP)" ] && [ ! -d "code-apps/$(APP)" ]; then \
		echo "Code app '$(APP)' not found under code-apps/."; \
		exit 1; \
	fi
	@APPS="$(CODE_APPS)"; \
	if [ -n "$(APP)" ]; then APPS="code-apps/$(APP)"; fi; \
	if [ -z "$$APPS" ]; then \
		echo "No code apps found under code-apps/ — skipping lint."; \
	else \
		# Iterate; `set -e` makes the sub-shell exit on first failure, propagating to make. \
		for app in $$APPS; do \
			echo "==> Linting $$app"; \
			(cd $$app && npm run lint); \
		done; \
	fi

## test: run 'npm test' inside each code app directory
test:
	@if [ -n "$(APP)" ] && [ ! -d "code-apps/$(APP)" ]; then \
		echo "Code app '$(APP)' not found under code-apps/."; \
		exit 1; \
	fi
	@APPS="$(CODE_APPS)"; \
	if [ -n "$(APP)" ]; then APPS="code-apps/$(APP)"; fi; \
	if [ -z "$$APPS" ]; then \
		echo "No code apps found under code-apps/ — skipping tests."; \
	else \
		for app in $$APPS; do \
			echo "==> Testing $$app"; \
			(cd $$app && npm test); \
		done; \
	fi

## build: run 'npm run build' inside each code app directory
build:
	@if [ -n "$(APP)" ] && [ ! -d "code-apps/$(APP)" ]; then \
		echo "Code app '$(APP)' not found under code-apps/."; \
		exit 1; \
	fi
	@APPS="$(CODE_APPS)"; \
	if [ -n "$(APP)" ]; then APPS="code-apps/$(APP)"; fi; \
	if [ -z "$$APPS" ]; then \
		echo "No code apps found under code-apps/ — skipping build."; \
	else \
		for app in $$APPS; do \
			echo "==> Building $$app"; \
			(cd $$app && npm run build); \
		done; \
	fi

## validate: run lint, then verify each solution can be packed by PAC CLI
validate: lint
	@# Check PAC CLI availability before iterating to give a clear error message.
	@if ! command -v pac >/dev/null 2>&1; then \
		echo "pac CLI not found — skipping solution pack check. Install from https://aka.ms/PowerAppsCLI"; \
		exit 0; \
	fi
	@if [ -z "$(SOLUTIONS)" ]; then \
		echo "No solutions found under solutions/ — skipping solution pack check."; \
	else \
		for sol in $(SOLUTIONS); do \
			echo "==> Packing $$sol (structural check)"; \
			# Pack to a temp zip; delete immediately — we only care that it succeeds. \
			tmp=$$(mktemp /tmp/pack-XXXXXX.zip); \
			pac solution pack --folder "$$sol" --zipfile "$$tmp" --processCanvasApps; \
			rm -f "$$tmp"; \
		done; \
	fi
