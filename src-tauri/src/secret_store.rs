use std::{
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

const KEYCHAIN_SERVICE_NAME: &str = "com.datahelm.app.connection-secret";

pub fn keychain_service_name() -> &'static str {
    KEYCHAIN_SERVICE_NAME
}

pub fn store_secret(profile_name: &str, engine_name: &str, password: &str) -> Result<String, String> {
    let secret_ref = generate_secret_ref(profile_name, engine_name)?;
    run_security_command(&[
        "add-generic-password",
        "-a",
        &secret_ref,
        "-s",
        KEYCHAIN_SERVICE_NAME,
        "-w",
        password,
        "-U",
    ])?;

    Ok(secret_ref)
}

pub fn resolve_secret(secret_ref: &str) -> Result<String, String> {
    let output = Command::new("/usr/bin/security")
        .args([
            "find-generic-password",
            "-a",
            secret_ref,
            "-s",
            KEYCHAIN_SERVICE_NAME,
            "-w",
        ])
        .output()
        .map_err(|error| format!("Keychain lookup failed: {error}"))?;

    if !output.status.success() {
        return Err(format!(
            "Keychain lookup failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    String::from_utf8(output.stdout)
        .map(|value| value.trim().to_string())
        .map_err(|error| format!("Keychain response parsing failed: {error}"))
}

pub fn delete_secret(secret_ref: &str) -> Result<(), String> {
    let output = Command::new("/usr/bin/security")
        .args([
            "delete-generic-password",
            "-a",
            secret_ref,
            "-s",
            KEYCHAIN_SERVICE_NAME,
        ])
        .output()
        .map_err(|error| format!("Keychain delete failed: {error}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    if stderr.contains("could not be found") || stderr.contains("The specified item could not be found") {
        return Ok(());
    }

    Err(format!("Keychain delete failed: {}", stderr.trim()))
}

fn generate_secret_ref(profile_name: &str, engine_name: &str) -> Result<String, String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    let sanitized_name = profile_name
        .chars()
        .map(|character| if character.is_ascii_alphanumeric() { character } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_lowercase();

    Ok(format!(
        "datahelm-{}-{}-{}",
        engine_name,
        if sanitized_name.is_empty() {
            "profile"
        } else {
            &sanitized_name
        },
        timestamp
    ))
}

fn run_security_command(arguments: &[&str]) -> Result<(), String> {
    let output = Command::new("/usr/bin/security")
        .args(arguments)
        .output()
        .map_err(|error| format!("Keychain command failed: {error}"))?;

    if !output.status.success() {
        return Err(format!(
            "Keychain command failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    Ok(())
}
