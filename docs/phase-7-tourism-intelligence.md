# Phase 7 — Tourism Intelligence & Reporting

## Purpose
Provide a governed application-service boundary for TPA intelligence and reporting. Intelligence reads platform-domain repositories through explicit service contracts; it does not access the database directly from UI or AI consumers.

## Initial KPIs
- active operators
- compliant active operators
- published destinations
- published experiences
- provinces represented by published destinations

Visitor-volume and external tourism statistics remain zero/absent until an approved event/analytics source is integrated. The platform must not fabricate tourism statistics.

## Provincial intelligence
Reports are partitioned by province using the same governed domain records. Regulatory operator status is used internally for TPA intelligence and is never exposed through the public visitor API.

## Provenance
Every report carries generation time and a governed source marker. Future external data adapters must identify their source and freshness explicitly.
