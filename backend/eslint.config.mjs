import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"

export default [
  { files: ["**/*.ts"] },
  { ignores: ["dist/**/*", "cdk.out/**/*"] },
  { languageOptions: { globals: { ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
]
