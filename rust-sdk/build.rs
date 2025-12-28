// Build script - currently just rerun triggers
// Generated code will be created via `cargo xtask generate` or scripts

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=specs/");
}
