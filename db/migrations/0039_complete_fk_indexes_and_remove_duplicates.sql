-- Complete the production advisor foreign-key index set and remove duplicate indexes.
-- Preserve the original *_time gateway indexes used by the deployed schema.

create index if not exists idx_analytics_daily_metric_province
  on analytics.daily_metric_fact(province_code);
create index if not exists idx_analytics_operator_snapshot_operator
  on analytics.operator_snapshot(operator_id);
create index if not exists idx_analytics_operator_snapshot_province
  on analytics.operator_snapshot(province_code);
create index if not exists idx_analytics_visitor_event_destination
  on analytics.visitor_event_fact(destination_id);
create index if not exists idx_analytics_visitor_event_operator
  on analytics.visitor_event_fact(operator_id);

create index if not exists idx_commerce_transaction_events_changed_by
  on commerce.transaction_events(changed_by);
create index if not exists idx_commerce_transactions_operator
  on commerce.transactions(operator_id);

create index if not exists idx_distribution_partner_bindings_channel
  on distribution.partner_channel_bindings(channel_id);
create index if not exists idx_distribution_partner_events_changed_by
  on distribution.partner_events(changed_by);
create index if not exists idx_distribution_partners_approved_by
  on distribution.partners(approved_by);
create index if not exists idx_distribution_publication_events_changed_by
  on distribution.publication_events(changed_by);
create index if not exists idx_distribution_publications_content
  on distribution.publications(content_id);
create index if not exists idx_distribution_publications_destination
  on distribution.publications(destination_id);

create index if not exists idx_gateway_api_clients_created_by
  on gateway.api_clients(created_by);
create index if not exists idx_gateway_api_keys_created_by
  on gateway.api_keys(created_by);
create index if not exists idx_gateway_request_log_api_key
  on gateway.request_log(api_key_id);

drop index if exists gateway.idx_gateway_request_log_client_requested;
drop index if exists gateway.idx_gateway_request_log_route_requested;

