# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Add `CommsAPI.listTenants()` to read the comms tenant registry, returning the organization and tenant `client_id`, `pod_id`, `key_id`, and `created_at` fields. Requires the `comms:read` scope; API-key values are never returned.
