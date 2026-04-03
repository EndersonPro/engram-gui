use std::{collections::HashMap, io::Read};

use serde::{Deserialize, Serialize};

use crate::engram_runtime::config::EngramConfig;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProxyRequest {
    pub route: ProxyRoute,
    pub query: Option<HashMap<String, serde_json::Value>>,
    pub path_params: Option<ProxyPathParams>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProxyPathParams {
    pub id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProxyResponse {
    pub status: u16,
    pub body: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ProxyRoute {
    #[serde(rename = "health")]
    Health,
    #[serde(rename = "sessions.recent")]
    SessionsRecent,
    #[serde(rename = "observations.recent")]
    ObservationsRecent,
    #[serde(rename = "search.query")]
    SearchQuery,
    #[serde(rename = "timeline.list")]
    TimelineList,
    #[serde(rename = "observations.getById")]
    ObservationsGetById,
    #[serde(rename = "prompts.recent")]
    PromptsRecent,
    #[serde(rename = "prompts.search")]
    PromptsSearch,
    #[serde(rename = "context.get")]
    ContextGet,
    #[serde(rename = "export.get")]
    ExportGet,
    #[serde(rename = "stats.get")]
    StatsGet,
    #[serde(rename = "sync.status")]
    SyncStatus,
}

fn route_path(request: &ProxyRequest) -> Result<String, String> {
    let path = match request.route {
        ProxyRoute::Health => "/health".to_string(),
        ProxyRoute::SessionsRecent => "/sessions/recent".to_string(),
        ProxyRoute::ObservationsRecent => "/observations/recent".to_string(),
        ProxyRoute::SearchQuery => "/search".to_string(),
        ProxyRoute::TimelineList => "/timeline".to_string(),
        ProxyRoute::ObservationsGetById => {
            let params = request
                .path_params
                .as_ref()
                .ok_or_else(|| "missing path params for observations.getById route".to_string())?;
            format!("/observations/{}", params.id)
        }
        ProxyRoute::PromptsRecent => "/prompts/recent".to_string(),
        ProxyRoute::PromptsSearch => "/prompts/search".to_string(),
        ProxyRoute::ContextGet => "/context".to_string(),
        ProxyRoute::ExportGet => "/export".to_string(),
        ProxyRoute::StatsGet => "/stats".to_string(),
        ProxyRoute::SyncStatus => "/sync/status".to_string(),
    };

    Ok(path)
}

fn normalize_query(query: Option<&HashMap<String, serde_json::Value>>) -> Vec<(String, String)> {
    query
        .map(|entries| {
            entries
                .iter()
                .filter_map(|(key, value)| {
                    if value.is_null() {
                        return None;
                    }

                    if let Some(string_value) = value.as_str() {
                        return Some((key.clone(), string_value.to_string()));
                    }

                    if let Some(number_value) = value.as_i64() {
                        return Some((key.clone(), number_value.to_string()));
                    }

                    if let Some(number_value) = value.as_u64() {
                        return Some((key.clone(), number_value.to_string()));
                    }

                    if let Some(number_value) = value.as_f64() {
                        return Some((key.clone(), number_value.to_string()));
                    }

                    value
                        .as_bool()
                        .map(|bool_value| (key.clone(), bool_value.to_string()))
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

pub fn proxy_get(config: &EngramConfig, request: &ProxyRequest) -> Result<ProxyResponse, String> {
    let base = config.api_base_url.trim_end_matches('/');
    let path = route_path(request)?;
    let mut url = reqwest::Url::parse(&format!("{}{}", base, path))
        .map_err(|error| format!("invalid api base url: {error}"))?;

    for (key, value) in normalize_query(request.query.as_ref()) {
        url.query_pairs_mut().append_pair(&key, &value);
    }

    let response =
        reqwest::blocking::get(url).map_err(|error| format!("proxy transport error: {error}"))?;
    let status = response.status().as_u16();

    let body = decode_response_body(response)?;

    Ok(ProxyResponse { status, body })
}

fn decode_response_body(
    response: reqwest::blocking::Response,
) -> Result<serde_json::Value, String> {
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .to_string();

    if content_type.contains("application/json") {
        return response
            .json::<serde_json::Value>()
            .map_err(|error| format!("cannot decode json body: {error}"));
    }

    let mut body = String::new();
    let mut stream = response;
    stream
        .read_to_string(&mut body)
        .map_err(|error| format!("cannot read body: {error}"))?;
    Ok(serde_json::Value::String(body))
}

#[cfg(test)]
mod tests {
    use std::{
        collections::HashMap,
        io::{Read, Write},
        net::TcpListener,
        thread,
    };

    use crate::engram_runtime::config::EngramConfig;

    use super::{proxy_get, ProxyRequest, ProxyRoute};

    fn start_search_server_with_snippet(snippet: &'static str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("snippet server should bind");
        let address = listener
            .local_addr()
            .expect("snippet server addr should be available");

        thread::spawn(move || {
            for incoming in listener.incoming() {
                let mut stream = match incoming {
                    Ok(stream) => stream,
                    Err(_) => break,
                };

                let mut buffer = [0_u8; 1024];
                let bytes_read = stream.read(&mut buffer).unwrap_or(0);
                let request = String::from_utf8_lossy(&buffer[..bytes_read]);

                let (status_line, body) = if request.contains("GET /search?q=engram") {
                    (
                        "HTTP/1.1 200 OK",
                        format!(r#"{{"items":[{{"id":"1","snippet":"{}"}}]}}"#, snippet),
                    )
                } else {
                    (
                        "HTTP/1.1 404 Not Found",
                        r#"{"error":"not found"}"#.to_string(),
                    )
                };

                let response = format!(
                    "{status_line}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                    body.len()
                );
                let _ = stream.write_all(response.as_bytes());
            }
        });

        format!("http://{}", address)
    }

    fn start_server() -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("test server should bind");
        let address = listener
            .local_addr()
            .expect("test server addr should be available");

        thread::spawn(move || {
            for incoming in listener.incoming() {
                let mut stream = match incoming {
                    Ok(stream) => stream,
                    Err(_) => break,
                };

                let mut buffer = [0_u8; 1024];
                let bytes_read = stream.read(&mut buffer).unwrap_or(0);
                let request = String::from_utf8_lossy(&buffer[..bytes_read]);

                let (status_line, body) = if request.contains("GET /search?q=engram") {
                    (
                        "HTTP/1.1 200 OK",
                        r#"{"items":[{"id":"1","snippet":"ok"}]}"#,
                    )
                } else if request.contains("GET /timeline") && !request.contains("observation_id") {
                    (
                        "HTTP/1.1 400 Bad Request",
                        r#"{"error":"missing observation_id"}"#,
                    )
                } else {
                    ("HTTP/1.1 404 Not Found", r#"{"error":"not found"}"#)
                };

                let response = format!(
                    "{status_line}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                    body.len()
                );
                let _ = stream.write_all(response.as_bytes());
            }
        });

        format!("http://{}", address)
    }

    fn start_observation_detail_server() -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("observation server should bind");
        let address = listener
            .local_addr()
            .expect("observation server addr should be available");

        thread::spawn(move || {
            for incoming in listener.incoming() {
                let mut stream = match incoming {
                    Ok(stream) => stream,
                    Err(_) => break,
                };

                let mut buffer = [0_u8; 1024];
                let bytes_read = stream.read(&mut buffer).unwrap_or(0);
                let request = String::from_utf8_lossy(&buffer[..bytes_read]);

                let (status_line, body) = if request.contains("GET /observations/42") {
                    (
                        "HTTP/1.1 200 OK",
                        r#"{"id":42,"project":"engram"}"#.to_string(),
                    )
                } else {
                    (
                        "HTTP/1.1 404 Not Found",
                        r#"{"error":"not found"}"#.to_string(),
                    )
                };

                let response = format!(
                    "{status_line}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                    body.len()
                );
                let _ = stream.write_all(response.as_bytes());
            }
        });

        format!("http://{}", address)
    }

    #[test]
    fn proxies_query_string_and_returns_upstream_payload() {
        let base = start_server();
        let config = EngramConfig {
            binary_path: None,
            api_base_url: base,
        };
        let request = ProxyRequest {
            route: ProxyRoute::SearchQuery,
            query: Some(HashMap::from([(
                "q".to_string(),
                serde_json::Value::String("engram".to_string()),
            )])),
            path_params: None,
        };

        let response = proxy_get(&config, &request).expect("proxy call should succeed");

        assert_eq!(response.status, 200);
        assert_eq!(
            response.body["items"][0]["snippet"],
            serde_json::Value::String("ok".to_string())
        );
    }

    #[test]
    fn keeps_upstream_error_status_for_missing_required_query() {
        let base = start_server();
        let config = EngramConfig {
            binary_path: None,
            api_base_url: base,
        };
        let request = ProxyRequest {
            route: ProxyRoute::TimelineList,
            query: None,
            path_params: None,
        };

        let response = proxy_get(&config, &request).expect("proxy should preserve upstream status");

        assert_eq!(response.status, 400);
        assert_eq!(
            response.body["error"],
            serde_json::Value::String("missing observation_id".to_string())
        );
    }

    #[test]
    fn consecutive_calls_honor_endpoint_changes_from_config() {
        let first_endpoint = start_search_server_with_snippet("first-endpoint");
        let second_endpoint = start_search_server_with_snippet("second-endpoint");
        let mut config = EngramConfig {
            binary_path: None,
            api_base_url: first_endpoint,
        };
        let request = ProxyRequest {
            route: ProxyRoute::SearchQuery,
            query: Some(HashMap::from([(
                "q".to_string(),
                serde_json::Value::String("engram".to_string()),
            )])),
            path_params: None,
        };

        let first = proxy_get(&config, &request).expect("first proxy call should succeed");
        assert_eq!(
            first.body["items"][0]["snippet"],
            serde_json::Value::String("first-endpoint".to_string())
        );

        config.api_base_url = second_endpoint;

        let second = proxy_get(&config, &request).expect("second proxy call should succeed");
        assert_eq!(
            second.body["items"][0]["snippet"],
            serde_json::Value::String("second-endpoint".to_string())
        );
    }

    #[test]
    fn supports_all_get_parity_routes_via_request_deserialization() {
        let supported_routes = [
            "health",
            "sessions.recent",
            "observations.recent",
            "search.query",
            "timeline.list",
            "observations.getById",
            "prompts.recent",
            "prompts.search",
            "context.get",
            "export.get",
            "stats.get",
            "sync.status",
        ];

        for route in supported_routes {
            let request = serde_json::json!({ "route": route });
            let parsed = serde_json::from_value::<ProxyRequest>(request);

            assert!(parsed.is_ok(), "route {route} should deserialize");
        }
    }

    #[test]
    fn rejects_removed_synthetic_routes() {
        for route in ["memories.list", "settings.get"] {
            let request = serde_json::json!({ "route": route });
            let parsed = serde_json::from_value::<ProxyRequest>(request);

            assert!(parsed.is_err(), "route {route} must be rejected");
        }
    }

    #[test]
    fn builds_observation_detail_path_from_path_params() {
        let base = start_observation_detail_server();
        let config = EngramConfig {
            binary_path: None,
            api_base_url: base,
        };

        let request = serde_json::from_value::<ProxyRequest>(serde_json::json!({
            "route": "observations.getById",
            "pathParams": { "id": 42 }
        }))
        .expect("request should deserialize");

        let response = proxy_get(&config, &request).expect("proxy call should succeed");

        assert_eq!(response.status, 200);
        assert_eq!(response.body["id"], serde_json::Value::Number(42.into()));
    }
}
