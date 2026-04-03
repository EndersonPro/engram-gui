pub mod binary;
pub mod config;
pub mod proxy;
pub mod supervisor;

use std::{path::PathBuf, process::Child, sync::Mutex};

use serde::{Deserialize, Serialize};

use crate::commands::status::RuntimeProcessState;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HealthMetadata {
    pub status: String,
    pub checked_at: String,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSnapshot {
    pub process_state: RuntimeProcessState,
    pub managed_pid: Option<u32>,
    pub last_health: Option<HealthMetadata>,
    pub failure_reason: Option<String>,
}

impl RuntimeSnapshot {
    pub fn new() -> Self {
        Self {
            process_state: RuntimeProcessState::Idle,
            managed_pid: None,
            last_health: None,
            failure_reason: None,
        }
    }

    pub fn mark_starting(&mut self, pid: u32) {
        self.process_state = RuntimeProcessState::Starting;
        self.managed_pid = Some(pid);
        self.failure_reason = None;
    }

    pub fn mark_running(&mut self, health: HealthMetadata) {
        self.process_state = RuntimeProcessState::Running;
        self.last_health = Some(health);
        self.failure_reason = None;
    }

    pub fn mark_idle(&mut self) {
        self.process_state = RuntimeProcessState::Idle;
        self.managed_pid = None;
        self.failure_reason = None;
    }

    pub fn mark_error(&mut self, reason: impl Into<String>) {
        self.process_state = RuntimeProcessState::Error;
        self.failure_reason = Some(reason.into());
    }
}

pub struct AppState {
    pub runtime: Mutex<RuntimeSnapshot>,
    pub managed_process: Mutex<Option<Child>>,
    pub config_store: config::ConfigStore,
}

impl AppState {
    pub fn new(config_path_override: Option<PathBuf>) -> Self {
        Self {
            runtime: Mutex::new(RuntimeSnapshot::new()),
            managed_process: Mutex::new(None),
            config_store: config::ConfigStore::new(config_path_override),
        }
    }
}
