import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Aquí antes se cargaba `next/core-web-vitals` y `next/typescript` a través de
 * `FlatCompat`, y el linter no arrancaba: reventaba con
 * `TypeError: Converting circular structure to JSON` antes de mirar un solo
 * fichero.
 *
 * El motivo: `eslint-config-next` (aquí, la 16) ya publica configuración *flat*
 * —un array de objetos, con `plugins` como objeto—. `FlatCompat` está para lo
 * contrario: traducir configuración vieja de `.eslintrc` al formato nuevo. Así
 * que metía esos arrays por el validador del formato antiguo, donde `plugins`
 * tiene que ser una lista de nombres. La validación fallaba, y al ir a imprimir
 * el error `@eslint/eslintrc` hacía `JSON.stringify` del valor rechazado, que
 * es el objeto de plugins y se referencia a sí mismo. De ahí el error de
 * estructura circular: no era el fallo, era el mensaje de fallo rompiéndose, y
 * por eso no había forma de leer qué pasaba.
 *
 * La configuración ya viene flat de origen, así que se importa tal cual y
 * `FlatCompat` sobra.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
