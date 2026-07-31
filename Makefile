# Makefile — local developer tooling for Power Apps code apps and Power Platform solutions.
# Targets operate on directories discovered at runtime so no file changes are needed when
# new apps/solutions are added.

.DEFAULT_GOAL := help

APP ?=
SOLUTION ?=
CHECKER_GEO ?= UnitedStates

# Discover all first-level subdirectories and sort for deterministic output/order.
CODE_APPS := $(shell find code-apps -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort)
SOLUTIONS := $(shell find solutions -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort)

.PHONY: help \
	app-lint app-test app-build app-gate \
	solution-pack solution-check solution-validate solution-sync

## help: list available targets with descriptions and examples
help:
	@echo ""
	@echo "Available targets:"
	@echo "  app-lint          Lint all code apps (or one with APP=<name>)"
	@echo "  app-test          Test all code apps (or one with APP=<name>)"
	@echo "  app-build         Build all code apps (or one with APP=<name>)"
	@echo "  app-gate          Mandatory pre-push app gate: app-lint + app-test"
	@echo "  solution-pack     Pack all solutions (or one with SOLUTION=<name>)"
	@echo "  solution-check    Run Solution Checker on all solutions (or one with SOLUTION=<name>)"
	@echo "  solution-validate Run solution-pack + solution-check"
	@echo "  solution-sync     If SOLUTION exists locally: sync; otherwise: clone it"
	@echo ""
	@echo "Examples:"
	@echo "  make app-lint"
	@echo "  APP=my-app make app-test"
	@echo "  APP=my-app make app-build"
	@echo "  make app-gate"
	@echo "  make solution-pack"
	@echo "  SOLUTION=CorePlatform make solution-pack"
	@echo "  SOLUTION=CorePlatform make solution-check CHECKER_GEO=Europe"
	@echo "  SOLUTION=CorePlatform make solution-sync"
	@echo "  make solution-validate"
	@echo ""

## app-lint: run 'npm run lint' inside each selected code app directory
app-lint:
	@if [ -n "$(APP)" ] && [ ! -d "code-apps/$(APP)" ]; then \
		echo "Code app '$(APP)' not found under code-apps/."; \
		exit 1; \
	fi
	@APPS="$(CODE_APPS)"; \
	if [ -n "$(APP)" ]; then APPS="code-apps/$(APP)"; fi; \
	if [ -z "$$APPS" ]; then \
		echo "No code apps found under code-apps/ — skipping app-lint."; \
	else \
		# set -e stops on first app failure so CI exits non-zero immediately. \
		set -e; \
		for app in $$APPS; do \
			echo "==> Linting $$app"; \
			(cd "$$app" && npm run lint); \
		done; \
	fi

## app-test: run 'npm test' inside each selected code app directory
app-test:
	@if [ -n "$(APP)" ] && [ ! -d "code-apps/$(APP)" ]; then \
		echo "Code app '$(APP)' not found under code-apps/."; \
		exit 1; \
	fi
	@APPS="$(CODE_APPS)"; \
	if [ -n "$(APP)" ]; then APPS="code-apps/$(APP)"; fi; \
	if [ -z "$$APPS" ]; then \
		echo "No code apps found under code-apps/ — skipping app-test."; \
	else \
		set -e; \
		for app in $$APPS; do \
			echo "==> Testing $$app"; \
			(cd "$$app" && npm test); \
		done; \
	fi

## app-build: run 'npm run build' inside each selected code app directory
app-build:
	@if [ -n "$(APP)" ] && [ ! -d "code-apps/$(APP)" ]; then \
		echo "Code app '$(APP)' not found under code-apps/."; \
		exit 1; \
	fi
	@APPS="$(CODE_APPS)"; \
	if [ -n "$(APP)" ]; then APPS="code-apps/$(APP)"; fi; \
	if [ -z "$$APPS" ]; then \
		echo "No code apps found under code-apps/ — skipping app-build."; \
	else \
		set -e; \
		for app in $$APPS; do \
			echo "==> Building $$app"; \
			(cd "$$app" && npm run build); \
		done; \
	fi

## app-gate: mandatory pre-push gate for code apps
app-gate: app-lint app-test

## solution-pack: structural pack check for each selected solution
solution-pack:
	@if ! command -v pac >/dev/null 2>&1; then \
		echo "pac CLI not found — skipping solution-pack. Install from https://aka.ms/PowerAppsCLI"; \
		exit 0; \
	fi
	@if [ -n "$(SOLUTION)" ] && [ ! -d "solutions/$(SOLUTION)" ]; then \
		echo "Solution '$(SOLUTION)' not found under solutions/."; \
		exit 1; \
	fi
	@SOLS="$(SOLUTIONS)"; \
	if [ -n "$(SOLUTION)" ]; then SOLS="solutions/$(SOLUTION)"; fi; \
	if [ -z "$$SOLS" ]; then \
		echo "No solutions found under solutions/ — skipping solution-pack."; \
	else \
		set -e; \
		for sol in $$SOLS; do \
			echo "==> Packing $$sol (structural check)"; \
			# Pack to a temp zip; delete immediately so no pack artifact lands in git status. \
			tmp=$$(mktemp /tmp/pack-XXXXXX.zip); \
			pac solution pack --folder "$$sol" --zipfile "$$tmp" --processCanvasApps; \
			rm -f "$$tmp"; \
		done; \
	fi

## solution-check: run Power Apps Solution Checker for each selected solution
solution-check:
	@if ! command -v pac >/dev/null 2>&1; then \
		echo "pac CLI not found — skipping solution-check. Install from https://aka.ms/PowerAppsCLI"; \
		exit 0; \
	fi
	@if [ -n "$(SOLUTION)" ] && [ ! -d "solutions/$(SOLUTION)" ]; then \
		echo "Solution '$(SOLUTION)' not found under solutions/."; \
		exit 1; \
	fi
	@SOLS="$(SOLUTIONS)"; \
	if [ -n "$(SOLUTION)" ]; then SOLS="solutions/$(SOLUTION)"; fi; \
	if [ -z "$$SOLS" ]; then \
		echo "No solutions found under solutions/ — skipping solution-check."; \
	else \
		set -e; \
		for sol in $$SOLS; do \
			echo "==> Running solution checker for $$sol"; \
			# The checker consumes zip input, so pack to a temp workspace and clean it after use. \
			tmpdir=$$(mktemp -d); \
			zipfile="$$tmpdir/$$(basename "$$sol").zip"; \
			output="$$tmpdir/checker-output"; \
			pac solution pack --folder "$$sol" --zipfile "$$zipfile" --processCanvasApps; \
			pac solution check --path "$$zipfile" --outputDirectory "$$output" --geo "$(CHECKER_GEO)"; \
			rm -rf "$$tmpdir"; \
		done; \
	fi

## solution-validate: run solution-pack then solution-check
solution-validate: solution-pack solution-check

## solution-sync: clone a missing solution folder or sync an existing one
solution-sync:
	@if ! command -v pac >/dev/null 2>&1; then \
		echo "pac CLI not found — skipping solution-sync. Install from https://aka.ms/PowerAppsCLI"; \
		exit 0; \
	fi
	@mkdir -p solutions
	@if [ -n "$(SOLUTION)" ]; then \
		if [ -d "solutions/$(SOLUTION)" ]; then \
			echo "==> Syncing existing solution solutions/$(SOLUTION)"; \
			pac solution sync --solution-folder "solutions/$(SOLUTION)"; \
		else \
			echo "==> Cloning missing solution $(SOLUTION) into solutions/$(SOLUTION)"; \
			pac solution clone --name "$(SOLUTION)" --outputDirectory "solutions/$(SOLUTION)"; \
		fi; \
	elif [ -z "$(SOLUTIONS)" ]; then \
		echo "No local solutions found. Use SOLUTION=<name> make solution-sync to clone one."; \
	else \
		set -e; \
		for sol in $(SOLUTIONS); do \
			echo "==> Syncing $$sol"; \
			pac solution sync --solution-folder "$$sol"; \
		done; \
	fi
