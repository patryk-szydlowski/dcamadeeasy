{pkgs, ...}: {
  languages.javascript.enable = true;
  languages.javascript.package = pkgs.nodejs_20;
  languages.javascript.corepack.enable = true;
}
