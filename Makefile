# Execute the "targets" in this file with `make <target>` e.g. `make help`.
#
# You can also run multiple in sequence, e.g. `make clean lint test serve-coverage-report`
#
# See run.sh for more in-depth comments on what each target does.

.PHONY: build clean help install install-dev install-prod install-minimal install-custom install-backend install-frontend install-help lint lint-ci publish-prod publish-test release-prod release-test run run-backend run-frontend run-all serve-coverage-report sync-env test-ci test-quick test test-wheel-locally

build:
	bash run.sh build

clean:
	bash run.sh clean

help:
	bash run.sh help

# Default installation - full development setup
install:
	bash run.sh install

# Different installation profiles
install-dev:
	bash run.sh install dev

install-prod:
	bash run.sh install prod

install-minimal:
	bash run.sh install minimal

install-custom:
	bash run.sh install custom

# Component-specific installations
install-backend:
	bash run.sh install_backend

install-frontend:
	bash run.sh install_frontend

# Show installation help
install-help:
	bash run.sh install_help

lint:
	bash run.sh lint

lint-ci:
	bash run.sh lint:ci

publish-prod:
	bash run.sh publish:prod

publish-test:
	bash run.sh publish:test

release-prod:
	bash run.sh release:prod

release-test:
	bash run.sh release:test

run:
	bash run.sh run

run-backend:
	bash run.sh run backend

run-frontend:
	bash run.sh run frontend

run-all:
	bash run.sh run all

serve-coverage-report:
	bash run.sh serve-coverage-report

sync-env:
	bash run.sh sync_env

test-ci:
	bash run.sh test:ci

test-quick:
	bash run.sh test:quick

test:
	bash run.sh run-tests

test-wheel-locally:
	bash run.sh test:wheel-locally

# For backward compatibility
start-backend: run-backend

start-frontend: run-frontend

start-all: run-all
