# Real Tree Guy

## Status

The new portal is **not ready for production**. Tree professional access must cost
$30 per month and each customer request must cost $10. Both paid operations are
blocked until Square checkout and verified payment handling are implemented.
Do not deploy the portal for customers yet.

The old account system was browser-only and cannot be migrated into secure
accounts. A new D1 schema stores new accounts, sessions, contacts, requests and
messages separately from existing tables. The migration does not import old
contacts. Existing database data must be backed up and reviewed before any
future migration. Account recovery and email verification are not implemented.

Legacy APIs that did not enforce account ownership are disabled in this Worker
and in the checked-in Pages functions. Calendar, contracts, shop and other
legacy features are not yet restored. Previously deployed Workers, Pages
functions or other origins are not changed by this repository update and must
be reviewed and disabled separately.

## Before launch

1. Establish which Cloudflare account, Worker, D1 database and domains serve
   the site. Back up the database, inspect its existing schema, and apply
   `migrations/0001_portal.sql` only after review. The schema must be present
   before the portal is served.
2. Set up a Square seller account and application. Implement Square-hosted
   subscription and per-post checkout, verified payment events and reconciliation,
   refund/cancellation handling, and safe retries. Never grant access based on a
   browser redirect or subscription status alone. Test all payment scenarios in
   Square sandbox before production. No Square credentials belong in the repository.
3. Implement account recovery and email verification; review the account and
   messaging security, anti-abuse limits, privacy policy and retention practices.
4. Configure HTTPS and DNS for the Worker and its D1 binding, verify the Worker
   handles requests before static assets, and test the full flow on the deployed
   site. Check licensing and operational limits of the weather and geocoding
   providers for the intended commercial use.
5. Rotate any credentials exposed in earlier repository revisions and inspect
   other deployed services for the same exposure. Removing a password from the
   current files does not remove it from Git history.

## Local checks

With Node.js 22.13 or later:

```sh
node --test tests/*.test.mjs
```

Tests use in-memory SQLite and mocked weather responses. They do not prove
Cloudflare, Square, email, DNS or external providers are configured.
