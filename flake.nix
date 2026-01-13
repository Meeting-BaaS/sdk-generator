{
  description = "Voice Router SDK - Universal speech-to-text router";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem
            nodejs_20
            pnpm

            # Biome for linting/formatting (native Nix package)
            biome

            # Rust toolchain
            rustToolchain
            pkg-config
            openssl

            # .NET ecosystem (for C# SDK generation)
            dotnet-sdk_8
            openapi-generator-cli

            # Useful tools
            git
            jq
          ];

          shellHook = ''
            echo "Voice Router SDK development environment"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo "Rust: $(rustc --version)"
            echo "Biome: $(biome --version)"
            echo ".NET: $(dotnet --version)"
            echo "OpenAPI Generator: $(openapi-generator-cli version 2>/dev/null || echo 'available')"
          '';

          # For openssl-sys crate
          OPENSSL_DIR = "${pkgs.openssl.dev}";
          OPENSSL_LIB_DIR = "${pkgs.openssl.out}/lib";
          PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig";
        };
      }
    );
}
