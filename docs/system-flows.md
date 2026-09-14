# NTDP System Flow Catalogue

## 1. Operator registration and approval

```text
Operator -> Registration form -> Registry -> validation -> TPA review queue
                                                   /              \
                                               approve           reject
                                                  |                |
                                           active operator     reason + audit
                                                  |
                                           compliance workflow
```

The operator record remains authoritative. Approval, rejection and compliance actions are audited.

## 2. TIA membership application and renewal

```text
Operator -> Membership application -> TIA review -> approve/reject -> membership record
                                                                      |
                                                                expiry monitoring
                                                                      |
                                                                 renewal request
```

Membership fees are represented through the commerce abstraction; provider credentials are external to source control.

## 3. Licensing and compliance

```text
Registry operator -> eligibility/documents -> regulatory review -> licence/certification
                                                        -> inspections/compliance
                                                        -> compliant/conditional/non-compliant
                                                        -> public publication eligibility
```

The current platform has lifecycle and compliance foundations. Full licensing and inspection artefacts remain an implementation expansion.

## 4. Registry to reporting

```text
Operational registry + visitor events -> governed facts/snapshots -> Tourism Data Warehouse
                                      -> analytics/reporting -> TPA/provincial insight
```

The baseline introduces analytical facts and operator snapshots. Historical ETL, forecasting and production BI are subsequent warehouse gates.

## 5. GIS flow

```text
Authoritative tourism record -> geospatial asset -> PostGIS -> spatial APIs/layers -> channels/analysis
```

Public exposure is controlled independently of the existence of a geospatial record.

## 6. Distribution to outside channels

```text
Published content/destination -> distribution queue -> Website / Super App / Provincial / Kiosk / Approved Third Parties
```

Distribution is separated from authoring so channel delivery can evolve without duplicate source records.

## 7. Payments and commerce readiness

```text
Application / membership / future booking -> NTDP transaction -> provider adapter
                                      -> initiated -> pending -> settled -> reconciliation
```

Provider credentials, webhook secrets and settlement configuration belong outside source control.
